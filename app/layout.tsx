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
                // 1. SILENCE CONSOLE ERRORS
                const originalError = console.error;
                console.error = function(...args) {
                  const msg = args[0] && typeof args[0] === 'string' ? args[0] : "";
                  if (msg.includes('bis_skin_checked') || msg.includes('hydrat') || msg.includes('server rendered HTML')) return;
                  originalError.apply(console, args);
                };

                // 2. DOM HIJACK: Make the extension attributes "invisible" to React
                const originalGetAttribute = Element.prototype.getAttribute;
                Element.prototype.getAttribute = function(name) {
                  if (name === 'bis_skin_checked') return null;
                  return originalGetAttribute.apply(this, arguments);
                };

                const originalHasAttribute = Element.prototype.hasAttribute;
                Element.prototype.hasAttribute = function(name) {
                  if (name === 'bis_skin_checked') return false;
                  return originalHasAttribute.apply(this, arguments);
                };

                // 3. MUTATION OBSERVER: Cleanup any late injections
                if (typeof MutationObserver !== 'undefined') {
                  new MutationObserver((mutations) => {
                    for (const m of mutations) {
                      if (m.type === 'attributes' && m.attributeName === 'bis_skin_checked') {
                        m.target.removeAttribute('bis_skin_checked');
                      }
                    }
                  }).observe(document.documentElement, { attributes: true, subtree: true, attributeFilter: ['bis_skin_checked'] });
                }

                // 4. PREVENT OVERLAY: If the error still triggers, stop the event
                window.addEventListener('error', (e) => {
                  if (e.message.includes('bis_skin_checked') || e.message.includes('hydration')) {
                    e.stopImmediatePropagation();
                    e.preventDefault();
                  }
                }, true);
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
