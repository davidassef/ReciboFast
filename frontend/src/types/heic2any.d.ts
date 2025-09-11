// MIT License
// Autor atual: David Assef
// Descrição: Declaração de módulo para heic2any (conversão HEIC/HEIF no browser)
// Data: 10-09-2025

declare module 'heic2any' {
  const heic2any: (options: any) => Promise<Blob | Blob[]>;
  export default heic2any;
}
