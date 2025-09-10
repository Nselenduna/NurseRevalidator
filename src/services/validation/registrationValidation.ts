/**
 * Validation functions for registration fields
 */

/**
 * Validates a full name
 * @param name The full name to validate
 * @returns Error message if invalid, undefined if valid
 */
export const validateFullName = (name: string): string | undefined => {
  if (!name || name.trim().length < 2) {
    return 'Full name is required (minimum 2 characters)';
  }
  
  // Check if name contains at least one space (first and last name)
  if (!name.includes(' ')) {
    return 'Please provide your full name (first and last name)';
  }
  
  return undefined;
};

/**
 * Validates an email address
 * @param email The email to validate
 * @returns Error message if invalid, undefined if valid
 */
export const validateEmail = (email: string): string | undefined => {
  if (!email) {
    return 'Email is required';
  }
  
  // Simple regex for email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return 'Please enter a valid email address';
  }
  
  return undefined;
};

/**
 * Validates an NMC PIN
 * @param pin The NMC PIN to validate
 * @returns Error message if invalid, undefined if valid
 */
export const validateNMCPin = (pin: string): string | undefined => {
  if (!pin) {
    return 'NMC PIN is required';
  }
  
  // Format should be: 2 letters followed by 6 digits (e.g. AB123456)
  const pinRegex = /^[A-Z]{2}\d{6}$/;
  if (!pinRegex.test(pin)) {
    return 'Please enter a valid NMC PIN (e.g. AB123456)';
  }
  
  return undefined;
};

/**
 * Validates a password
 * @param password The password to validate
 * @returns Error message if invalid, undefined if valid
 */
export const validatePassword = (password: string): string | undefined => {
  if (!password) {
    return 'Password is required';
  }
  
  if (password.length < 8) {
    return 'Password must be at least 8 characters';
  }
  
  // Password should contain at least one letter and one number
  const letterRegex = /[A-Za-z]/;
  const numberRegex = /[0-9]/;
  
  if (!letterRegex.test(password)) {
    return 'Password must contain at least one letter';
  }
  
  if (!numberRegex.test(password)) {
    return 'Password must contain at least one number';
  }
  
  return undefined;
};

/**
 * Formats an NMC PIN by removing spaces and ensuring uppercase
 * @param pin The NMC PIN to format
 * @returns Formatted NMC PIN
 */
export const formatNMCPin = (pin: string): string => {
  // Remove spaces, convert to uppercase
  return pin.replace(/\s/g, '').toUpperCase();
};
