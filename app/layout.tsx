import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mola — ResolveQA",
  description: "Landing, quadro com mola arco-íris e admin de métricas em modo demonstração.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="antialiased">{children}</body>
    </html>
  );
}
