import { useParams, useNavigate } from '@tanstack/react-router';
import { useGetPaymentHistory, useGetAllInvoices } from '../../hooks/useQueries';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Edit, Layers } from 'lucide-react';
import { PaymentMode, PaymentType } from '../../backend';
import { getEffectivePaymentDate } from '../../utils/payments/paymentDates';

export default function PaymentHistoryPage() {
  const { retailerCode } = useParams({ from: '/payment-history/$retailerCode' });
  const navigate = useNavigate();
  const { data: payments, isLoading } = useGetPaymentHistory(retailerCode);
  const { data: allInvoices } = useGetAllInvoices();
  const { userRole } = useCurrentUser();

  const isAdmin = userRole === 'admin';

  const retailerInvoices = allInvoices?.filter((inv) => inv.retailerCode === retailerCode) || [];
  const retailerName = retailerInvoices[0]?.retailerName || retailerCode;

  const formatCurrency = (amount: bigint) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(Number(amount));
  };

  const formatDate = (timestamp: bigint) => {
    const date = new Date(Number(timestamp) / 1_000_000);
    return date.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getPaymentModeLabel = (mode: PaymentMode) => {
    switch (mode) {
      case PaymentMode.cash:
        return 'Cash';
      case PaymentMode.cheque:
        return 'Cheque';
      case PaymentMode.bankTransfer:
        return 'RTGS/NEFT/UPI';
      default:
        return 'Unknown';
    }
  };

  const getPaymentTypeLabel = (type: PaymentType) => {
    switch (type) {
      case PaymentType.invoicePayment:
        return 'Invoice Payment';
      case PaymentType.excessPayment:
        return 'Excess Payment';
      default:
        return 'Unknown';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading payment history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 px-4 max-w-7xl">
      <div className="mb-6">
        <Button variant="ghost" onClick={() => navigate({ to: '/invoices' })}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Invoices
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
          <p className="text-sm text-muted-foreground">
            Retailer: {retailerName} ({retailerCode})
          </p>
        </CardHeader>
        <CardContent>
          {!payments || payments.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No payment history found for this retailer</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Invoice(s)</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Mode</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Reference</TableHead>
                    {isAdmin && <TableHead className="text-right">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((payment) => {
                    const isBatchPayment = payment.invoiceNumbers.length > 1;
                    const effectiveDate = getEffectivePaymentDate(payment);
                    
                    return (
                      <TableRow key={payment.id.toString()}>
                        <TableCell className="text-sm">{formatDate(effectiveDate)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {isBatchPayment && (
                              <Badge variant="secondary" className="text-xs">
                                <Layers className="h-3 w-3 mr-1" />
                                Batch
                              </Badge>
                            )}
                            <div className="text-sm">
                              {payment.invoiceNumbers.map((invNum, idx) => (
                                <div key={invNum}>
                                  {invNum}
                                  {idx < payment.invoiceNumbers.length - 1 && ', '}
                                </div>
                              ))}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={payment.paymentType === PaymentType.excessPayment ? 'secondary' : 'default'}>
                            {getPaymentTypeLabel(payment.paymentType)}
                          </Badge>
                        </TableCell>
                        <TableCell>{getPaymentModeLabel(payment.paymentMode)}</TableCell>
                        <TableCell className="text-right font-medium">{formatCurrency(payment.paymentAmount)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {payment.paymentMode === PaymentMode.cheque && payment.chequeNumber && (
                            <div>Cheque: {payment.chequeNumber}</div>
                          )}
                          {payment.paymentMode === PaymentMode.bankTransfer && payment.transactionId && (
                            <div>Txn: {payment.transactionId}</div>
                          )}
                        </TableCell>
                        {isAdmin && (
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => navigate({ to: `/edit-payment/${payment.id}` })}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
