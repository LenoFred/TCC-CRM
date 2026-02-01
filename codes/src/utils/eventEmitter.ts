/**
 * Event Emitter Service
 * Simple pub/sub system for broadcasting data refresh events across components
 * Used for cache invalidation and real-time data updates
 */

type EventListener = (data?: any) => void;

interface EventMap {
  'data-refresh': { type: 'members' | 'groupMembers' | 'dashboard' | 'all' };
  'members-updated': void;
  'form-ingest-complete': { newMemberCount: number };
}

class EventEmitter {
  private listeners: Map<string, Set<EventListener>> = new Map();

  /**
   * Subscribe to an event
   * @param event - Event name to listen for
   * @param callback - Function to call when event is emitted
   * @returns Unsubscribe function
   */
  on<K extends keyof EventMap>(
    event: K,
    callback: (data: EventMap[K]) => void
  ): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }

    const listeners = this.listeners.get(event)!;
    listeners.add(callback as EventListener);

    // Return unsubscribe function
    return () => {
      listeners.delete(callback as EventListener);
    };
  }

  /**
   * Subscribe to an event (one-time only)
   */
  once<K extends keyof EventMap>(
    event: K,
    callback: (data: EventMap[K]) => void
  ): () => void {
    const unsubscribe = this.on(event, (data: any) => {
      callback(data);
      unsubscribe();
    });

    return unsubscribe;
  }

  /**
   * Emit an event to all listeners
   */
  emit<K extends keyof EventMap>(event: K, data?: EventMap[K]): void {
    console.log(`[EventEmitter] Emitting event: ${String(event)}`, data);

    if (!this.listeners.has(event)) {
      return;
    }

    const listeners = this.listeners.get(event)!;
    listeners.forEach((callback) => {
      try {
        callback(data as any);
      } catch (error) {
        console.error(`[EventEmitter] Error in listener for ${String(event)}:`, error);
      }
    });
  }

  /**
   * Remove all listeners for an event
   */
  off(event: string): void {
    this.listeners.delete(event);
  }

  /**
   * Clear all listeners
   */
  clear(): void {
    this.listeners.clear();
  }

  /**
   * Get listener count for debugging
   */
  listenerCount(event: string): number {
    return this.listeners.get(event)?.size || 0;
  }
}

// Export singleton instance
export const eventEmitter = new EventEmitter();

export default eventEmitter;
