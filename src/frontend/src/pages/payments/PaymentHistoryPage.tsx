import { useParams, useNavigate } from '@tanstack/react-router';
import { useGetPaymentHistory } from '../../hooks/useQueries';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Edit } from 'lucide-react';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import { PaymentMode, PaymentType } from '../../backend';

export default function PaymentHistoryPage() {
  const { retailerCode } = useParams({ from: '/payment-history/$retailerCode' });
  const navigate = useNavigate();
  const { data: payments = [], isLoading } = useGetPaymentHistory(retailerCode);
  const { isAdmin } = useCurrentUser();

  const formatCurrency = (amount: bigint) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(Number(amount));
  };

  const formatDate = (timestamp: bigint) => {
    return new Date(Number(timestamp) / 1000000).toLocaleString('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short',
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
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate({ to: '/invoices' })}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Payment History</h1>
          <p className="text-muted-foreground mt-1">Retailer Code: {retailerCode}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Payment Records ({payments.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No payment records found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Invoice</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Mode</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Entered By</TableHead>
                    {isAdmin && <TableHead className="text-right">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((payment) => (
                    <TableRow key={Number(payment.id)}>
                      <TableCell className="whitespace-nowrap">
                        {formatDate(payment.createdTimestamp)}
                      </TableCell>
                      <TableCell>{payment.invoiceNumber}</TableCell>
                      <TableCell>
                        <Badge variant={payment.paymentType === PaymentType.invoicePayment ? 'default' : 'secondary'}>
                          {getPaymentTypeLabel(payment.paymentType)}
                        </Badge>
                      </TableCell>
                      <TableCell>{getPaymentModeLabel(payment.paymentMode)}</TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(payment.paymentAmount)}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {payment.enteredBy.toString().slice(0, 8)}...
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
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
