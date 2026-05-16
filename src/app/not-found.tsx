// src/app/not-found.tsx
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-4 text-center">
        <h1 className="text-4xl font-extrabold tracking-tight">404</h1>
        <h2 className="text-2xl font-bold tracking-tight">Page not found</h2>
        <p className="text-muted-foreground">
          The page you are looking for doesn't exist or has been moved.
        </p>
        <div className="pt-4 text-center">
          <Link href="/">
            <Button variant="default">Return to Dashboard</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
