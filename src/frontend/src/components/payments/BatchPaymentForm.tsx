import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import type { Invoice } from '../../backend';

interface BatchPaymentFormProps {
  selectedInvoices: Invoice[];
  totalAmount: number;
  paymentMode: 'cheque' | 'online';
  onPaymentModeChange: (mode: 'cheque' | 'online') => void;
  paymentAmount: string;
  onPaymentAmountChange: (amount: string) => void;
  transactionId: string;
  onTransactionIdChange: (id: string) => void;
  bankName: string;
  onBankNameChange: (name: string) => void;
  chequeNumber: string;
  onChequeNumberChange: (number: string) => void;
  paymentDate: string;
  onPaymentDateChange: (date: string) => void;
}

export default function BatchPaymentForm({
  selectedInvoices,
  totalAmount,
  paymentMode,
  onPaymentModeChange,
  paymentAmount,
  onPaymentAmountChange,
  transactionId,
  onTransactionIdChange,
  bankName,
  onBankNameChange,
  chequeNumber,
  onChequeNumberChange,
  paymentDate,
  onPaymentDateChange,
}: BatchPaymentFormProps) {
  const formatCurrency = (amount: bigint | number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(Number(amount));
  };

  const enteredAmount = parseFloat(paymentAmount || '0');
  const difference = enteredAmount - totalAmount;

  // Group invoices by retailer
  const invoicesByRetailer = selectedInvoices.reduce((acc, inv) => {
    if (!acc[inv.retailerCode]) {
      acc[inv.retailerCode] = {
        retailerName: inv.retailerName,
        invoices: [],
      };
    }
    acc[inv.retailerCode].invoices.push(inv);
    return acc;
  }, {} as Record<string, { retailerName: string; invoices: Invoice[] }>);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Payment Details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Selected Invoices Summary - Grouped by Retailer */}
        <div className="space-y-2">
          <Label>Selected Invoices</Label>
          <div className="border rounded-lg p-3 space-y-3 bg-muted/30">
            {Object.entries(invoicesByRetailer).map(([retailerCode, data]) => (
              <div key={retailerCode} className="space-y-2">
                <div className="text-sm font-semibold text-primary">
                  {retailerCode} - {data.retailerName}
                </div>
                {data.invoices.map((invoice) => (
                  <div key={invoice.invoiceNumber} className="flex items-center justify-between text-sm pl-3">
                    <span className="font-medium">{invoice.invoiceNumber}</span>
                    <span className="text-muted-foreground">{formatCurrency(invoice.balanceAmount)}</span>
                  </div>
                ))}
              </div>
            ))}
            <div className="flex items-center justify-between pt-2 border-t font-semibold">
              <span>Total Outstanding</span>
              <span className="text-primary">{formatCurrency(totalAmount)}</span>
            </div>
          </div>
        </div>

        {/* Payment Mode */}
        <div className="space-y-2">
          <Label htmlFor="paymentMode">Payment Mode</Label>
          <Select value={paymentMode} onValueChange={(value) => onPaymentModeChange(value as 'cheque' | 'online')}>
            <SelectTrigger id="paymentMode">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="online">RTGS / NEFT / UPI</SelectItem>
              <SelectItem value="cheque">Cheque</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Payment Amount */}
        <div className="space-y-2">
          <Label htmlFor="paymentAmount">Payment Amount</Label>
          <Input
            id="paymentAmount"
            type="number"
            placeholder="Enter payment amount"
            value={paymentAmount}
            onChange={(e) => onPaymentAmountChange(e.target.value)}
            min="0"
            step="0.01"
          />
          {enteredAmount > 0 && (
            <div className="text-sm">
              {difference > 0 ? (
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                  Excess: {formatCurrency(difference)}
                </Badge>
              ) : difference < 0 ? (
                <Badge variant="secondary" className="bg-amber-100 text-amber-800">
                  Partial: {formatCurrency(Math.abs(difference))} remaining
                </Badge>
              ) : (
                <Badge variant="default" className="bg-green-100 text-green-800">
                  Full Payment
                </Badge>
              )}
            </div>
          )}
        </div>

        {/* Mode-specific fields */}
        {paymentMode === 'online' && (
          <>
            <div className="space-y-2">
              <Label htmlFor="transactionId">Transaction ID / Reference Number</Label>
              <Input
                id="transactionId"
                placeholder="Enter transaction ID"
                value={transactionId}
                onChange={(e) => onTransactionIdChange(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="transferDate">Transfer Date</Label>
              <Input
                id="transferDate"
                type="date"
                value={paymentDate}
                onChange={(e) => onPaymentDateChange(e.target.value)}
              />
            </div>
          </>
        )}

        {paymentMode === 'cheque' && (
          <>
            <div className="space-y-2">
              <Label htmlFor="bankName">Bank Name</Label>
              <Input
                id="bankName"
                placeholder="Enter bank name"
                value={bankName}
                onChange={(e) => onBankNameChange(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="chequeNumber">Cheque Number</Label>
              <Input
                id="chequeNumber"
                placeholder="Enter cheque number"
                value={chequeNumber}
                onChange={(e) => onChequeNumberChange(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="chequeDate">Cheque Date</Label>
              <Input
                id="chequeDate"
                type="date"
                value={paymentDate}
                onChange={(e) => onPaymentDateChange(e.target.value)}
              />
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
