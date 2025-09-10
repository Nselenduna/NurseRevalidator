import { NavigationProp } from '@react-navigation/native';

// User profile interface
export interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  nmcPin: string;
  role: string;
  workplace: string;
  experience: string;
  revalidationDate: Date;
  profilePicture?: string;
  initials: string;
}

// Dashboard statistics
export interface DashboardStats {
  cpdHoursLogged: number;
  daysUntilRevalidation: number;
  completedActivities: number;
  complianceScore: number;
}

// Task interface
export interface Task {
  id: string;
  title: string;
  dueDate: Date;
  priority: 'high' | 'medium' | 'low';
  type: 'revalidation' | 'cpd' | 'compliance';
  actionLabel: string;
  description?: string;
  isOverdue: boolean;
}

// Dashboard screen props
export interface DashboardScreenProps {
  navigation: NavigationProp<any>;
}

// Dashboard state interface
export interface DashboardState {
  user: UserProfile;
  stats: DashboardStats;
  nextTask: Task | null;
  isLoading: boolean;
  error: string | null;
}

// Feature tile interface
export interface FeatureTileData {
  id: string;
  icon: string;
  title: string;
  subtitle: string;
  badge?: number;
  onPress: () => void;
  isNew?: boolean;
  glowColor?: string;
}

// Icon names type
export type IconName = 
  | 'registration'
  | 'cpd'
  | 'standards'
  | 'profile'
  | 'notifications'
  | 'settings'
  | 'help';

// Navigation route parameters
export interface RootStackParamList {
  Dashboard: undefined;
  Registration: undefined;
  CPD: undefined;
  Standards: undefined;
  Profile: undefined;
  Notifications: undefined;
  Settings: undefined;
}