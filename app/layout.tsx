import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mola — ResolveQA",
  description: "Trabalho em movimento. Um Kanban em pixel art acompanhado por uma mola animada.",
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
