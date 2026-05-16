'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-4 text-center">
        <h2 className="text-2xl font-bold tracking-tight">Something went wrong!</h2>
        <p className="text-muted-foreground">
          An unexpected error occurred. We've been notified and are looking into it.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Button
            onClick={() => reset()}
            variant="default"
          >
            Try again
          </Button>
          <Button
            onClick={() => window.location.href = '/'}
            variant="outline"
          >
            Go home
          </Button>
        </div>
      </div>
    </div>
  );
}
