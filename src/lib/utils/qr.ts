import QRCode from 'qrcode';

export async function generateQRCodeDataURL(url: string): Promise<string> {
  try {
    const dataUrl = await QRCode.toDataURL(url, {
      margin: 2,
      width: 512,
      color: {
        dark: '#7c3aed', // Orange-600 (nuestro color primario)
        light: '#ffffff',
      },
    });
    return dataUrl;
  } catch (err) {
    console.error('Error generating QR code:', err);
    throw new Error('No se pudo generar el código QR.');
  }
}
