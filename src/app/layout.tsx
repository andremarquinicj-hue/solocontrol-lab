import type { Metadata } from "next";
import "./globals.css";
import { PwaRegister } from "@/components/PwaRegister";

export const metadata: Metadata = {
  title: "Solocontrol Lab",
  description: "Sistema de ensaios e relatórios normativos da Solocontrol",
  manifest: "/manifest.webmanifest",
  themeColor: "#073769",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body><PwaRegister />{children}</body>
    </html>
  );
}
