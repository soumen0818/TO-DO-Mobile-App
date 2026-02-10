import { useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { deleteExpiredTodos } from '@/lib/todos';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LAST_CLEANUP_KEY = 'lastAutoDeleteCleanup';
const CLEANUP_INTERVAL_HOURS = 6; // Run cleanup every 6 hours

/**
 * Hook to automatically delete expired todos
 * Runs on app mount and periodically
 */
export function useAutoDelete() {
  const { user } = useAuth();
  const hasRunCleanup = useRef(false);

  useEffect(() => {
    if (!user || hasRunCleanup.current) return;

    const runCleanup = async () => {
      try {
        // Check when we last ran cleanup
        const lastCleanupStr = await AsyncStorage.getItem(LAST_CLEANUP_KEY);
        const now = Date.now();
        
        if (lastCleanupStr) {
          const lastCleanup = parseInt(lastCleanupStr, 10);
          const hoursSinceCleanup = (now - lastCleanup) / (1000 * 60 * 60);
          
          // Skip if we ran cleanup recently
          if (hoursSinceCleanup < CLEANUP_INTERVAL_HOURS) {
            console.log(`[AutoDelete] Cleanup skipped (last run ${hoursSinceCleanup.toFixed(1)}h ago)`);
            return;
          }
        }

        // Run the cleanup
        console.log('[AutoDelete] Running cleanup...');
        const result = await deleteExpiredTodos(user.id);
        
        if (result.deletedCount > 0) {
          console.log(`[AutoDelete] Deleted ${result.deletedCount} expired todos`);
        } else {
          console.log('[AutoDelete] No expired todos found');
        }

        // Update last cleanup time
        await AsyncStorage.setItem(LAST_CLEANUP_KEY, now.toString());
        hasRunCleanup.current = true;
      } catch (error) {
        console.error('[AutoDelete] Cleanup failed:', error);
      }
    };

    // Run cleanup after a short delay to not block app load
    const timeoutId = setTimeout(runCleanup, 2000);

    return () => clearTimeout(timeoutId);
  }, [user]);

  // Periodic cleanup while app is running
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(async () => {
      try {
        const result = await deleteExpiredTodos(user.id);
        if (result.deletedCount > 0) {
          console.log(`[AutoDelete] Periodic cleanup: Deleted ${result.deletedCount} expired todos`);
          await AsyncStorage.setItem(LAST_CLEANUP_KEY, Date.now().toString());
        }
      } catch (error) {
        console.error('[AutoDelete] Periodic cleanup failed:', error);
      }
    }, CLEANUP_INTERVAL_HOURS * 60 * 60 * 1000);

    return () => clearInterval(interval);
  }, [user]);
}
