// Autor: David Assef
// Data: 22-01-2025
// Descrição: Página de gerenciamento de assinaturas digitais
// MIT License

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { PenTool, Upload, Gallery, Info, X } from 'lucide-react';
import { toast } from 'sonner';
import { SignatureUpload } from '@/components/signatures/SignatureUpload';
import { SignatureGallery } from '@/components/signatures/SignatureGallery';
import { SignaturePreview } from '@/components/signatures/SignaturePreview';
import { Signature } from '@/types/signatures';

const Signatures: React.FC = () => {
  const [activeTab, setActiveTab] = useState('gallery');
  const [selectedSignature, setSelectedSignature] = useState<Signature | null>(null);
  const [refreshGallery, setRefreshGallery] = useState(0);

  // Callback para quando uma assinatura é enviada com sucesso
  const handleSignatureUploaded = (signature: Signature) => {
    toast.success('Assinatura enviada com sucesso!');
    setRefreshGallery(prev => prev + 1); // Força atualização da galeria
    setActiveTab('gallery'); // Volta para a galeria
  };

  // Callback para quando uma assinatura é selecionada na galeria
  const handleSignatureSelect = (signature: Signature) => {
    setSelectedSignature(signature);
    setActiveTab('preview');
  };

  // Callback para quando uma assinatura é atualizada ou excluída
  const handleSignatureChange = () => {
    setRefreshGallery(prev => prev + 1);
    setSelectedSignature(null);
    setActiveTab('gallery');
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Cabeçalho */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <PenTool className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Assinaturas Digitais</h1>
            <p className="text-gray-600">Gerencie suas assinaturas para usar nos recibos</p>
          </div>
        </div>

        {/* Informações Importantes */}
        <Alert className="mb-6">
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>Dica:</strong> Você pode fazer upload de imagens de sua assinatura (PNG, JPG, JPEG) 
            com até 5MB. As assinaturas serão redimensionadas automaticamente para uso nos recibos.
          </AlertDescription>
        </Alert>
      </div>

      {/* Conteúdo Principal */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        {/* Navegação das Abas */}
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="gallery" className="flex items-center gap-2">
            <Gallery className="h-4 w-4" />
            Minhas Assinaturas
          </TabsTrigger>
          <TabsTrigger value="upload" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Enviar Nova
          </TabsTrigger>
          <TabsTrigger value="preview" disabled={!selectedSignature} className="flex items-center gap-2">
            <PenTool className="h-4 w-4" />
            Visualizar
          </TabsTrigger>
        </TabsList>

        {/* Aba: Galeria de Assinaturas */}
        <TabsContent value="gallery" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Suas Assinaturas</CardTitle>
            </CardHeader>
            <CardContent>
              <SignatureGallery
                key={refreshGallery} // Força re-render quando refreshGallery muda
                onSignatureSelect={handleSignatureSelect}
                onSignatureChange={handleSignatureChange}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba: Upload de Nova Assinatura */}
        <TabsContent value="upload" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Enviar Nova Assinatura</CardTitle>
                <Button
                  variant="outline"
                  onClick={() => setActiveTab('gallery')}
                  aria-label="Fechar upload"
                  title="Fechar"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <SignatureUpload
                onSignatureUploaded={handleSignatureUploaded}
              />
            </CardContent>
          </Card>

          {/* Instruções de Upload */}
          <Card>
            <CardHeader>
              <CardTitle>Instruções para Upload</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-2">Formatos Aceitos</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• PNG (recomendado para transparência)</li>
                    <li>• JPG/JPEG</li>
                    <li>• Tamanho máximo: 5MB</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Dicas de Qualidade</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Use fundo transparente (PNG)</li>
                    <li>• Assinatura em tinta preta</li>
                    <li>• Boa resolução e contraste</li>
                    <li>• Evite sombras ou reflexos</li>
                  </ul>
                </div>
              </div>

              <Alert>
                <AlertDescription>
                  <strong>Importante:</strong> Certifique-se de que a assinatura é sua e que você tem 
                  autorização para usá-la em documentos oficiais. As assinaturas são armazenadas 
                  de forma segura e privada em sua conta.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba: Preview da Assinatura */}
        <TabsContent value="preview" className="space-y-6">
          {selectedSignature ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Visualizar Assinatura</CardTitle>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedSignature(null);
                      setActiveTab('gallery');
                    }}
                  >
                    Voltar à Galeria
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <SignaturePreview
                  signature={selectedSignature}
                  onSignatureChange={handleSignatureChange}
                />
              </CardContent>
            </Card>
          ) : (
            <Alert>
              <AlertDescription>
                Selecione uma assinatura na galeria para visualizá-la aqui.
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>
      </Tabs>

      {/* Ações Rápidas */}
      <div className="mt-8 flex flex-col sm:flex-row gap-4">
        <Card className="flex-1">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-full">
                <Upload className="h-6 w-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">Primeira Assinatura?</h3>
                <p className="text-sm text-gray-600">Comece enviando sua primeira assinatura digital</p>
              </div>
              <Button
                onClick={() => setActiveTab('upload')}
                disabled={activeTab === 'upload'}
              >
                Enviar
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="flex-1">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-full">
                <PenTool className="h-6 w-6 text-green-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">Gerar Recibo</h3>
                <p className="text-sm text-gray-600">Use suas assinaturas para gerar recibos</p>
              </div>
              <Button
                variant="outline"
                onClick={() => window.location.href = '/recibos/gerar'}
              >
                Gerar
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Signatures;