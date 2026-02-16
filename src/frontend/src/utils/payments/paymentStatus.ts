import type { PaymentLine } from '../../types/payment';

export function calculatePaymentTotals(
  paymentLines: PaymentLine[],
  balanceAmount: bigint
) {
  let total = BigInt(0);

  for (const line of paymentLines) {
    const amount =
      line.mode === 'cash'
        ? parseFloat(line.cashAmount || '0')
        : line.mode === 'cheque'
        ? parseFloat(line.chequeAmount || '0')
        : parseFloat(line.transferAmount || '0');

    if (!isNaN(amount) && amount > 0) {
      total += BigInt(Math.round(amount));
    }
  }

  const remaining = total < balanceAmount ? balanceAmount - total : BigInt(0);
  const excess = total > balanceAmount ? total - balanceAmount : BigInt(0);

  return { total, remaining, excess };
}

export function determinePaymentStatus(
  totalPaid: bigint,
  balanceAmount: bigint
): 'Fully Paid' | 'Partially Paid' | 'Excess Payment' {
  if (totalPaid === BigInt(0)) {
    return 'Partially Paid';
  }

  if (totalPaid > balanceAmount) {
    return 'Excess Payment';
  }

  if (totalPaid === balanceAmount) {
    return 'Fully Paid';
  }

  return 'Partially Paid';
}
