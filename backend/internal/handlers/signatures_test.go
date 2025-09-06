// MIT License
// Autor atual: David Assef
// Descrição: Testes do handler de upload de assinaturas
// Data: 04-09-2025

package handlers

import (
    "context"
    "bytes"
    "encoding/json"
    "image"
    "image/color"
    "image/png"
    "io"
    "mime/multipart"
    "net/http"
    "net/http/httptest"
    "testing"

    "github.com/google/uuid"
    "recibofast/internal/config"
    ctxhelper "recibofast/internal/context"
    "recibofast/internal/logging"
    "recibofast/internal/models"
    "recibofast/internal/repositories"
    "recibofast/internal/services"
)

type fakeStorage struct {
    uploaded []struct{ bucket, objectPath, contentType string; size int }
    deleted  []struct{ bucket, objectPath string }
    uploadErr error
    deleteErr error
}

func (f *fakeStorage) UploadObject(ctx context.Context, bucket, objectPath string, content []byte, contentType string) error {
    f.uploaded = append(f.uploaded, struct{ bucket, objectPath, contentType string; size int }{bucket, objectPath, contentType, len(content)})
    return f.uploadErr
}

func (f *fakeStorage) DeleteObject(ctx context.Context, bucket, objectPath string) error {
    f.deleted = append(f.deleted, struct{ bucket, objectPath string }{bucket, objectPath})
    return f.deleteErr
}

type fakeSignRepo struct{ createErr error; created []*models.SignatureRecord }

func (r *fakeSignRepo) Create(ctx context.Context, s *models.SignatureRecord) error {
    r.created = append(r.created, s)
    return r.createErr
}

func newSignatureHandlersForTest(t *testing.T, repo repositories.SignatureRepository, store StorageClient) *SignatureHandlers {
    t.Helper()
    logger := logging.NewLogger("dev")
    cfg := &config.Config{BucketSigns: "signatures"}
    svc := services.NewSignatureService()
    return NewSignatureHandlers(svc, logger, cfg, store, repo)
}

func makePNGBytes(t *testing.T, w, h int) []byte {
    t.Helper()
    img := image.NewRGBA(image.Rect(0, 0, w, h))
    // pinta de preto com borda branca
    for y := 0; y < h; y++ {
        for x := 0; x < w; x++ {
            c := color.RGBA{0, 0, 0, 255}
            if x == 0 || y == 0 || x == w-1 || y == h-1 { c = color.RGBA{255, 255, 255, 255} }
            img.Set(x, y, c)
        }
    }
    var buf bytes.Buffer
    if err := png.Encode(&buf, img); err != nil { t.Fatalf("falha ao gerar png: %v", err) }
    return buf.Bytes()
}

func newMultipartRequest(t *testing.T, fieldName, fileName string, content []byte) (*http.Request, string) {
    t.Helper()
    var body bytes.Buffer
    w := multipart.NewWriter(&body)
    fw, err := w.CreateFormFile(fieldName, fileName)
    if err != nil { t.Fatalf("CreateFormFile err: %v", err) }
    if _, err := io.Copy(fw, bytes.NewReader(content)); err != nil { t.Fatalf("io.Copy err: %v", err) }
    if err := w.Close(); err != nil { t.Fatalf("writer.Close err: %v", err) }
    req := httptest.NewRequest(http.MethodPost, "/api/v1/signatures", &body)
    req.Header.Set("Content-Type", w.FormDataContentType())
    return req, w.FormDataContentType()
}

