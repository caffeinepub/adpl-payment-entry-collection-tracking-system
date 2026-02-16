/**
 * Utility functions for calculating ageing days from invoice dates
 */

/**
 * Safely parse an invoice date string into a Date object
 * Supports various date formats commonly used in invoices
 * @param dateString - The invoice date string to parse
 * @returns Date object if parseable, null otherwise
 */
export function parseInvoiceDate(dateString: string): Date | null {
  if (!dateString || typeof dateString !== 'string') {
    return null;
  }

  const trimmed = dateString.trim();
  if (!trimmed) {
    return null;
  }

  // Try parsing as ISO date first
  const isoDate = new Date(trimmed);
  if (!isNaN(isoDate.getTime())) {
    return isoDate;
  }

  // Try parsing common formats: DD/MM/YYYY, DD-MM-YYYY, MM/DD/YYYY, etc.
  const datePatterns = [
    /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/, // DD/MM/YYYY or MM/DD/YYYY
    /^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/, // YYYY/MM/DD
  ];

  for (const pattern of datePatterns) {
    const match = trimmed.match(pattern);
    if (match) {
      const [, part1, part2, part3] = match;
      
      // Try different interpretations
      const attempts = [
        new Date(parseInt(part3), parseInt(part2) - 1, parseInt(part1)), // DD/MM/YYYY
        new Date(parseInt(part1), parseInt(part2) - 1, parseInt(part3)), // YYYY/MM/DD
        new Date(parseInt(part3), parseInt(part1) - 1, parseInt(part2)), // MM/DD/YYYY
      ];

      for (const attempt of attempts) {
        if (!isNaN(attempt.getTime()) && attempt.getFullYear() > 1900 && attempt.getFullYear() < 2100) {
          return attempt;
        }
      }
    }
  }

  return null;
}

/**
 * Calculate the number of days between the invoice date and today
 * @param invoiceDate - The invoice date string
 * @returns Number of days (integer) or null if date cannot be parsed
 */
export function calculateAgeingDays(invoiceDate: string): number | null {
  const parsedDate = parseInvoiceDate(invoiceDate);
  if (!parsedDate) {
    return null;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const invoiceDateNormalized = new Date(parsedDate);
  invoiceDateNormalized.setHours(0, 0, 0, 0);

  const diffTime = today.getTime() - invoiceDateNormalized.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  return diffDays;
}

/**
 * Format ageing days for display
 * @param days - Number of days or null
 * @returns Formatted string for display
 */
export function formatAgeingDays(days: number | null): string {
  if (days === null) {
    return '—';
  }
  return days.toString();
}
