import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["300", "400", "600", "700"],
  variable: "--font-outfit",
});

export const metadata: Metadata = {
  title: "C&D | All-in-One File Converter",
  description: "Fast, secure, and free online file converter for documents, images, and videos.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning bis-skin-checked="0">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                const originalError = console.error;
                console.error = function(...args) {
                  const msg = typeof args[0] === 'string' ? args[0] : (args[0] && args[0].message ? args[0].message : '');
                  if (
                    msg.includes('bis_skin_checked') || 
                    msg.includes('hydrat') || 
                    msg.includes('server rendered HTML') ||
                    msg.includes('match') ||
                    msg.includes('Extra attributes from the server') ||
                    msg.includes('attribute')
                  ) {
                    return;
                  }
                  originalError.apply(console, args);
                };

                if (typeof window !== 'undefined') {
                  window.addEventListener('error', function(event) {
                    const msg = event.message || (event.error && event.error.message) || '';
                    if (
                      msg.includes('bis_skin_checked') || 
                      msg.includes('hydrat') || 
                      msg.includes('server rendered HTML') ||
                      msg.includes('Extra attributes')
                    ) {
                      event.stopImmediatePropagation();
                      event.preventDefault();
                    }
                  }, true);
                }
              })();
            `,
          }}
        />
      </head>
      <body className={outfit.variable} suppressHydrationWarning bis-skin-checked="0">
        {children}
      </body>
    </html>
  );
}