func TestUploadSignature_Success(t *testing.T) {
    repo := &fakeSignRepo{}
    store := &fakeStorage{}
    h := newSignatureHandlersForTest(t, repo, store)

    pngData := makePNGBytes(t, 4, 4)
    req, _ := newMultipartRequest(t, "file", "sig.png", pngData)
    req = req.WithContext(ctxhelper.SetUserID(req.Context(), uuid.New().String()))
    rr := httptest.NewRecorder()

    h.UploadSignature(rr, req)

    if rr.Code != http.StatusCreated {
        t.Fatalf("status = %d, want %d", rr.Code, http.StatusCreated)
    }
    if len(store.uploaded) != 1 {
        t.Fatalf("upload não realizado, got %d", len(store.uploaded))
    }
    if store.uploaded[0].bucket != "signatures" {
        t.Fatalf("bucket = %s, want signatures", store.uploaded[0].bucket)
    }
    var body struct{
        Status   string                 `json:"status"`
        Metadata models.SignatureMetadata `json:"metadata"`
    }
    if err := json.NewDecoder(rr.Body).Decode(&body); err != nil { t.Fatalf("decode body: %v", err) }
    if body.Status != "uploaded" { t.Fatalf("status body = %s, want uploaded", body.Status) }
    if body.Metadata.FileName != "sig.png" { t.Fatalf("filename = %s, want sig.png", body.Metadata.FileName) }
}

func TestUploadSignature_InvalidPNG(t *testing.T) {
    repo := &fakeSignRepo{}
    store := &fakeStorage{}
    h := newSignatureHandlersForTest(t, repo, store)

    bad := []byte("not a png file")
    req, _ := newMultipartRequest(t, "file", "sig.png", bad)
    req = req.WithContext(ctxhelper.SetUserID(req.Context(), uuid.New().String()))
    rr := httptest.NewRecorder()

    h.UploadSignature(rr, req)

    if rr.Code != http.StatusBadRequest {
        t.Fatalf("status = %d, want %d", rr.Code, http.StatusBadRequest)
    }
}

func TestUploadSignature_TooLarge(t *testing.T) {
    repo := &fakeSignRepo{}
    store := &fakeStorage{}
    h := newSignatureHandlersForTest(t, repo, store)

    big := bytes.Repeat([]byte{0x00}, int(services.MaxSignatureSize+1))
    req, _ := newMultipartRequest(t, "file", "big.png", big)
    req = req.WithContext(ctxhelper.SetUserID(req.Context(), uuid.New().String()))
    rr := httptest.NewRecorder()

    h.UploadSignature(rr, req)

    if rr.Code != http.StatusBadRequest {
        t.Fatalf("status = %d, want %d", rr.Code, http.StatusBadRequest)
    }
}

func TestUploadSignature_RepoErrorTriggersCompensation(t *testing.T) {
    repo := &fakeSignRepo{createErr: io.EOF}
    store := &fakeStorage{}
    h := newSignatureHandlersForTest(t, repo, store)

    pngData := makePNGBytes(t, 2, 2)
    req, _ := newMultipartRequest(t, "file", "sig.png", pngData)
    req = req.WithContext(ctxhelper.SetUserID(req.Context(), uuid.New().String()))
    rr := httptest.NewRecorder()

    // Forçar tempo fixo para reduzir flakiness de path? O handler usa time.Now(), então
    // aqui apenas assert que DeleteObject foi chamado com mesmo bucket do upload.
    h.UploadSignature(rr, req)

    if rr.Code != http.StatusInternalServerError {
        t.Fatalf("status = %d, want %d", rr.Code, http.StatusInternalServerError)
    }
    if len(store.uploaded) != 1 {
        t.Fatalf("esperava 1 upload, got %d", len(store.uploaded))
    }
    if len(store.deleted) != 1 {
        t.Fatalf("esperava 1 delete de compensação, got %d", len(store.deleted))
    }
    if store.deleted[0].bucket != store.uploaded[0].bucket {
        t.Fatalf("bucket delete = %s, bucket upload = %s", store.deleted[0].bucket, store.uploaded[0].bucket)
    }
    if store.deleted[0].objectPath != store.uploaded[0].objectPath {
        t.Fatalf("objectPath delete != upload: %s vs %s", store.deleted[0].objectPath, store.uploaded[0].objectPath)
    }
}
