import { useState } from 'react';
import { useParams, useNavigate } from '@tanstack/react-router';
import { useGetInvoice, useAddPayment } from '../../hooks/useQueries';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import PaymentLinesEditor from '../../components/payments/PaymentLinesEditor';
import { calculatePaymentTotals, determinePaymentStatus } from '../../utils/payments/paymentStatus';
import { validatePaymentEntry } from '../../utils/validation/paymentEntryValidation';
import { toast } from 'sonner';
import { ArrowLeft, AlertTriangle } from 'lucide-react';
import type { PaymentLine } from '../../types/payment';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { PaymentMode, PaymentType } from '../../backend';

export default function PaymentEntryPage() {
  const { invoiceNumber } = useParams({ from: '/payment-entry/$invoiceNumber' });
  const navigate = useNavigate();
  const { data: invoice, isLoading } = useGetInvoice(invoiceNumber);
  const addPaymentMutation = useAddPayment();

  const [paymentType, setPaymentType] = useState<'SRR1' | 'SRR2' | 'TFC'>('SRR1');
  const [paymentLines, setPaymentLines] = useState<PaymentLine[]>([
    { id: '1', mode: 'cash', amount: '', cashAmount: '', bankName: '', chequeNumber: '', chequeDate: '', chequeAmount: '', transactionId: '', transferDate: '', transferAmount: '' },
  ]);
  const [submitting, setSubmitting] = useState(false);

  const totals = calculatePaymentTotals(paymentLines, invoice?.balanceAmount || BigInt(0));
  const status = determinePaymentStatus(totals.total, invoice?.balanceAmount || BigInt(0));
  const validationErrors = validatePaymentEntry(paymentType, paymentLines);

  const handleSubmit = async () => {
    if (validationErrors.length > 0) {
      toast.error(validationErrors[0]);
      return;
    }

    if (!invoice) {
      toast.error('Invoice not found');
      return;
    }

    setSubmitting(true);
    try {
      for (const line of paymentLines) {
        const amount = line.mode === 'cash' 
          ? BigInt(Math.round(parseFloat(line.cashAmount || '0')))
          : line.mode === 'cheque'
          ? BigInt(Math.round(parseFloat(line.chequeAmount || '0')))
          : BigInt(Math.round(parseFloat(line.transferAmount || '0')));

        if (amount > 0) {
          const paymentMode = line.mode === 'cash' ? PaymentMode.cash : line.mode === 'cheque' ? PaymentMode.cheque : PaymentMode.bankTransfer;
          const isExcess = totals.total > invoice.balanceAmount;
          const paymentTypeEnum = isExcess ? PaymentType.excessPayment : PaymentType.invoicePayment;

          await addPaymentMutation.mutateAsync({
            invoiceNumber: invoice.invoiceNumber,
            retailerCode: invoice.retailerCode,
            paymentAmount: amount,
            paymentType: paymentTypeEnum,
            paymentMode: paymentMode,
          });
        }
      }

      toast.success('Payment successfully recorded for ADPL');
      navigate({ to: '/invoices' });
    } catch (error: any) {
      toast.error(error.message || 'Failed to record payment');
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading invoice...</p>
        </div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Invoice not found</p>
        <Button onClick={() => navigate({ to: '/invoices' })} className="mt-4">
          Back to Invoices
        </Button>
      </div>
    );
  }

  const formatCurrency = (amount: bigint) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(Number(amount));
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate({ to: '/invoices' })}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Payment Entry</h1>
          <p className="text-muted-foreground mt-1">Record payment for invoice</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Invoice Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label className="text-muted-foreground">Retailer Code</Label>
              <p className="font-medium">{invoice.retailerCode}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Retailer Name</Label>
              <p className="font-medium">{invoice.retailerName}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Invoice Number</Label>
              <p className="font-medium">{invoice.invoiceNumber}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Invoice Date</Label>
              <p className="font-medium">{invoice.invoiceDate}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Salesman Name</Label>
              <p className="font-medium">{invoice.salesmanName}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Balance Amount</Label>
              <p className="font-medium text-lg">{formatCurrency(invoice.balanceAmount)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Payment Entry</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label htmlFor="payment-type">Type *</Label>
            <select
              id="payment-type"
              value={paymentType}
              onChange={(e) => setPaymentType(e.target.value as 'SRR1' | 'SRR2' | 'TFC')}
              className="mt-1 w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
            >
              <option value="SRR1">SRR1 (Supplier)</option>
              <option value="SRR2">SRR2 (Salesman)</option>
              <option value="TFC">TFC</option>
            </select>
          </div>

          <PaymentLinesEditor
            paymentLines={paymentLines}
            onChange={setPaymentLines}
          />

          <div className="border-t pt-4 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total Entered:</span>
              <span className="font-medium">{formatCurrency(totals.total)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Balance Amount:</span>
              <span className="font-medium">{formatCurrency(invoice.balanceAmount)}</span>
            </div>
            <div className="flex justify-between text-sm font-medium">
              <span>Status:</span>
              <span className={
                status === 'Fully Paid' ? 'text-green-600' :
                status === 'Partially Paid' ? 'text-orange-600' :
                'text-blue-600'
              }>
                {status}
              </span>
            </div>
            {totals.excess > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Excess Amount:</span>
                <span className="font-medium text-blue-600">{formatCurrency(totals.excess)}</span>
              </div>
            )}
            {totals.remaining > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Remaining:</span>
                <span className="font-medium text-orange-600">{formatCurrency(totals.remaining)}</span>
              </div>
            )}
          </div>

          {status === 'Excess Payment' && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Entered amount exceeds balance. Excess will be recorded.
              </AlertDescription>
            </Alert>
          )}

          <div className="flex gap-3">
            <Button
              onClick={handleSubmit}
              disabled={submitting || validationErrors.length > 0 || totals.total === BigInt(0)}
              className="flex-1"
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Submitting...
                </>
              ) : (
                'Submit Payment'
              )}
            </Button>
            <Button variant="outline" onClick={() => navigate({ to: '/invoices' })}>
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
