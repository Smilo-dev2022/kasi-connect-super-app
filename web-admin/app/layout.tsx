import React, { type ReactNode } from 'react';

export const metadata = {
  title: "Admin",
  description: "Ward verification dashboard"
};

const GA_ID = (globalThis as any)?.process?.env?.NEXT_PUBLIC_GA_ID as string | undefined;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        {GA_ID && (
          <>
            <script async src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}></script>
            <script dangerouslySetInnerHTML={{ __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${GA_ID}', { 'anonymize_ip': true });
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
