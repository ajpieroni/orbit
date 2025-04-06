'use client';

import React, { useEffect, useState } from 'react';

interface ClientBodyProps {
  children: React.ReactNode;
}

export function ClientBody({ children }: ClientBodyProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <body className="antialiased">
      {mounted && children}
    </body>
  );
} 