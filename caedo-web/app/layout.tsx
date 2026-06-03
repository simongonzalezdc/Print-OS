import type { Metadata } from 'next';
import './globals.css';
import { GlobalErrorBoundary } from '@/components/ui/GlobalErrorBoundary';
import { Toaster } from 'sonner';
import { AppShell } from '@/components/navigation/AppShell';
import { ThemeProvider } from '@/lib/theme/provider';
import { ServiceWorkerRegistration } from '@/components/ui/ServiceWorkerRegistration';
import { WebSocketProvider } from '@/components/providers/WebSocketProvider';

export const metadata: Metadata = {
  title: 'CAEDO - Integrated Design & Manufacturing',
  description: 'AI-powered parametric 3D design and production management system',
  keywords: ['3D printing', 'CAD', 'parametric design', 'JSCAD', 'Caedo API', 'Caedo'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#050505" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className="bg-background text-foreground antialiased selection:bg-primary/30">
        <ThemeProvider>
          <WebSocketProvider>
            <GlobalErrorBoundary>
              <AppShell>
                {children}
              </AppShell>
            </GlobalErrorBoundary>
            <Toaster position="bottom-right" richColors theme="dark" expand />
            <ServiceWorkerRegistration />
          </WebSocketProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
