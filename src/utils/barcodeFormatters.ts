
/**
 * Get initials from a name
 */
export const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map(part => part.charAt(0))
    .join('');
};

/**
 * Format a date to YYYY-MM-DD format
 */
export const formatDateString = (dateStr: string): string => {
  try {
    const date = new Date(dateStr);
    return date.toISOString().split('T')[0];
  } catch (e) {
    return dateStr;
  }
};

/**
 * Format product info into a single line with initials
 */
export const formatProductInfoLine = (
  product: string,
  preparedBy: string,
  preparedDate: string,
  expiryDate: string
): string => {
  const preparedByInitials = getInitials(preparedBy);
  const formattedPrepDate = formatDateString(preparedDate);
  const formattedExpDate = formatDateString(expiryDate);
  
  return `${product} / ${preparedByInitials} / ${formattedPrepDate} / ${formattedExpDate}`;
};
