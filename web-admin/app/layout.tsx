export const metadata = {
  title: "Admin",
  description: "Ward verification dashboard"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {process.env.NEXT_PUBLIC_GA_ID && (
          <>
            <script async src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`}></script>
            <script
              dangerouslySetInnerHTML={{
                __html: `
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);} 
                  gtag('js', new Date());
                  gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}', { anonymize_ip: true });
                `,
              }}
            />
          </>
        )}
      </head>
      <body>
        <header style={{ padding: 16, borderBottom: '1px solid #eee', display: 'flex', gap: 16, alignItems: 'center' }}>
          <strong>Ward Admin</strong>
          <nav style={{ display: 'flex', gap: 12 }}>
            <a href="/" style={{ textDecoration: 'none' }}>Dashboard</a>
            <a href="/appeals" style={{ textDecoration: 'none' }}>Appeals</a>
            <a href="/reports" style={{ textDecoration: 'none' }}>Reports</a>
            <a href="/roles" style={{ textDecoration: 'none' }}>Roles</a>
          </nav>
        </header>
        {children}
      </body>
    </html>
  );
}
