import type { Metadata } from "next";
import { Inter, Public_Sans } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-body" });
const publicSans = Public_Sans({ subsets: ["latin"], variable: "--font-headline" });

export const metadata: Metadata = {
  title: "NR-1 Survey & Risk Manager",
  description: "MVP para campanhas, coleta anonima, calculo de risco e relatorios auditaveis."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className={`${inter.variable} ${publicSans.variable}`}>{children}</body>
    </html>
  );
}
