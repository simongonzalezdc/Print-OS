import type { Metadata } from 'next';
import './globals.css';
import { GlobalErrorBoundary } from '@/components/ui/GlobalErrorBoundary';
import { Toaster } from 'sonner';

export const metadata: Metadata = {
  title: 'VoiceForge 3D - Parametric CAD for 3D Printing',
  description: 'Voice-first, AI-powered parametric 3D design application for Orca Slicer',
  keywords: ['3D printing', 'CAD', 'parametric design', 'JSCAD', 'Orca Slicer', 'voice control'],
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
        <meta name="theme-color" content="#111827" />
      </head>
      <body className="bg-gray-900 text-white antialiased">
        <GlobalErrorBoundary>
          {children}
        </GlobalErrorBoundary>
        <Toaster position="bottom-right" richColors expand />
      </body>
    </html>
  );
}
