import { useState, useEffect } from 'react';
import { useParams, useNavigate } from '@tanstack/react-router';
import { useGetAllPayments, useEditPayment } from '../../hooks/useQueries';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';
import { PaymentMode } from '../../backend';

export default function EditPaymentEntryPage() {
  const { paymentId } = useParams({ from: '/edit-payment/$paymentId' });
  const navigate = useNavigate();
  const { data: payments = [] } = useGetAllPayments();
  const editPaymentMutation = useEditPayment();

  const payment = payments.find((p) => p.id.toString() === paymentId);

  const [amount, setAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState<PaymentMode>(PaymentMode.cash);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (payment) {
      setAmount(Number(payment.paymentAmount).toString());
      if (payment.paymentMode === PaymentMode.cash) setPaymentMode(PaymentMode.cash);
      else if (payment.paymentMode === PaymentMode.cheque) setPaymentMode(PaymentMode.cheque);
      else if (payment.paymentMode === PaymentMode.bankTransfer) setPaymentMode(PaymentMode.bankTransfer);
    }
  }, [payment]);

  const handleSubmit = async () => {
    if (!payment) return;

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    setSubmitting(true);
    try {
      await editPaymentMutation.mutateAsync({
        paymentId: payment.id,
        paymentAmount: BigInt(Math.round(parsedAmount)),
        paymentType: payment.paymentType,
        paymentMode: paymentMode,
      });

      toast.success('Payment updated successfully');
      navigate({ to: `/payment-history/${payment.retailerCode}` });
    } catch (error: any) {
      toast.error(error.message || 'Failed to update payment');
    } finally {
      setSubmitting(false);
    }
  };

  if (!payment) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Payment not found</p>
        <Button onClick={() => navigate({ to: '/invoices' })} className="mt-4">
          Back to Invoices
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate({ to: `/payment-history/${payment.retailerCode}` })}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit Payment</h1>
          <p className="text-muted-foreground mt-1">Payment ID: {paymentId}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Payment Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="amount">Amount *</Label>
            <Input
              id="amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="payment-mode">Payment Mode *</Label>
            <select
              id="payment-mode"
              value={paymentMode}
              onChange={(e) => setPaymentMode(e.target.value as PaymentMode)}
              className="mt-1 w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
            >
              <option value={PaymentMode.cash}>Cash</option>
              <option value={PaymentMode.cheque}>Cheque</option>
              <option value={PaymentMode.bankTransfer}>NEFT/RTGS/UPI</option>
            </select>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex-1"
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Updating...
                </>
              ) : (
                'Update Payment'
              )}
            </Button>
            <Button variant="outline" onClick={() => navigate({ to: `/payment-history/${payment.retailerCode}` })}>
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
