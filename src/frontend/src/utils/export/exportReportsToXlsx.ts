import { PaymentEntry, PaymentMode, PaymentType } from '../../backend';

export function exportReportsToXlsx(
  reportsData: {
    totalCollected: bigint;
    totalExcess: bigint;
    pendingBalance: bigint;
    payments: PaymentEntry[];
  },
  filters: any
) {
  const formatCurrency = (amount: bigint) => Number(amount);

  const formatDate = (timestamp: bigint) => {
    return new Date(Number(timestamp) / 1000000).toLocaleString('en-IN');
  };

  const getPaymentModeLabel = (mode: PaymentMode) => {
    if (mode === PaymentMode.cash) return 'Cash';
    if (mode === PaymentMode.cheque) return 'Cheque';
    if (mode === PaymentMode.bankTransfer) return 'NEFT/RTGS/UPI';
    return 'Unknown';
  };

  const getPaymentTypeLabel = (type: PaymentType) => {
    if (type === PaymentType.invoicePayment) return 'Invoice Payment';
    if (type === PaymentType.excessPayment) return 'Excess Payment';
    return 'Unknown';
  };

  // Create CSV content
  const csvRows: string[] = [];
  
  csvRows.push('ADPL Payment Report');
  csvRows.push(`Generated on:,${new Date().toLocaleString('en-IN')}`);
  csvRows.push('');
  csvRows.push('Summary');
  csvRows.push(`Total Collected,${formatCurrency(reportsData.totalCollected)}`);
  csvRows.push(`Total Excess,${formatCurrency(reportsData.totalExcess)}`);
  csvRows.push(`Pending Balance,${formatCurrency(reportsData.pendingBalance)}`);
  csvRows.push('');
  csvRows.push('Payment Details');
  csvRows.push('Date & Time,Retailer Code,Invoice Number,Type,Mode,Amount,Entered By');

  reportsData.payments.forEach((payment) => {
    const row = [
      formatDate(payment.createdTimestamp),
      payment.retailerCode,
      payment.invoiceNumber,
      getPaymentTypeLabel(payment.paymentType),
      getPaymentModeLabel(payment.paymentMode),
      formatCurrency(payment.paymentAmount).toString(),
      payment.enteredBy.toString(),
    ];
    csvRows.push(row.map(cell => `"${cell}"`).join(','));
  });

  const csvContent = csvRows.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `ADPL_Payment_Report_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
