// Date utility functions for evaluation forms

/**
 * Formats a date to YYYYMMDD format
 */
export function formatDateToYYYYMMDD(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}

/**
 * Parses YYYYMMDD format to Date object
 */
export function parseDateFromYYYYMMDD(dateString: string): Date | null {
  if (!dateString || dateString.length !== 8) return null;

  const year = parseInt(dateString.substring(0, 4));
  const month = parseInt(dateString.substring(4, 6)) - 1;
  const day = parseInt(dateString.substring(6, 8));

  const date = new Date(year, month, day);

  // Validate the date
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date;
}

/**
 * Adds months to a date
 */
export function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

/**
 * Adds days to a date
 */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Generate quarterly counseling dates based on evaluation start date
 *
 * @param startDate - Evaluation start date in YYYYMMDD format
 * @param periodMonths - Total period length in months (default: 12)
 * @returns Object with initial and quarterly counseling dates
 */
export function generateQuarterlyCounselingDates(
  startDate: string,
  periodMonths: number = 12
): {
  initial: string;
  quarterly: string[];
} {
  const start = parseDateFromYYYYMMDD(startDate);

  if (!start) {
    return { initial: '', quarterly: [] };
  }

  // Initial counseling: 14 days after start date
  const initialDate = addDays(start, 14);
  const initial = formatDateToYYYYMMDD(initialDate);

  // Generate quarterly counseling dates (every 3 months)
  const quarterly: string[] = [];
  const numQuarters = Math.floor(periodMonths / 3);

  for (let i = 1; i <= numQuarters; i++) {
    const quarterlyDate = addMonths(start, i * 3);
    quarterly.push(formatDateToYYYYMMDD(quarterlyDate));
  }

  // Remove the last quarter if it would be after the evaluation period
  // This ensures we don't schedule counseling beyond the evaluation end date
  if (quarterly.length > 0 && periodMonths < 12) {
    quarterly.pop();
  }

  return { initial, quarterly };
}

/**
 * Validate if a date falls within a period
 */
export function isDateWithinPeriod(
  date: string,
  fromDate: string,
  thruDate: string
): boolean {
  const dateNum = parseInt(date);
  const fromNum = parseInt(fromDate);
  const thruNum = parseInt(thruDate);

  return dateNum >= fromNum && dateNum <= thruNum;
}

/**
 * Calculate the difference in months between two dates
 */
export function monthsDifference(fromDate: string, thruDate: string): number {
  const from = parseDateFromYYYYMMDD(fromDate);
  const thru = parseDateFromYYYYMMDD(thruDate);

  if (!from || !thru) return 0;

  const diffTime = thru.getTime() - from.getTime();
  const diffDays = diffTime / (1000 * 60 * 60 * 24);
  const diffMonths = Math.round(diffDays / 30.44);

  return diffMonths;
}

/**
 * Format YYYYMMDD to readable format (e.g., "15 Jan 2024")
 */
export function formatDateReadable(dateString: string): string {
  const date = parseDateFromYYYYMMDD(dateString);
  if (!date) return dateString;

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const day = date.getDate();
  const month = months[date.getMonth()];
  const year = date.getFullYear();

  return `${day} ${month} ${year}`;
}
