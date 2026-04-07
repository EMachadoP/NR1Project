import QRCode from "qrcode";

export async function generateQR(url: string): Promise<string> {
  return QRCode.toDataURL(url, { width: 256, margin: 2 });
}
