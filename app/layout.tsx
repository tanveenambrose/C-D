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
                // 1. Hijack console.error to silence hydration mismatch logs in dev
                const originalError = console.error;
                console.error = function(...args) {
                  const msg = typeof args[0] === 'string' ? args[0] : (args[0] && args[0].message ? args[0].message : '');
                  if (
                    msg.includes('bis_skin_checked') || 
                    msg.includes('hydrat') || 
                    msg.includes('server rendered HTML') ||
                    msg.includes('match') ||
                    msg.includes('Extra attributes') ||
                    msg.includes('attribute')
                  ) {
                    return;
                  }
                  originalError.apply(console, args);
                };

                // 2. MutationObserver: Strip extension-injected attributes IMMEDIATELY
                if (typeof MutationObserver !== 'undefined') {
                  const observer = new MutationObserver((mutations) => {
                    for (const mutation of mutations) {
                      if (mutation.type === 'attributes' && mutation.attributeName === 'bis_skin_checked') {
                         (mutation.target as HTMLElement).removeAttribute('bis_skin_checked');
                      }
                      if (mutation.addedNodes) {
                        mutation.addedNodes.forEach(node => {
                          if (node.nodeType === 1) {
                            const el = node as HTMLElement;
                            if (el.hasAttribute('bis_skin_checked')) {
                              el.removeAttribute('bis_skin_checked');
                            }
                            // Also clear children
                            const children = el.querySelectorAll('[bis_skin_checked]');
                            children.forEach(c => c.removeAttribute('bis_skin_checked'));
                          }
                        });
                      }
                    }
                  });

                  observer.observe(document.documentElement, {
                    attributes: true,
                    childList: true,
                    subtree: true,
                    attributeFilter: ['bis_skin_checked']
                  });
                }

                // 3. Global Error Listener
                if (typeof window !== 'undefined') {
                  window.addEventListener('error', function(event) {
                    const msg = event.message || (event.error && event.error.message) || '';
                    if (
                      msg.includes('bis_skin_checked') || 
                      msg.includes('hydrat') || 
                      msg.includes('server rendered HTML')
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
