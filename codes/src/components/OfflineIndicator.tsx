// Offline Indicator Component
// Shows online/offline status and queued operations count

import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { onConnectionChange } from '@/utils/pwa';
import { getQueueStats } from '@/utils/offlineQueue';
import { Wifi, WifiOff, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface QueueStats {
  total: number;
  pending: number;
  processing: number;
  completed: number;
  failed: number;
}

export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [queueStats, setQueueStats] = useState<QueueStats>({
    total: 0,
    pending: 0,
    processing: 0,
    completed: 0,
    failed: 0,
  });
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    // Listen to connection changes
    const cleanup = onConnectionChange((online) => {
      setIsOnline(online);
      if (online) {
        // Refresh queue stats when coming online
        updateQueueStats();
      }
    });

    // Update queue stats periodically
    updateQueueStats();
    const interval = setInterval(updateQueueStats, 5000); // Every 5 seconds

    // Listen to service worker messages
    const handleSWMessage = (event: MessageEvent) => {
      if (event.data?.type === 'sync-complete' || 
          event.data?.type === 'operation-synced' ||
          event.data?.type === 'operation-failed') {
        updateQueueStats();
      }
    };

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', handleSWMessage);
    }

    return () => {
      cleanup();
      clearInterval(interval);
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('message', handleSWMessage);
      }
    };
  }, []);

  const updateQueueStats = async () => {
    try {
      const stats = await getQueueStats();
      setQueueStats(stats);
    } catch (error) {
      console.error('[OfflineIndicator] Failed to get queue stats:', error);
    }
  };

  // Don't show anything if online and queue is empty
  if (isOnline && queueStats.total === 0) {
    return null;
  }

  const hasQueuedOperations = queueStats.pending > 0 || queueStats.processing > 0;
  const hasFailed = queueStats.failed > 0;

  return (
    <TooltipProvider>
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 items-end">
        {/* Main Status Badge */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="transition-all hover:scale-105"
            >
              <Badge
                variant={isOnline ? (hasFailed ? 'destructive' : 'default') : 'secondary'}
                className={`flex items-center gap-2 px-3 py-2 cursor-pointer shadow-lg ${
                  !isOnline ? 'bg-orange-500 hover:bg-orange-600' : ''
                }`}
              >
                {isOnline ? (
                  <>
                    <Wifi className="w-4 h-4" />
                    <span>Online</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="w-4 h-4" />
                    <span>Offline</span>
                  </>
                )}
                
                {hasQueuedOperations && (
                  <>
                    <span>•</span>
                    <Clock className="w-4 h-4" />
                    <span>{queueStats.pending + queueStats.processing} queued</span>
                  </>
                )}
                
                {hasFailed && (
                  <>
                    <span>•</span>
                    <AlertCircle className="w-4 h-4" />
                    <span>{queueStats.failed} failed</span>
                  </>
                )}
              </Badge>
            </button>
          </TooltipTrigger>
          <TooltipContent side="left" className="max-w-xs">
            <div className="space-y-1">
              <p className="font-semibold">
                {isOnline ? '🟢 Connected to internet' : '🔴 No internet connection'}
              </p>
              {hasQueuedOperations && (
                <p className="text-sm text-muted-foreground">
                  {queueStats.pending + queueStats.processing} operation(s) waiting to sync
                </p>
              )}
              {hasFailed && (
                <p className="text-sm text-red-400">
                  {queueStats.failed} operation(s) failed after 3 retries
                </p>
              )}
              {!isOnline && (
                <p className="text-sm text-muted-foreground mt-2">
                  You can continue working. Changes will sync when connection is restored.
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-2">
                Click for details
              </p>
            </div>
          </TooltipContent>
        </Tooltip>

        {/* Detailed Stats (Expandable) */}
        {showDetails && queueStats.total > 0 && (
          <div className="bg-card border rounded-lg shadow-lg p-4 min-w-[250px] animate-in slide-in-from-bottom-2">
            <h3 className="font-semibold text-sm mb-3">Queue Status</h3>
            
            <div className="space-y-2 text-sm">
              {queueStats.pending > 0 && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-orange-500" />
                    <span>Pending</span>
                  </div>
                  <span className="font-mono text-orange-500">{queueStats.pending}</span>
                </div>
              )}
              
              {queueStats.processing > 0 && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    <span>Processing</span>
                  </div>
                  <span className="font-mono text-blue-500">{queueStats.processing}</span>
                </div>
              )}
              
              {queueStats.completed > 0 && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <span>Completed</span>
                  </div>
                  <span className="font-mono text-green-500">{queueStats.completed}</span>
                </div>
              )}
              
              {queueStats.failed > 0 && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-500" />
                    <span>Failed</span>
                  </div>
                  <span className="font-mono text-red-500">{queueStats.failed}</span>
                </div>
              )}
            </div>

            {!isOnline && hasQueuedOperations && (
              <p className="text-xs text-muted-foreground mt-3 pt-3 border-t">
                💡 Operations will auto-sync when connection is restored
              </p>
            )}
            
            {isOnline && hasQueuedOperations && (
              <p className="text-xs text-muted-foreground mt-3 pt-3 border-t">
                🔄 Syncing to backend...
              </p>
            )}

            <button
              onClick={() => setShowDetails(false)}
              className="text-xs text-muted-foreground hover:text-foreground mt-3 w-full text-center"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
