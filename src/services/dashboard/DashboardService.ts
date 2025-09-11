import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserProfile, DashboardStats, Task } from '../../types/dashboard.types';

const USER_PROFILE_KEY = 'user_profile';
const DASHBOARD_STATS_KEY = 'dashboard_stats';
const LAST_SYNC_KEY = 'dashboard_last_sync';
const TASKS_KEY = 'dashboard_tasks';

export interface DashboardServiceInterface {
  getUserProfile(): Promise<UserProfile | null>;
  saveUserProfile(profile: UserProfile): Promise<void>;
  getDashboardStats(): Promise<DashboardStats>;
  saveDashboardStats(stats: DashboardStats): Promise<void>;
  getNextTask(): Promise<Task | null>;
  getLastSyncTime(): Promise<Date | null>;
  syncData(): Promise<void>;
  getTimeBasedGreeting(fullName: string): string;
}

export class DashboardService implements DashboardServiceInterface {

  async getUserProfile(): Promise<UserProfile | null> {
    try {
      const data = await AsyncStorage.getItem(USER_PROFILE_KEY);
      if (!data) {
        // Return mock user if no profile exists
        return this.createMockUserProfile();
      }
      
      const profile = JSON.parse(data);
      return {
        ...profile,
        revalidationDate: new Date(profile.revalidationDate),
      };
    } catch (error) {
      console.error('Error getting user profile:', error);
      return this.createMockUserProfile();
    }
  }

  async saveUserProfile(profile: UserProfile): Promise<void> {
    try {
      await AsyncStorage.setItem(USER_PROFILE_KEY, JSON.stringify(profile));
    } catch (error) {
      console.error('Error saving user profile:', error);
      throw error;
    }
  }

  async getDashboardStats(): Promise<DashboardStats> {
    try {
      const data = await AsyncStorage.getItem(DASHBOARD_STATS_KEY);
      if (!data) {
        return this.calculateDefaultStats();
      }
      
      const stats = JSON.parse(data);
      return stats;
    } catch (error) {
      console.error('Error getting dashboard stats:', error);
      return this.calculateDefaultStats();
    }
  }

  async saveDashboardStats(stats: DashboardStats): Promise<void> {
    try {
      await AsyncStorage.setItem(DASHBOARD_STATS_KEY, JSON.stringify(stats));
    } catch (error) {
      console.error('Error saving dashboard stats:', error);
      throw error;
    }
  }

  async getNextTask(): Promise<Task | null> {
    try {
      const data = await AsyncStorage.getItem(TASKS_KEY);
      if (!data) {
        return this.generateMockTask();
      }
      
      const tasks = JSON.parse(data);
      if (tasks.length === 0) {
        return this.generateMockTask();
      }
      
      // Return the highest priority task that's not overdue
      const sortedTasks = tasks
        .map((task: any) => ({
          ...task,
          dueDate: new Date(task.dueDate),
          isOverdue: new Date(task.dueDate) < new Date(),
        }))
        .sort((a: Task, b: Task) => {
          // Sort by priority (high > medium > low) then by due date
          const priorityWeight = { high: 3, medium: 2, low: 1 };
          if (a.priority !== b.priority) {
            return priorityWeight[b.priority] - priorityWeight[a.priority];
          }
          return a.dueDate.getTime() - b.dueDate.getTime();
        });
      
      return sortedTasks[0] || null;
    } catch (error) {
      console.error('Error getting next task:', error);
      return this.generateMockTask();
    }
  }

  async getLastSyncTime(): Promise<Date | null> {
    try {
      const data = await AsyncStorage.getItem(LAST_SYNC_KEY);
      if (!data) return null;
      return new Date(data);
    } catch (error) {
      console.error('Error getting last sync time:', error);
      return null;
    }
  }

