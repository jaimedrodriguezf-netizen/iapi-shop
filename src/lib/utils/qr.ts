import QRCode from 'qrcode';

export interface GenerateQROptions {
  margin?: number;
  width?: number;
  darkColor?: string;
  lightColor?: string;
}

const DEFAULT_OPTIONS: GenerateQROptions = {
  margin: 2,
  width: 512,
  darkColor: '#f97316',
  lightColor: '#ffffff',
};

/**
 * Generate a QR code as a Base64 PNG data URI from an absolute URL.
 */
export async function generateQRCodeDataURL(
  url: string,
  options: GenerateQROptions = {}
): Promise<string> {
  const merged = { ...DEFAULT_OPTIONS, ...options };
  try {
    const dataUrl = await QRCode.toDataURL(url, {
      margin: merged.margin,
      width: merged.width,
      color: {
        dark: merged.darkColor!,
        light: merged.lightColor!,
      },
    });
    return dataUrl;
  } catch (err) {
    console.error('Error generating QR code:', err);
    throw new Error('No se pudo generar el código QR.');
  }
}

/**
 * Generate a QR code from a tenant slug.
 * Constructs the absolute URL based on environment and generates the QR.
 *
 * @param slug - The tenant slug (e.g. "mi-tienda")
 * @param baseUrl - Optional base URL override. If not provided, defaults to
 *   "https://iapi.shop" in production or "http://localhost:3000" in development.
 * @returns Base64 PNG data URI of the QR code
 * @throws Error if slug is empty or undefined
 */
export async function generateQR(
  slug: string,
  baseUrl?: string
): Promise<string> {
  if (!slug || slug.trim() === '') {
    throw new Error('Slug is required to generate a QR code.');
  }

  const resolvedBase =
    baseUrl ??
    (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://iapi.shop');

  const url = `${resolvedBase}/${slug}`;
  return generateQRCodeDataURL(url);
}
