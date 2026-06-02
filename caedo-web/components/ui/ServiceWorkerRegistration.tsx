'use client';

import { useEffect } from 'react';

/**
 * Client-side component to handle Service Worker registration.
 * This prevents SSR issues in layout.tsx.
 */
import { log } from '@/lib/logger';

export function ServiceWorkerRegistration() {
  useEffect(() => {
    const shouldRegister = 'serviceWorker' in navigator && 
      (process.env.NODE_ENV === 'production' || localStorage.getItem('ENABLE_SW_DEV') === 'true');

    if (shouldRegister) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').then(
          (registration) => {
            log.info('SW registered: ', registration.scope);
          },
          (err) => {
            log.error('SW registration failed: ', err);
          }
        );
      });
    }
  }, []);

  return null;
}
