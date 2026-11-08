import type { Metadata } from "next";
import "./globals.css";
import { RuntimeProvider } from "@/components/workspace/runtime";

export const metadata: Metadata = {
  title: "Mola — ResolveQA",
  description:
    "Agentes para reproduzir, corrigir e verificar bugs com evidências, documentação atualizada e suporte aos playbooks da sua empresa.",
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
      <body className="antialiased">
        <RuntimeProvider>{children}</RuntimeProvider>
      </body>
    </html>
  );
}
