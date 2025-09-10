import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserProfile, DashboardStats, Task } from '../../types/dashboard.types';

const STORAGE_KEYS = {
  USER_PROFILE: '@user_profile',
  DASHBOARD_STATS: '@dashboard_stats',
  TASKS: '@tasks',
  LAST_SYNC: '@last_sync'
};

export class DashboardService {
  static async getUserProfile(): Promise<UserProfile | null> {
    try {
      const profileData = await AsyncStorage.getItem(STORAGE_KEYS.USER_PROFILE);
      if (profileData) {
        const profile = JSON.parse(profileData);
        // Convert date strings back to Date objects
        profile.revalidationDate = new Date(profile.revalidationDate);
        return profile;
      }
      
      // If no profile exists, try to get it from registration data
      const registrationData = await AsyncStorage.getItem('@user_registration');
      if (registrationData) {
        const regData = JSON.parse(registrationData);
        const profile: UserProfile = {
          id: this.generateUserId(),
          fullName: regData.fullName || 'User',
          email: regData.email || '',
          nmcPin: regData.nmcPin || '',
          role: regData.role || 'Registered Nurse',
          workplace: regData.workplace || '',
          experience: regData.experience || '',
          revalidationDate: this.calculateRevalidationDate(),
          initials: this.getInitials(regData.fullName || 'User')
        };
        
        // Save the profile for future use
        await this.saveUserProfile(profile);
        return profile;
      }
      
      return null;
    } catch (error) {
      console.error('Error getting user profile:', error);
      return null;
    }
  }

  static async saveUserProfile(profile: UserProfile): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(profile));
    } catch (error) {
      console.error('Error saving user profile:', error);
    }
  }

  static async getDashboardStats(): Promise<DashboardStats> {
    try {
      const statsData = await AsyncStorage.getItem(STORAGE_KEYS.DASHBOARD_STATS);
      if (statsData) {
        return JSON.parse(statsData);
      }
      
      // Return default stats if none exist
      const defaultStats: DashboardStats = {
        cpdHoursLogged: 0,
        daysUntilRevalidation: await this.calculateDaysUntilRevalidation(),
        completedActivities: 0,
        complianceScore: 85 // Starting score
      };
      
      await this.saveDashboardStats(defaultStats);
      return defaultStats;
    } catch (error) {
      console.error('Error getting dashboard stats:', error);
      return {
        cpdHoursLogged: 0,
        daysUntilRevalidation: 365,
        completedActivities: 0,
        complianceScore: 85
      };
    }
  }

  static async saveDashboardStats(stats: DashboardStats): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.DASHBOARD_STATS, JSON.stringify(stats));
    } catch (error) {
      console.error('Error saving dashboard stats:', error);
    }
  }

  static async getNextTask(): Promise<Task | null> {
    try {
      const tasks = await this.getAllTasks();
      if (tasks.length === 0) {
        return this.getDefaultTask();
      }
      
      // Sort by priority (high first) and due date
      const sortedTasks = tasks.sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
        if (priorityDiff !== 0) return priorityDiff;
        return a.dueDate.getTime() - b.dueDate.getTime();
      });
      
      return sortedTasks[0];
    } catch (error) {
      console.error('Error getting next task:', error);
      return this.getDefaultTask();
    }
  }

  static async getAllTasks(): Promise<Task[]> {
    try {
      const tasksData = await AsyncStorage.getItem(STORAGE_KEYS.TASKS);
      if (tasksData) {
        const tasks = JSON.parse(tasksData);
        // Convert date strings back to Date objects
        return tasks.map((task: any) => ({
          ...task,
          dueDate: new Date(task.dueDate),
          isOverdue: new Date(task.dueDate) < new Date()
        }));
      }
      return [];
    } catch (error) {
      console.error('Error getting tasks:', error);
      return [];
    }
  }

  static async saveTasks(tasks: Task[]): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
    } catch (error) {
      console.error('Error saving tasks:', error);
    }
  }

  static async syncData(): Promise<void> {
    try {
      // In a real app, this would sync with backend
      // For now, we'll just update the last sync time
      await AsyncStorage.setItem(STORAGE_KEYS.LAST_SYNC, new Date().toISOString());
      
      // Update days until revalidation
      const stats = await this.getDashboardStats();
      stats.daysUntilRevalidation = await this.calculateDaysUntilRevalidation();
      await this.saveDashboardStats(stats);
    } catch (error) {
      console.error('Error syncing data:', error);
    }
  }

  static async getLastSyncTime(): Promise<Date | null> {
    try {
      const lastSync = await AsyncStorage.getItem(STORAGE_KEYS.LAST_SYNC);
      return lastSync ? new Date(lastSync) : null;
    } catch (error) {
      console.error('Error getting last sync time:', error);
      return null;
    }
  }

  // Helper methods
  private static generateUserId(): string {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  }

  private static getInitials(fullName: string): string {
    const names = fullName.split(' ');
    if (names.length >= 2) {
      return (names[0][0] + names[names.length - 1][0]).toUpperCase();
    }
    return fullName.substring(0, 2).toUpperCase();
  }

  private static calculateRevalidationDate(): Date {
    // Default to 3 years from now for new users
    const date = new Date();
    date.setFullYear(date.getFullYear() + 3);
    return date;
  }

  private static async calculateDaysUntilRevalidation(): Promise<number> {
    try {
      const profile = await this.getUserProfile();
      if (profile && profile.revalidationDate) {
        const today = new Date();
        const revalidationDate = new Date(profile.revalidationDate);
        const timeDiff = revalidationDate.getTime() - today.getTime();
        return Math.max(0, Math.ceil(timeDiff / (1000 * 3600 * 24)));
      }
      return 365; // Default fallback
    } catch (error) {
      console.error('Error calculating days until revalidation:', error);
      return 365;
    }
  }

  private static getDefaultTask(): Task {
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 7); // Due in 7 days
    
    return {
      id: 'default-task',
      title: 'Complete your profile setup',
      dueDate,
      priority: 'high',
      type: 'revalidation',
      actionLabel: 'Continue Setup',
      description: 'Finish setting up your professional profile to get personalized recommendations.',
      isOverdue: false
    };
  }

  // Time-based greeting
  static getTimeBasedGreeting(userName: string): string {
    const hour = new Date().getHours();
    let greeting = 'Hello';
    
    if (hour < 12) {
      greeting = 'Good morning';
    } else if (hour < 18) {
      greeting = 'Good afternoon';
    } else {
      greeting = 'Good evening';
    }
    
    return `${greeting}, ${userName.split(' ')[0]}`;
  }
}