import { Loader2 } from 'lucide-react';

/**
 * Loading indicator component
 */
export function LoadingIndicator({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="flex items-center justify-center p-8">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-2" />
        <div className="text-gray-400 text-sm">{message}</div>
      </div>
    </div>
  );
}
