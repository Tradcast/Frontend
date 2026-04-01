import "./globals.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <div className="relative flex min-h-screen flex-col">{children}</div>
      </body>
    </html>
  );
}
