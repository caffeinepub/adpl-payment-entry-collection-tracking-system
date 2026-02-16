import { InvoiceStatus } from '../../backend';

/**
 * Normalizes invoice status from various formats (string enum, variant object, or unknown)
 * into a canonical string key for consistent rendering.
 */
export function normalizeInvoiceStatus(
  status: any
): 'unpaid' | 'partiallyPaid' | 'paid' | 'excess' {
  // Handle null/undefined
  if (!status) {
    return 'unpaid';
  }

  // Handle string enum values (from CSV upload or InvoiceStatus enum)
  if (typeof status === 'string') {
    const normalized = status.toLowerCase();
    if (normalized === 'paid') return 'paid';
    if (normalized === 'partiallypaid' || normalized === 'partially paid') return 'partiallyPaid';
    if (normalized === 'excess') return 'excess';
    return 'unpaid';
  }

  // Handle variant-like objects from backend (e.g., { unpaid: null })
  if (typeof status === 'object') {
    if ('paid' in status) return 'paid';
    if ('partiallyPaid' in status) return 'partiallyPaid';
    if ('excess' in status) return 'excess';
    if ('unpaid' in status) return 'unpaid';
  }

  // Fallback to unpaid for unknown formats
  return 'unpaid';
}
