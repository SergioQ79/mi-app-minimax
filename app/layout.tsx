import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MiniMax M2.5 Free",
  description: "App de prueba usando MiniMax M2.5 Free vía OpenRouter",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}