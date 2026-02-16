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
import { htmlDateToBackendTime, backendTimeToHtmlDate } from '../../utils/payments/paymentDates';

export default function EditPaymentEntryPage() {
  const { paymentId } = useParams({ from: '/edit-payment/$paymentId' });
  const navigate = useNavigate();
  const { data: payments = [] } = useGetAllPayments();
  const editPaymentMutation = useEditPayment();

  const payment = payments.find((p) => p.id.toString() === paymentId);

  const [amount, setAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState<PaymentMode>(PaymentMode.cash);
  const [transactionId, setTransactionId] = useState('');
  const [transferDate, setTransferDate] = useState('');
  const [bankName, setBankName] = useState('');
  const [chequeNumber, setChequeNumber] = useState('');
  const [chequeDate, setChequeDate] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (payment) {
      setAmount(Number(payment.paymentAmount).toString());
      setPaymentMode(payment.paymentMode);
      setTransactionId(payment.transactionId || '');
      setTransferDate(backendTimeToHtmlDate(payment.bankTransferDate));
      setBankName(payment.chequeBankName || '');
      setChequeNumber(payment.chequeNumber || '');
      setChequeDate(backendTimeToHtmlDate(payment.chequeDate));
    }
  }, [payment]);

  const handleSubmit = async () => {
    if (!payment) {
      toast.error('Payment not found');
      return;
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    // Validate mode-specific fields
    if (paymentMode === PaymentMode.bankTransfer) {
      if (!transactionId.trim()) {
        toast.error('Transaction ID is required for bank transfer');
        return;
      }
      if (!transferDate.trim()) {
        toast.error('Transfer date is required for bank transfer');
        return;
      }
    }

    if (paymentMode === PaymentMode.cheque) {
      if (!bankName.trim()) {
        toast.error('Bank name is required for cheque payment');
        return;
      }
      if (!chequeNumber.trim()) {
        toast.error('Cheque number is required for cheque payment');
        return;
      }
      if (!chequeDate.trim()) {
        toast.error('Cheque date is required for cheque payment');
        return;
      }
    }

    setSubmitting(true);
    try {
      await editPaymentMutation.mutateAsync({
        paymentId: payment.id,
        paymentAmount: BigInt(Math.round(parsedAmount)),
        paymentType: payment.paymentType,
        paymentMode: paymentMode,
        transactionId: paymentMode === PaymentMode.bankTransfer ? transactionId.trim() : null,
        chequeBankName: paymentMode === PaymentMode.cheque ? bankName.trim() : null,
        chequeNumber: paymentMode === PaymentMode.cheque ? chequeNumber.trim() : null,
        chequeDate: paymentMode === PaymentMode.cheque ? htmlDateToBackendTime(chequeDate) : null,
        bankTransferDate: paymentMode === PaymentMode.bankTransfer ? htmlDateToBackendTime(transferDate) : null,
      });

      toast.success('Payment updated successfully');
      navigate({ to: '/payment-history/$retailerCode', params: { retailerCode: payment.retailerCode } });
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

  const formatDate = (timestamp: bigint) => {
    return new Date(Number(timestamp) / 1000000).toLocaleString('en-IN');
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate({ to: '/payment-history/$retailerCode', params: { retailerCode: payment.retailerCode } })}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit Payment</h1>
          <p className="text-muted-foreground mt-1">Modify payment details</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Payment Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 mb-6">
            <div>
              <Label className="text-muted-foreground">Invoice Number</Label>
              <p className="font-medium">{payment.invoiceNumber}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Retailer Code</Label>
              <p className="font-medium">{payment.retailerCode}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Created</Label>
              <p className="font-medium">{formatDate(payment.createdTimestamp)}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Entered By</Label>
              <p className="font-medium text-xs break-all">{payment.enteredBy.toString()}</p>
            </div>
          </div>

          <div className="space-y-4">
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
                <option value={PaymentMode.bankTransfer}>NEFT / RTGS / UPI</option>
              </select>
            </div>

            {paymentMode === PaymentMode.bankTransfer && (
              <>
                <div>
                  <Label htmlFor="transaction-id">Transaction ID *</Label>
                  <Input
                    id="transaction-id"
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value)}
                    placeholder="Enter transaction ID"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="transfer-date">Transfer Date *</Label>
                  <Input
                    id="transfer-date"
                    type="date"
                    value={transferDate}
                    onChange={(e) => setTransferDate(e.target.value)}
                    className="mt-1"
                  />
                </div>
              </>
            )}

            {paymentMode === PaymentMode.cheque && (
              <>
                <div>
                  <Label htmlFor="bank-name">Bank Name *</Label>
                  <Input
                    id="bank-name"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    placeholder="Enter bank name"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="cheque-number">Cheque Number *</Label>
                  <Input
                    id="cheque-number"
                    value={chequeNumber}
                    onChange={(e) => setChequeNumber(e.target.value)}
                    placeholder="Enter cheque number"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="cheque-date">Cheque Date *</Label>
                  <Input
                    id="cheque-date"
                    type="date"
                    value={chequeDate}
                    onChange={(e) => setChequeDate(e.target.value)}
                    className="mt-1"
                  />
                </div>
              </>
            )}

            <div className="flex gap-3 pt-4">
              <Button onClick={handleSubmit} disabled={submitting} className="flex-1">
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Updating...
                  </>
                ) : (
                  'Update Payment'
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate({ to: '/payment-history/$retailerCode', params: { retailerCode: payment.retailerCode } })}
              >
                Cancel
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
