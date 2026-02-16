import type { PaymentLine } from '../../types/payment';

export function validatePaymentEntry(
  paymentType: string,
  paymentLines: PaymentLine[]
): string[] {
  const errors: string[] = [];

  if (!paymentType) {
    errors.push('Payment type is required');
  }

  if (paymentLines.length === 0) {
    errors.push('At least one payment line is required');
  }

  let hasValidAmount = false;

  for (const line of paymentLines) {
    if (line.mode === 'cash') {
      const amount = parseFloat(line.cashAmount || '0');
      if (amount < 0) {
        errors.push('Cash amount cannot be negative');
      }
      if (amount > 0) hasValidAmount = true;
    }

    if (line.mode === 'cheque') {
      const amount = parseFloat(line.chequeAmount || '0');
      if (amount < 0) {
        errors.push('Cheque amount cannot be negative');
      }
      if (amount > 0) {
        hasValidAmount = true;
        if (!line.chequeNumber?.trim()) {
          errors.push('Cheque number is required when cheque is selected');
        }
        if (!line.bankName?.trim()) {
          errors.push('Bank name is required when cheque is selected');
        }
        if (!line.chequeDate) {
          errors.push('Cheque date is required when cheque is selected');
        }
      }
    }

    if (line.mode === 'online') {
      const amount = parseFloat(line.transferAmount || '0');
      if (amount < 0) {
        errors.push('Transfer amount cannot be negative');
      }
      if (amount > 0) {
        hasValidAmount = true;
        if (!line.transactionId?.trim()) {
          errors.push('Transaction ID is required for online transfer');
        }
        if (!line.transferDate) {
          errors.push('Transfer date is required for online transfer');
        }
      }
    }
  }

  if (!hasValidAmount) {
    errors.push('At least one payment line must have a positive amount');
  }

  return errors;
}
