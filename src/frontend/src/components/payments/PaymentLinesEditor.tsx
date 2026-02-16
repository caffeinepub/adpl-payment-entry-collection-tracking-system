import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Plus, Trash2 } from 'lucide-react';
import type { PaymentLine } from '../../types/payment';

interface PaymentLinesEditorProps {
  paymentLines: PaymentLine[];
  onChange: (lines: PaymentLine[]) => void;
}

export default function PaymentLinesEditor({ paymentLines, onChange }: PaymentLinesEditorProps) {
  const addPaymentLine = () => {
    const newLine: PaymentLine = {
      id: Date.now().toString(),
      mode: 'cash',
      amount: '',
      cashAmount: '',
      bankName: '',
      chequeNumber: '',
      chequeDate: '',
      chequeAmount: '',
      transactionId: '',
      transferDate: '',
      transferAmount: '',
    };
    onChange([...paymentLines, newLine]);
  };

  const removePaymentLine = (id: string) => {
    if (paymentLines.length === 1) return;
    onChange(paymentLines.filter((line) => line.id !== id));
  };

  const updatePaymentLine = (id: string, updates: Partial<PaymentLine>) => {
    onChange(
      paymentLines.map((line) =>
        line.id === id ? { ...line, ...updates } : line
      )
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>Payment Modes</Label>
        <Button type="button" variant="outline" size="sm" onClick={addPaymentLine}>
          <Plus className="h-4 w-4 mr-1" />
          Add Another Payment Mode
        </Button>
      </div>

      {paymentLines.map((line, index) => (
        <Card key={line.id} className="p-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Payment Mode {index + 1}</Label>
              {paymentLines.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removePaymentLine(line.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>

            <div>
              <Label>Mode *</Label>
              <select
                value={line.mode}
                onChange={(e) =>
                  updatePaymentLine(line.id, {
                    mode: e.target.value as 'cash' | 'cheque' | 'online',
                  })
                }
                className="mt-1 w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
              >
                <option value="cash">Cash</option>
                <option value="cheque">Cheque</option>
                <option value="online">NEFT / RTGS / UPI</option>
              </select>
            </div>

            {line.mode === 'cash' && (
              <div>
                <Label htmlFor={`cash-amount-${line.id}`}>Cash Amount *</Label>
                <Input
                  id={`cash-amount-${line.id}`}
                  type="number"
                  value={line.cashAmount}
                  onChange={(e) =>
                    updatePaymentLine(line.id, { cashAmount: e.target.value })
                  }
                  placeholder="Enter amount"
                  className="mt-1"
                />
              </div>
            )}

            {line.mode === 'cheque' && (
              <>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor={`bank-name-${line.id}`}>Bank Name *</Label>
                    <Input
                      id={`bank-name-${line.id}`}
                      value={line.bankName}
                      onChange={(e) =>
                        updatePaymentLine(line.id, { bankName: e.target.value })
                      }
                      placeholder="Enter bank name"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor={`cheque-number-${line.id}`}>Cheque Number *</Label>
                    <Input
                      id={`cheque-number-${line.id}`}
                      value={line.chequeNumber}
                      onChange={(e) =>
                        updatePaymentLine(line.id, { chequeNumber: e.target.value })
                      }
                      placeholder="Enter cheque number"
                      className="mt-1"
                    />
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor={`cheque-date-${line.id}`}>Cheque Date *</Label>
                    <Input
                      id={`cheque-date-${line.id}`}
                      type="date"
                      value={line.chequeDate}
                      onChange={(e) =>
                        updatePaymentLine(line.id, { chequeDate: e.target.value })
                      }
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor={`cheque-amount-${line.id}`}>Cheque Amount *</Label>
                    <Input
                      id={`cheque-amount-${line.id}`}
                      type="number"
                      value={line.chequeAmount}
                      onChange={(e) =>
                        updatePaymentLine(line.id, { chequeAmount: e.target.value })
                      }
                      placeholder="Enter amount"
                      className="mt-1"
                    />
                  </div>
                </div>
              </>
            )}

            {line.mode === 'online' && (
              <>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor={`transaction-id-${line.id}`}>Transaction ID *</Label>
                    <Input
                      id={`transaction-id-${line.id}`}
                      value={line.transactionId}
                      onChange={(e) =>
                        updatePaymentLine(line.id, { transactionId: e.target.value })
                      }
                      placeholder="Enter transaction ID"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor={`transfer-date-${line.id}`}>Transfer Date *</Label>
                    <Input
                      id={`transfer-date-${line.id}`}
                      type="date"
                      value={line.transferDate}
                      onChange={(e) =>
                        updatePaymentLine(line.id, { transferDate: e.target.value })
                      }
                      className="mt-1"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor={`transfer-amount-${line.id}`}>Amount *</Label>
                  <Input
                    id={`transfer-amount-${line.id}`}
                    type="number"
                    value={line.transferAmount}
                    onChange={(e) =>
                      updatePaymentLine(line.id, { transferAmount: e.target.value })
                    }
                    placeholder="Enter amount"
                    className="mt-1"
                  />
                </div>
              </>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
}
