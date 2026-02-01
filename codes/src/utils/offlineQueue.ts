// Offline Queue Manager for TCC CRM
// Manages queuing of offline operations and synchronization

import {
  saveToStore,
  getFromStore,
  deleteByKey,
  type QueuedOperation,
} from './indexedDB';

/**
 * Add operation to offline queue
 */
export async function addToQueue(
  operation: Omit<QueuedOperation, 'id' | 'timestamp' | 'retryCount' | 'status'>
): Promise<string> {
  try {
    const queuedOp: QueuedOperation = {
      ...operation,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      retryCount: 0,
      status: 'pending',
    };

    await saveToStore('queue', queuedOp);
    console.log(`[Queue] Added operation: ${operation.resource} ${operation.type} (${queuedOp.id})`);

    return queuedOp.id;
  } catch (error) {
    console.error('[Queue] Failed to add operation:', error);
    throw error;
  }
}

/**
 * Get all queued operations
 */
export async function getQueue(): Promise<QueuedOperation[]> {
  try {
    const queue = await getFromStore<QueuedOperation>('queue');
    return queue.sort((a, b) => a.timestamp - b.timestamp); // FIFO order
  } catch (error) {
    console.error('[Queue] Failed to get queue:', error);
    return [];
  }
}

/**
 * Get pending operations only
 */
export async function getPendingOperations(): Promise<QueuedOperation[]> {
  try {
    const queue = await getQueue();
    return queue.filter((op) => op.status === 'pending');
  } catch (error) {
    console.error('[Queue] Failed to get pending operations:', error);
    return [];
  }
}

/**
 * Get operations by resource type
 */
export async function getOperationsByResource(
  resource: string
): Promise<QueuedOperation[]> {
  try {
    const queue = await getQueue();
    return queue.filter((op) => op.resource === resource);
  } catch (error) {
    console.error('[Queue] Failed to get operations by resource:', error);
    return [];
  }
}

/**
 * Update operation status
 */
export async function updateOperationStatus(
  operationId: string,
  status: QueuedOperation['status'],
  error?: string
): Promise<void> {
  try {
    const queue = await getQueue();
    const operation = queue.find((op) => op.id === operationId);

    if (!operation) {
      throw new Error(`Operation ${operationId} not found`);
    }

    operation.status = status;
    if (error) {
      operation.error = error;
    }

    await saveToStore('queue', operation);
    console.log(`[Queue] Updated operation ${operationId} status: ${status}`);
  } catch (error) {
    console.error('[Queue] Failed to update operation status:', error);
    throw error;
  }
}

/**
 * Increment retry count for failed operation
 */
export async function incrementRetryCount(operationId: string): Promise<number> {
  try {
    const queue = await getQueue();
    const operation = queue.find((op) => op.id === operationId);

    if (!operation) {
      throw new Error(`Operation ${operationId} not found`);
    }

    operation.retryCount++;
    await saveToStore('queue', operation);
    
    console.log(`[Queue] Incremented retry count for ${operationId}: ${operation.retryCount}`);
    return operation.retryCount;
  } catch (error) {
    console.error('[Queue] Failed to increment retry count:', error);
    throw error;
  }
}

/**
 * Remove operation from queue
 */
export async function removeFromQueue(operationId: string): Promise<void> {
  try {
    await deleteByKey('queue', operationId);
    console.log(`[Queue] Removed operation: ${operationId}`);
  } catch (error) {
    console.error('[Queue] Failed to remove operation:', error);
    throw error;
  }
}

/**
 * Clear completed operations from queue
 */
export async function clearCompletedOperations(): Promise<number> {
  try {
    const queue = await getQueue();
    const completed = queue.filter((op) => op.status === 'completed');

    for (const op of completed) {
      await deleteByKey('queue', op.id);
    }

    console.log(`[Queue] Cleared ${completed.length} completed operations`);
    return completed.length;
  } catch (error) {
    console.error('[Queue] Failed to clear completed operations:', error);
    return 0;
  }
}

/**
 * Clear failed operations that exceeded max retries
 */
export async function clearFailedOperations(maxRetries: number = 3): Promise<number> {
  try {
    const queue = await getQueue();
    const failed = queue.filter(
      (op) => op.status === 'failed' && op.retryCount >= maxRetries
    );

    for (const op of failed) {
      await deleteByKey('queue', op.id);
    }

    console.log(`[Queue] Cleared ${failed.length} failed operations`);
    return failed.length;
  } catch (error) {
    console.error('[Queue] Failed to clear failed operations:', error);
    return 0;
  }
}

/**
 * Get queue statistics
 */
