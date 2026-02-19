import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useGetAllInvoices, useAddBatchPayment } from '../../hooks/useQueries';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import InvoiceSelector from '../../components/payments/InvoiceSelector';
import BatchPaymentForm from '../../components/payments/BatchPaymentForm';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { Invoice } from '../../backend';

export default function BatchPaymentEntryPage() {
  const navigate = useNavigate();
  const { data: allInvoices, isLoading } = useGetAllInvoices();
  const addBatchPaymentMutation = useAddBatchPayment();

  const [selectedInvoices, setSelectedInvoices] = useState<Invoice[]>([]);
  const [paymentMode, setPaymentMode] = useState<'cheque' | 'online'>('online');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [bankName, setBankName] = useState('');
  const [chequeNumber, setChequeNumber] = useState('');
  const [paymentDate, setPaymentDate] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Filter unpaid/partially paid invoices
  const availableInvoices = (allInvoices || []).filter(
    (inv) => inv.balanceAmount > BigInt(0)
  );

  // Group by retailer
  const invoicesByRetailer = availableInvoices.reduce((acc, inv) => {
    if (!acc[inv.retailerCode]) {
      acc[inv.retailerCode] = [];
    }
    acc[inv.retailerCode].push(inv);
    return acc;
  }, {} as Record<string, Invoice[]>);

  const totalSelectedAmount = selectedInvoices.reduce(
    (sum, inv) => sum + Number(inv.balanceAmount),
    0
  );

  const handleSubmit = async () => {
    // Validation
    if (selectedInvoices.length === 0) {
      toast.error('Please select at least one invoice');
      return;
    }

    const amount = parseFloat(paymentAmount || '0');
    if (amount <= 0) {
      toast.error('Payment amount must be greater than zero');
      return;
    }

    if (paymentMode === 'online') {
      if (!transactionId?.trim()) {
        toast.error('Transaction ID is required for RTGS/NEFT/UPI');
        return;
      }
      if (!paymentDate) {
        toast.error('Payment date is required for RTGS/NEFT/UPI');
        return;
      }
    } else if (paymentMode === 'cheque') {
      if (!bankName?.trim()) {
        toast.error('Bank name is required for cheque payment');
        return;
      }
      if (!chequeNumber?.trim()) {
        toast.error('Cheque number is required for cheque payment');
        return;
      }
      if (!paymentDate) {
        toast.error('Cheque date is required for cheque payment');
        return;
      }
    }

    setSubmitting(true);
    try {
      await addBatchPaymentMutation.mutateAsync({
        selectedInvoices,
        totalPaymentAmount: BigInt(Math.round(amount)),
        paymentMode,
        transactionId: paymentMode === 'online' ? transactionId : undefined,
        chequeBankName: paymentMode === 'cheque' ? bankName : undefined,
        chequeNumber: paymentMode === 'cheque' ? chequeNumber : undefined,
        paymentDate,
      });

      const retailerCount = new Set(selectedInvoices.map(inv => inv.retailerCode)).size;
      const message = retailerCount > 1 
        ? `Batch payment recorded successfully for ${selectedInvoices.length} invoices across ${retailerCount} retailers`
        : `Batch payment recorded successfully for ${selectedInvoices.length} invoices`;
      
      toast.success(message);
      navigate({ to: '/invoices' });
    } catch (error: any) {
      console.error('Batch payment error:', error);
      toast.error(error.message || 'Failed to record batch payment');
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading invoices...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 px-4 max-w-6xl">
      <div className="mb-6">
        <Button variant="ghost" onClick={() => navigate({ to: '/invoices' })}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Invoices
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Batch Payment Entry</CardTitle>
          <p className="text-sm text-muted-foreground">
            Select multiple invoices from any retailer and enter a single RTGS or Cheque payment
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Select multiple invoices from any retailer. The payment will be distributed across all selected invoices.
            </AlertDescription>
          </Alert>

          <InvoiceSelector
            invoicesByRetailer={invoicesByRetailer}
            selectedInvoices={selectedInvoices}
            onSelectionChange={setSelectedInvoices}
          />

          {selectedInvoices.length > 0 && (
            <BatchPaymentForm
              selectedInvoices={selectedInvoices}
              totalAmount={totalSelectedAmount}
              paymentMode={paymentMode}
              onPaymentModeChange={setPaymentMode}
              paymentAmount={paymentAmount}
              onPaymentAmountChange={setPaymentAmount}
              transactionId={transactionId}
              onTransactionIdChange={setTransactionId}
              bankName={bankName}
              onBankNameChange={setBankName}
              chequeNumber={chequeNumber}
              onChequeNumberChange={setChequeNumber}
              paymentDate={paymentDate}
              onPaymentDateChange={setPaymentDate}
            />
          )}

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => navigate({ to: '/invoices' })} disabled={submitting}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={submitting || selectedInvoices.length === 0}>
              {submitting ? 'Recording Payment...' : 'Record Batch Payment'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
