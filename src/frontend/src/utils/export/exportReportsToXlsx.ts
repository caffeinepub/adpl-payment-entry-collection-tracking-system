import { PaymentEntry, PaymentMode, PaymentType, Invoice } from '../../backend';
import { getEffectivePaymentDate } from '../payments/paymentDates';

export function exportReportsToXlsx(
  reportsData: {
    totalCollected: bigint;
    totalExcess: bigint;
    pendingBalance: bigint;
    payments: PaymentEntry[];
  },
  filters: any,
  allInvoices?: Invoice[]
) {
  const formatCurrency = (amount: bigint) => Number(amount);

  const formatDate = (timestamp: bigint) => {
    const date = new Date(Number(timestamp) / 1000000);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
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

  // Create a map of invoice numbers to salesman names for quick lookup
  const invoiceToSalesmanMap = new Map<string, string>();
  if (allInvoices) {
    allInvoices.forEach((invoice) => {
      invoiceToSalesmanMap.set(invoice.invoiceNumber, invoice.salesmanName);
    });
  }

  // Helper function to get DSE names for a payment entry
  const getDSENames = (payment: PaymentEntry): string => {
    const salesmanNames = new Set<string>();
    payment.invoiceNumbers.forEach((invoiceNumber) => {
      const salesmanName = invoiceToSalesmanMap.get(invoiceNumber);
      if (salesmanName) {
        salesmanNames.add(salesmanName);
      }
    });
    return Array.from(salesmanNames).join('; ') || 'N/A';
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
  csvRows.push('Payment Date,Retailer Code,Invoice Number(s),DSE Name,Type,Mode,Amount,Bank Name,Cheque Number,Cheque Amount,Cheque Date,Transaction ID,RTGS Date,RTGS Amount,Entered By');

  reportsData.payments.forEach((payment) => {
    const effectiveDate = getEffectivePaymentDate(payment);
    
    // Cheque-specific columns
    const bankName = payment.paymentMode === PaymentMode.cheque && payment.chequeBankName 
      ? payment.chequeBankName 
      : '';
    const chequeNumber = payment.paymentMode === PaymentMode.cheque && payment.chequeNumber 
      ? payment.chequeNumber 
      : '';
    const chequeAmount = payment.paymentMode === PaymentMode.cheque 
      ? formatCurrency(payment.paymentAmount).toString()
      : '';
    const chequeDate = payment.paymentMode === PaymentMode.cheque && payment.chequeDate 
      ? formatDate(payment.chequeDate)
      : '';
    
    // Bank transfer (RTGS/NEFT/UPI) specific columns
    const transactionId = payment.paymentMode === PaymentMode.bankTransfer && payment.transactionId 
      ? payment.transactionId 
      : '';
    const rtgsDate = payment.paymentMode === PaymentMode.bankTransfer && payment.bankTransferDate 
      ? formatDate(payment.bankTransferDate)
      : '';
    const rtgsAmount = payment.paymentMode === PaymentMode.bankTransfer 
      ? formatCurrency(payment.paymentAmount).toString()
      : '';

    // Join invoice numbers with semicolon for CSV
    const invoiceNumbers = payment.invoiceNumbers.join('; ');

    // Get DSE names for this payment
    const dseNames = getDSENames(payment);

    const row = [
      formatDate(effectiveDate),
      payment.retailerCode,
      invoiceNumbers,
      dseNames,
      getPaymentTypeLabel(payment.paymentType),
      getPaymentModeLabel(payment.paymentMode),
      formatCurrency(payment.paymentAmount),
      bankName,
      chequeNumber,
      chequeAmount,
      chequeDate,
      transactionId,
      rtgsDate,
      rtgsAmount,
      payment.enteredBy.toString(),
    ];

    csvRows.push(row.join(','));
  });

  // Create CSV blob and download
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
}
