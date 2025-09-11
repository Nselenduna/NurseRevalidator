export const formatDate = (
  date: Date | string,
  format: string = 'dd MMM yyyy'
): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];
  
  const day = dateObj.getDate().toString().padStart(2, '0');
  const month = months[dateObj.getMonth()];
  const year = dateObj.getFullYear();
  
  if (format === 'yyyy-MM-dd') {
    const monthNum = (dateObj.getMonth() + 1).toString().padStart(2, '0');
    return `${year}-${monthNum}-${day}`;
  }
  
  return `${day} ${month} ${year}`;
};

export const formatDateRelative = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffInDays = Math.floor((dateObj.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffInDays === 0) return 'Today';
  if (diffInDays === 1) return 'Tomorrow';
  if (diffInDays === -1) return 'Yesterday';
  
  if (diffInDays > 1 && diffInDays <= 7) {
    return `In ${diffInDays} days`;
  }
  
  if (diffInDays < -1 && diffInDays >= -7) {
    return `${Math.abs(diffInDays)} days ago`;
  }
  
  return formatDate(dateObj);
};

export const getDaysUntil = (date: Date | string): number => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffInTime = dateObj.getTime() - now.getTime();
  return Math.ceil(diffInTime / (1000 * 60 * 60 * 24));
};

export const isDateInRange = (
  date: Date | string,
  startDate: Date | string,
  endDate: Date | string
): boolean => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const startObj = typeof startDate === 'string' ? new Date(startDate) : startDate;
  const endObj = typeof endDate === 'string' ? new Date(endDate) : endDate;
  
  return dateObj >= startObj && dateObj <= endObj;
};

export const getStartOfDay = (date: Date | string): Date => {
  const dateObj = typeof date === 'string' ? new Date(date) : new Date(date);
  dateObj.setHours(0, 0, 0, 0);
  return dateObj;
};

export const getEndOfDay = (date: Date | string): Date => {
  const dateObj = typeof date === 'string' ? new Date(date) : new Date(date);
  dateObj.setHours(23, 59, 59, 999);
  return dateObj;
};

export const addDays = (date: Date | string, days: number): Date => {
  const dateObj = typeof date === 'string' ? new Date(date) : new Date(date);
  dateObj.setDate(dateObj.getDate() + days);
  return dateObj;
};

export const subtractDays = (date: Date | string, days: number): Date => {
  return addDays(date, -days);
};

export const isSameDay = (date1: Date | string, date2: Date | string): boolean => {
  const dateObj1 = typeof date1 === 'string' ? new Date(date1) : date1;
  const dateObj2 = typeof date2 === 'string' ? new Date(date2) : date2;
  
  return dateObj1.getFullYear() === dateObj2.getFullYear() &&
         dateObj1.getMonth() === dateObj2.getMonth() &&
         dateObj1.getDate() === dateObj2.getDate();
};

export const getMonthYear = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];
  
  return `${months[dateObj.getMonth()]} ${dateObj.getFullYear()}`;
};