'use client';

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 text-center">
      <div>
        <h1 className="text-2xl font-semibold mb-2">Something went wrong</h1>
        <p className="text-muted-foreground mb-4">{error.message}</p>
        <button onClick={reset} className="bg-primary text-primary-foreground px-4 py-2 rounded-md">
          Try again
        </button>
      </div>
    </div>
  );
}


