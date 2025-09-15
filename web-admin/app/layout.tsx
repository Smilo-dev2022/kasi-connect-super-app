export const metadata = {
  title: "Admin",
  description: "Ward verification dashboard"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header style={{ padding: 16, borderBottom: '1px solid #eee' }}>
          <strong>Ward Admin</strong>
        </header>
        {children}
      </body>
    </html>
  );
}
