
import { Analytics } from "@vercel/analytics/react";

export const metadata = {
  title: "Admin",
  description: "Ward verification dashboard"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
