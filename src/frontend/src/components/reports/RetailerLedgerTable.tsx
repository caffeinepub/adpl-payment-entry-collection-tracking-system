import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { PaymentEntry, PaymentMode, PaymentType } from '../../backend';
import { getEffectivePaymentDate } from '../../utils/payments/paymentDates';

interface RetailerLedgerTableProps {
  payments: PaymentEntry[];
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

  const groupedByRetailer = payments.reduce((acc, payment) => {
    if (!acc[payment.retailerCode]) {
      acc[payment.retailerCode] = [];
    }
    acc[payment.retailerCode].push(payment);
    return acc;
  }, {} as Record<string, PaymentEntry[]>);

  return (
    <div className="space-y-6">
      {Object.entries(groupedByRetailer).map(([retailerCode, retailerPayments]) => {
        const totalAmount = retailerPayments.reduce((sum, p) => sum + Number(p.paymentAmount), 0);

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
                  {retailerPayments.map((payment) => {
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

                    return (
                      <TableRow key={Number(payment.id)}>
                        <TableCell>{formatDate(effectiveDate)}</TableCell>
                        <TableCell>{payment.invoiceNumber}</TableCell>
                        <TableCell>
                          <Badge variant={payment.paymentType === PaymentType.invoicePayment ? 'default' : 'secondary'}>
                            {getPaymentTypeLabel(payment.paymentType)}
                          </Badge>
                        </TableCell>
                        <TableCell>{getPaymentModeLabel(payment.paymentMode)}</TableCell>
                        <TableCell className="text-muted-foreground">{transactionId || '—'}</TableCell>
                        <TableCell className="text-muted-foreground">{bankName || '—'}</TableCell>
                        <TableCell className="text-muted-foreground">{chequeNumber || '—'}</TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(payment.paymentAmount)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        );
      })}
    </div>
  );
}
