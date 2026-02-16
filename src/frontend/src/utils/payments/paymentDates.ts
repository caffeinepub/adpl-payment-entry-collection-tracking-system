import { PaymentEntry, PaymentMode } from '../../backend';

/**
 * Derives the effective payment date from a PaymentEntry based on payment mode.
 * Priority: bankTransferDate (for bank transfers) > chequeDate (for cheques) > createdTimestamp (fallback)
 */
export function getEffectivePaymentDate(payment: PaymentEntry): bigint {
  // For bank transfer payments, use bankTransferDate if available
  if (payment.paymentMode === PaymentMode.bankTransfer && payment.bankTransferDate) {
    return payment.bankTransferDate;
  }
  
  // For cheque payments, use chequeDate if available
  if (payment.paymentMode === PaymentMode.cheque && payment.chequeDate) {
    return payment.chequeDate;
  }
  
  // Fallback to createdTimestamp for all other cases
  return payment.createdTimestamp;
}

/**
 * Converts an HTML date input value (YYYY-MM-DD) to backend Time (nanoseconds since epoch).
 * Returns null if the input is empty or invalid.
 */
export function htmlDateToBackendTime(dateString: string): bigint | null {
  if (!dateString || !dateString.trim()) {
    return null;
  }
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return null;
    }
    // Convert milliseconds to nanoseconds
    return BigInt(date.getTime()) * BigInt(1000000);
  } catch {
    return null;
  }
}

/**
 * Converts backend Time (nanoseconds) to HTML date input format (YYYY-MM-DD).
 * Returns empty string if the timestamp is null or invalid.
 */
export function backendTimeToHtmlDate(timestamp: bigint | null | undefined): string {
  if (!timestamp) {
    return '';
  }
  
  try {
    const date = new Date(Number(timestamp) / 1000000);
    if (isNaN(date.getTime())) {
      return '';
    }
    return date.toISOString().split('T')[0];
  } catch {
    return '';
  }
}
