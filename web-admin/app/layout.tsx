import React from 'react';
import process from 'node:process';
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
            <script dangerouslySetInnerHTML={{ __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}', { 'anonymize_ip': true });
            ` }} />
          </>
        )}
      </head>
      <body>
        <header style={{ padding: 16, borderBottom: '1px solid #eee' }}>
          <strong>Ward Admin</strong>
        </header>
        {children}
      </body>
    </html>
  );
}