export async function getQueueStats(): Promise<{
  total: number;
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  oldestTimestamp: number | null;
  newestTimestamp: number | null;
}> {
  try {
    const queue = await getQueue();

    const stats = {
      total: queue.length,
      pending: queue.filter((op) => op.status === 'pending').length,
      processing: queue.filter((op) => op.status === 'processing').length,
      completed: queue.filter((op) => op.status === 'completed').length,
      failed: queue.filter((op) => op.status === 'failed').length,
      oldestTimestamp: queue.length > 0 ? queue[0].timestamp : null,
      newestTimestamp: queue.length > 0 ? queue[queue.length - 1].timestamp : null,
    };

    return stats;
  } catch (error) {
    console.error('[Queue] Failed to get queue stats:', error);
    return {
      total: 0,
      pending: 0,
      processing: 0,
      completed: 0,
      failed: 0,
      oldestTimestamp: null,
      newestTimestamp: null,
    };
  }
}

/**
 * Check if operation should be retried
 */
export function shouldRetry(operation: QueuedOperation, maxRetries: number = 3): boolean {
  return operation.retryCount < maxRetries && operation.status !== 'completed';
}

/**
 * Calculate retry delay with exponential backoff
 */
export function getRetryDelay(retryCount: number, baseDelay: number = 1000): number {
  // Exponential backoff: 1s, 2s, 4s, 8s, etc.
  return baseDelay * Math.pow(2, retryCount);
}

/**
 * Check if queue is empty
 */
export async function isQueueEmpty(): Promise<boolean> {
  try {
    const queue = await getQueue();
    return queue.length === 0;
  } catch (error) {
    console.error('[Queue] Failed to check if queue is empty:', error);
    return true;
  }
}

/**
 * Get operation by ID
 */
export async function getOperationById(
  operationId: string
): Promise<QueuedOperation | null> {
  try {
    const queue = await getQueue();
    return queue.find((op) => op.id === operationId) || null;
  } catch (error) {
    console.error('[Queue] Failed to get operation by ID:', error);
    return null;
  }
}

/**
 * Clear entire queue (use with caution)
 */
export async function clearQueue(): Promise<void> {
  try {
    const queue = await getQueue();
    for (const op of queue) {
      await deleteByKey('queue', op.id);
    }
    console.log(`[Queue] Cleared entire queue (${queue.length} operations)`);
  } catch (error) {
    console.error('[Queue] Failed to clear queue:', error);
    throw error;
  }
}

/**
 * Detect conflicts in queue (e.g., updating/deleting same resource)
 */
export async function detectConflicts(): Promise<{
  hasConflicts: boolean;
  conflicts: Array<{ operations: QueuedOperation[]; reason: string }>;
}> {
  try {
    const queue = await getPendingOperations();
    const conflicts: Array<{ operations: QueuedOperation[]; reason: string }> = [];

    // Group operations by resource + data ID
    const grouped = new Map<string, QueuedOperation[]>();
    
    for (const op of queue) {
      // Try to extract ID from data
      const dataId = op.data?.memberID || op.data?.donationID || op.data?.id || 'unknown';
      const key = `${op.resource}-${dataId}`;
      
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)!.push(op);
    }

    // Check for conflicts
    for (const [key, ops] of grouped.entries()) {
      if (ops.length > 1) {
        // Multiple operations on same resource
        const hasDelete = ops.some((op) => op.type === 'delete');
        const hasUpdate = ops.some((op) => op.type === 'update');
        
        if (hasDelete && hasUpdate) {
          conflicts.push({
            operations: ops,
            reason: 'Update and delete on same resource',
          });
        } else if (ops.filter((op) => op.type === 'update').length > 1) {
          conflicts.push({
            operations: ops,
            reason: 'Multiple updates on same resource',
          });
        }
      }
    }

    return {
      hasConflicts: conflicts.length > 0,
      conflicts,
    };
  } catch (error) {
    console.error('[Queue] Failed to detect conflicts:', error);
    return { hasConflicts: false, conflicts: [] };
  }
}

/**
 * Priority queue - process operations by priority
 */
export async function getOperationsByPriority(): Promise<QueuedOperation[]> {
  try {
    const queue = await getPendingOperations();
    
    // Priority order: create > update > delete
    const priority = { create: 1, update: 2, delete: 3 };
    
    return queue.sort((a, b) => {
      const aPriority = priority[a.type] || 999;
      const bPriority = priority[b.type] || 999;
      
      if (aPriority !== bPriority) {
        return aPriority - bPriority;
      }
      
      // Same priority - sort by timestamp (FIFO)
      return a.timestamp - b.timestamp;
    });
  } catch (error) {
    console.error('[Queue] Failed to get operations by priority:', error);
    return [];
  }
}

/**
 * Log queue status (for debugging)
 */
export async function logQueueStatus(): Promise<void> {
  try {
    const stats = await getQueueStats();
    console.log('[Queue] Status:', {
      total: stats.total,
      pending: stats.pending,
      processing: stats.processing,
      completed: stats.completed,
      failed: stats.failed,
    });

    if (stats.oldestTimestamp) {
      const age = Math.round((Date.now() - stats.oldestTimestamp) / 1000);
      console.log(`[Queue] Oldest operation: ${age}s ago`);
    }
  } catch (error) {
    console.error('[Queue] Failed to log queue status:', error);
  }
}
