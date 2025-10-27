import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "V COIN - 3D SOLAR",
  description: "3D SUN TECH의 태양광 발전 투자 시스템",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
