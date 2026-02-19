import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { PaymentEntry, PaymentMode, PaymentType } from '../../backend';
import { getEffectivePaymentDate } from '../../utils/payments/paymentDates';

interface RetailerLedgerTableProps {
  payments: PaymentEntry[];
}

// Expanded row type where each invoice gets its own row
interface ExpandedPaymentRow {
  paymentId: bigint;
  invoiceNumber: string;
  retailerCode: string;
  paymentAmount: bigint;
  paymentType: PaymentType;
  paymentMode: PaymentMode;
  effectiveDate: bigint;
  transactionId: string;
  bankName: string;
  chequeNumber: string;
}

export default function RetailerLedgerTable({ payments }: RetailerLedgerTableProps) {
  const formatCurrency = (amount: bigint) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(Number(amount));
  };

  const formatDate = (timestamp: bigint) => {
    return new Date(Number(timestamp) / 1000000).toLocaleDateString('en-IN', {
      dateStyle: 'medium',
    });
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

  // Expand payments: create one row per invoice
  const expandedRows: ExpandedPaymentRow[] = [];
  
  payments.forEach((payment) => {
    const effectiveDate = getEffectivePaymentDate(payment);
    const transactionId = payment.paymentMode === PaymentMode.bankTransfer && payment.transactionId 
      ? payment.transactionId 
      : '';
    const bankName = payment.paymentMode === PaymentMode.cheque && payment.chequeBankName 
      ? payment.chequeBankName 
      : '';
    const chequeNumber = payment.paymentMode === PaymentMode.cheque && payment.chequeNumber 
      ? payment.chequeNumber 
      : '';

    // Create a separate row for each invoice in this payment
    payment.invoiceNumbers.forEach((invoiceNumber) => {
      expandedRows.push({
        paymentId: payment.id,
        invoiceNumber,
        retailerCode: payment.retailerCode,
        paymentAmount: payment.paymentAmount,
        paymentType: payment.paymentType,
        paymentMode: payment.paymentMode,
        effectiveDate,
        transactionId,
        bankName,
        chequeNumber,
      });
    });
  });

  // Group expanded rows by retailer
  const groupedByRetailer = expandedRows.reduce((acc, row) => {
    if (!acc[row.retailerCode]) {
      acc[row.retailerCode] = [];
    }
    acc[row.retailerCode].push(row);
    return acc;
  }, {} as Record<string, ExpandedPaymentRow[]>);

  return (
    <div className="space-y-6">
      {Object.entries(groupedByRetailer).map(([retailerCode, retailerRows]) => {
        const totalAmount = retailerRows.reduce((sum, r) => sum + Number(r.paymentAmount), 0);

        return (
          <div key={retailerCode} className="space-y-2">
            <div className="flex items-center justify-between bg-muted/50 p-3 rounded-lg">
              <h3 className="font-semibold">Retailer: {retailerCode}</h3>
              <p className="font-medium">Total: {formatCurrency(BigInt(totalAmount))}</p>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Payment Date</TableHead>
                    <TableHead>Invoice</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Mode</TableHead>
                    <TableHead>Transaction ID</TableHead>
                    <TableHead>Bank Name</TableHead>
                    <TableHead>Cheque Number</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {retailerRows.map((row, idx) => (
                    <TableRow key={`${Number(row.paymentId)}-${row.invoiceNumber}-${idx}`}>
                      <TableCell>{formatDate(row.effectiveDate)}</TableCell>
                      <TableCell>{row.invoiceNumber}</TableCell>
                      <TableCell>
                        <Badge variant={row.paymentType === PaymentType.invoicePayment ? 'default' : 'secondary'}>
                          {getPaymentTypeLabel(row.paymentType)}
                        </Badge>
                      </TableCell>
                      <TableCell>{getPaymentModeLabel(row.paymentMode)}</TableCell>
                      <TableCell className="text-muted-foreground">{row.transactionId || '—'}</TableCell>
                      <TableCell className="text-muted-foreground">{row.bankName || '—'}</TableCell>
                      <TableCell className="text-muted-foreground">{row.chequeNumber || '—'}</TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(row.paymentAmount)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        );
      })}
    </div>
  );
}
