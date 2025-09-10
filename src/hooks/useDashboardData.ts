import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNetInfo } from '@react-native-community/netinfo';
import { DashboardService } from '../services/dashboard/DashboardService';
import { UserProfile, DashboardStats, Task } from '../types/dashboard.types';

interface UseDashboardDataReturn {
  user: UserProfile | null;
  stats: DashboardStats | null;
  nextTask: Task | null;
  isLoading: boolean;
  error: string | null;
  refreshing: boolean;
  lastSync: Date | null;
  onRefresh: () => Promise<void>;
  daysUntilRevalidation: number;
  greeting: string;
}

// Custom hook for managing dashboard data
export const useDashboardData = (): UseDashboardDataReturn => {
  const netInfo = useNetInfo();
  
  // State
  const [user, setUser] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [nextTask, setNextTask] = useState<Task | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);

  // Calculate real-time values
  const daysUntilRevalidation = useMemo(() => {
    if (!user?.revalidationDate) return 0;
    
    const today = new Date();
    const revalidationDate = new Date(user.revalidationDate);
    const timeDiff = revalidationDate.getTime() - today.getTime();
    return Math.max(0, Math.ceil(timeDiff / (1000 * 3600 * 24)));
  }, [user?.revalidationDate]);

  // Generate greeting based on user and time
  const greeting = useMemo(() => {
    if (!user?.fullName) return 'Hello';
    return DashboardService.getTimeBasedGreeting(user.fullName);
  }, [user?.fullName]);

  // Load initial data
  const loadData = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) {
        setIsLoading(true);
      }
      setError(null);

      // Load data concurrently
      const [userProfile, dashboardStats, taskData, syncTime] = await Promise.all([
        DashboardService.getUserProfile(),
        DashboardService.getDashboardStats(),
        DashboardService.getNextTask(),
        DashboardService.getLastSyncTime()
      ]);

      setUser(userProfile);
      setStats(dashboardStats);
      setNextTask(taskData);
      setLastSync(syncTime);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      if (showLoading) {
        setIsLoading(false);
      }
    }
  }, []);

  // Refresh data with pull-to-refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      // Sync data if online
      if (netInfo.isConnected) {
        await DashboardService.syncData();
      }
      
      // Reload data
      await loadData(false);
    } catch (err) {
      console.error('Error refreshing dashboard data:', err);
      setError('Failed to refresh data. Please try again.');
    } finally {
      setRefreshing(false);
    }
  }, [loadData, netInfo.isConnected]);

  // Auto-sync data every 5 minutes when app is active and online
  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    
    const startAutoSync = () => {
      intervalId = setInterval(async () => {
        if (netInfo.isConnected && !refreshing) {
          try {
            await DashboardService.syncData();
            // Update stats only (silent update)
            const updatedStats = await DashboardService.getDashboardStats();
            setStats(updatedStats);
            const syncTime = await DashboardService.getLastSyncTime();
            setLastSync(syncTime);
          } catch (err) {
            console.error('Background sync failed:', err);
          }
        }
      }, 5 * 60 * 1000); // 5 minutes
    };

    startAutoSync();

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [netInfo.isConnected, refreshing]);

  // Initial data load
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Update stats when user changes (recalculate days until revalidation)
  useEffect(() => {
    if (user && stats) {
      const updatedStats = {
        ...stats,
        daysUntilRevalidation
      };
      
      if (updatedStats.daysUntilRevalidation !== stats.daysUntilRevalidation) {
        setStats(updatedStats);
        // Persist the updated stats
        DashboardService.saveDashboardStats(updatedStats);
      }
    }
  }, [user, stats, daysUntilRevalidation]);

  return {
    user,
    stats,
    nextTask,
    isLoading,
    error,
    refreshing,
    lastSync,
    onRefresh,
    daysUntilRevalidation,
    greeting
  };
};

// Custom hook for interval functionality (similar to useInterval pattern)
export const useInterval = (callback: () => void, delay: number | null) => {
  useEffect(() => {
    if (delay === null) return;
    
    const intervalId = setInterval(callback, delay);
    return () => clearInterval(intervalId);
  }, [callback, delay]);
};

export default useDashboardData;