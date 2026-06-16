import "./globals.css";

export const metadata = {
  title: "Elite Gamers Lounge",
  description: "Elite Gamers Lounge — Level up, connect, and conquer.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body>{children}</body>
    </html>
  );
}
