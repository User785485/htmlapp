'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useNavigationLogging, useWebVitalsLogging } from '@/lib/hooks/useLogging';

export function NavigationLogger() {
  const pathname = usePathname();
  
  // Activer le logging de navigation
  useNavigationLogging();
  
  // Activer le logging des Web Vitals
  useWebVitalsLogging();
  
  useEffect(() => {
    // Logger les changements de route dans Next.js
    console.log(`Navigation vers: ${pathname}`);
  }, [pathname]);
  
  return null;
}