  async syncData(): Promise<void> {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Update last sync time
      await AsyncStorage.setItem(LAST_SYNC_KEY, new Date().toISOString());
      
      // In a real app, this would sync with backend APIs
      console.log('Dashboard data synced successfully');
    } catch (error) {
      console.error('Error syncing dashboard data:', error);
      throw error;
    }
  }

  getTimeBasedGreeting(fullName: string): string {
    const hour = new Date().getHours();
    const firstName = fullName.split(' ')[0];
    
    if (hour < 12) {
      return `Good morning, ${firstName}`;
    } else if (hour < 17) {
      return `Good afternoon, ${firstName}`;
    } else {
      return `Good evening, ${firstName}`;
    }
  }

  // Private helper methods
  private createMockUserProfile(): UserProfile {
    const mockNames = ['Sarah Johnson', 'Emma Thompson', 'Michael Brown', 'Jessica Davis', 'David Wilson'];
    const mockWorkplaces = ['Royal London Hospital', 'Birmingham General', 'Manchester Royal', 'Leeds Teaching Hospital'];
    const mockRoles = ['Registered Nurse', 'Senior Staff Nurse', 'Ward Manager', 'Clinical Specialist'];
    
    const fullName = mockNames[Math.floor(Math.random() * mockNames.length)];
    const nameParts = fullName.split(' ');
    const initials = nameParts.map(part => part.charAt(0)).join('');
    
    // Set revalidation date 1-3 years in the future
    const revalidationDate = new Date();
    revalidationDate.setFullYear(revalidationDate.getFullYear() + Math.floor(Math.random() * 3) + 1);
    
    return {
      id: `user_${Date.now()}`,
      fullName,
      email: `${fullName.toLowerCase().replace(' ', '.')}@nhs.uk`,
      nmcPin: this.generateNMCPin(),
      role: mockRoles[Math.floor(Math.random() * mockRoles.length)],
      workplace: mockWorkplaces[Math.floor(Math.random() * mockWorkplaces.length)],
      experience: `${Math.floor(Math.random() * 15) + 2} years`,
      revalidationDate,
      initials,
    };
  }

  private generateNMCPin(): string {
    // Generate a realistic NMC PIN format (2 digits + 1 letter + 4 digits + 1 letter)
    const digits1 = Math.floor(Math.random() * 90) + 10; // 10-99
    const letter1 = String.fromCharCode(65 + Math.floor(Math.random() * 26)); // A-Z
    const digits2 = Math.floor(Math.random() * 9000) + 1000; // 1000-9999
    const letter2 = String.fromCharCode(65 + Math.floor(Math.random() * 26)); // A-Z
    
    return `${digits1}${letter1}${digits2}${letter2}`;
  }

  private calculateDefaultStats(): DashboardStats {
    // Generate realistic mock stats
    const cpdHoursLogged = Math.floor(Math.random() * 40) + 5; // 5-45 hours
    const completedActivities = Math.floor(Math.random() * 20) + 3; // 3-23 activities
    
    // Calculate days until revalidation (assuming 3-year cycle)
    const today = new Date();
    const nextRevalidation = new Date();
    nextRevalidation.setFullYear(nextRevalidation.getFullYear() + 3);
    const daysUntilRevalidation = Math.ceil((nextRevalidation.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    // Calculate compliance score based on CPD hours (35 hours required annually)
    const requiredHours = 35;
    const complianceScore = Math.min(100, Math.round((cpdHoursLogged / requiredHours) * 100));
    
    return {
      cpdHoursLogged,
      daysUntilRevalidation,
      completedActivities,
      complianceScore,
    };
  }

  private generateMockTask(): Task {
    const taskTemplates = [
      {
        title: 'Complete Annual CPD Requirements',
        type: 'cpd' as const,
        priority: 'high' as const,
        actionLabel: 'Log CPD Hours',
        description: 'You need to log at least 35 CPD hours to meet NMC requirements.',
        daysFromNow: 30,
      },
      {
        title: 'Update Professional Registration',
        type: 'revalidation' as const,
        priority: 'medium' as const,
        actionLabel: 'View Status',
        description: 'Check your registration status and renewal requirements.',
        daysFromNow: 60,
      },
      {
        title: 'Review Professional Standards',
        type: 'compliance' as const,
        priority: 'low' as const,
        actionLabel: 'Read Standards',
        description: 'Stay up-to-date with the latest NMC professional standards.',
        daysFromNow: 14,
      },
    ];
    
    const template = taskTemplates[Math.floor(Math.random() * taskTemplates.length)];
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + template.daysFromNow);
    
    return {
      id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: template.title,
      dueDate,
      priority: template.priority,
      type: template.type,
      actionLabel: template.actionLabel,
      description: template.description,
      isOverdue: false,
    };
  }

  // Additional utility methods
  async updateUserProfile(updates: Partial<UserProfile>): Promise<UserProfile> {
    try {
      const currentProfile = await this.getUserProfile();
      if (!currentProfile) {
        throw new Error('No user profile found');
      }
      
      const updatedProfile = { ...currentProfile, ...updates };
      await this.saveUserProfile(updatedProfile);
      return updatedProfile;
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  }

  async refreshStats(): Promise<DashboardStats> {
    try {
      // In a real app, this would fetch fresh data from APIs
      const stats = await this.getDashboardStats();
      
      // Recalculate time-sensitive stats
      const today = new Date();
      const user = await this.getUserProfile();
      
      if (user?.revalidationDate) {
        const daysUntilRevalidation = Math.ceil(
          (user.revalidationDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
        );
        
        const updatedStats = {
          ...stats,
          daysUntilRevalidation: Math.max(0, daysUntilRevalidation),
        };
        
        await this.saveDashboardStats(updatedStats);
        return updatedStats;
      }
      
      return stats;
    } catch (error) {
      console.error('Error refreshing stats:', error);
      throw error;
    }
  }

  async createTask(task: Omit<Task, 'id' | 'isOverdue'>): Promise<Task> {
    try {
      const tasks = await this.getAllTasks();
      const newTask: Task = {
        ...task,
        id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        isOverdue: task.dueDate < new Date(),
      };
      
      tasks.push(newTask);
      await AsyncStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
      
      return newTask;
    } catch (error) {
      console.error('Error creating task:', error);
      throw error;
    }
  }

  async getAllTasks(): Promise<Task[]> {
    try {
      const data = await AsyncStorage.getItem(TASKS_KEY);
      if (!data) return [];
      
      const tasks = JSON.parse(data);
      return tasks.map((task: any) => ({
        ...task,
        dueDate: new Date(task.dueDate),
        isOverdue: new Date(task.dueDate) < new Date(),
      }));
    } catch (error) {
      console.error('Error getting all tasks:', error);
      return [];
    }
  }

  async completeTask(taskId: string): Promise<void> {
    try {
      const tasks = await this.getAllTasks();
      const filteredTasks = tasks.filter(task => task.id !== taskId);
      await AsyncStorage.setItem(TASKS_KEY, JSON.stringify(filteredTasks));
    } catch (error) {
      console.error('Error completing task:', error);
      throw error;
    }
  }

  async clearAllData(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        USER_PROFILE_KEY,
        DASHBOARD_STATS_KEY,
        LAST_SYNC_KEY,
        TASKS_KEY,
      ]);
      console.log('Dashboard data cleared successfully');
    } catch (error) {
      console.error('Error clearing dashboard data:', error);
      throw error;
    }
  }
}

// Export singleton instance for static usage
const dashboardServiceInstance = new DashboardService();
export default dashboardServiceInstance;