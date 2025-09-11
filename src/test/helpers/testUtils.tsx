import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';

// Mock providers for testing
const AllTheProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <NavigationContainer>
      {children}
    </NavigationContainer>
  );
};

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) => render(ui, { wrapper: AllTheProviders, ...options });

// Re-export everything
export * from '@testing-library/react-native';

// Override render method
export { customRender as render };

// Test data factories
export const createMockCPDEntry = (overrides = {}) => ({
  id: 'test-cpd-1',
  title: 'Test CPD Activity',
  description: 'Test description for CPD activity',
  type: 'course' as const,
  date: '2024-01-15T10:00:00.000Z',
  duration: 2.5,
  learningOutcomes: ['Learning outcome 1', 'Learning outcome 2'],
  nmcCategories: [
    { id: 'prioritise_people', name: 'Prioritise People' },
  ],
  evidence: [],
  createdAt: '2024-01-15T10:00:00.000Z',
  updatedAt: '2024-01-15T10:00:00.000Z',
  syncStatus: 'synced' as const,
  isDeleted: false,
  ...overrides,
});

export const createMockUser = (overrides = {}) => ({
  id: 'test-user-1',
  firstName: 'Test',
  lastName: 'User',
  email: 'test@example.com',
  nmcPin: 'TEST123',
  profession: 'nurse' as const,
  currentEmployer: 'Test Hospital',
  registrationStatus: 'active' as const,
  registrationExpiry: '2025-01-15T00:00:00.000Z',
  ...overrides,
});

export const createMockRegistration = (overrides = {}) => ({
  id: 'test-reg-1',
  userId: 'test-user-1',
  nmcPin: 'TEST123',
  registrationNumber: 'REG123456',
  profession: 'nurse' as const,
  registrationType: 'initial' as const,
  status: 'active' as const,
  expiryDate: '2025-01-15T00:00:00.000Z',
  lastRenewalDate: '2024-01-15T00:00:00.000Z',
  nextRenewalDate: '2025-01-15T00:00:00.000Z',
  cpdRequiredHours: 35,
  cpdCompletedHours: 20,
  ...overrides,
});

export const createMockStandard = (overrides = {}) => ({
  id: '1.1',
  categoryId: 'prioritise_people',
  code: '1.1',
  title: 'Treat people as individuals and uphold their dignity',
  description: 'Treat people with kindness, respect and compassion.',
  keywords: ['dignity', 'respect', 'individual'],
  examples: ['Listening to what people are telling you'],
  relatedGuidance: ['Equality, diversity and inclusion guidance'],
  practicalApplications: ['Always knock before entering a patient\'s room'],
  lastUpdated: '2024-01-15T00:00:00Z',
  isCritical: true,
  cpdHours: 2,
  ...overrides,
});

// Mock async storage helpers
export const mockAsyncStorage = {
  setItem: jest.fn(),
  getItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  getAllKeys: jest.fn(() => Promise.resolve([])),
  multiGet: jest.fn(() => Promise.resolve([])),
  multiSet: jest.fn(() => Promise.resolve()),
  multiRemove: jest.fn(() => Promise.resolve()),
};

// Mock navigation helpers
export const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
  reset: jest.fn(),
  setParams: jest.fn(),
  addListener: jest.fn(),
  removeListener: jest.fn(),
  canGoBack: jest.fn(() => true),
  isFocused: jest.fn(() => true),
  dispatch: jest.fn(),
  setOptions: jest.fn(),
  getParent: jest.fn(),
  getState: jest.fn(),
};

export const mockRoute = {
  key: 'test-route',
  name: 'TestScreen',
  params: {},
};

// Helper to wait for async operations
export const waitForAsync = () => new Promise(resolve => setTimeout(resolve, 0));

// Helper to trigger haptic feedback in tests
export const triggerHaptic = jest.fn();

// Helper to mock date/time
export const mockDateNow = (date: string) => {
  const mockDate = new Date(date);
  jest.spyOn(Date, 'now').mockReturnValue(mockDate.getTime());
  jest.spyOn(global, 'Date').mockImplementation(() => mockDate);
};

// Cleanup helper
export const cleanupMocks = () => {
  jest.clearAllMocks();
  jest.restoreAllMocks();
};