import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useGetAllInvoices } from '../../hooks/useQueries';
import { PaymentMode, PaymentType } from '../../backend';

interface ReportsFiltersProps {
  filters: {
    startDate: bigint | null;
    endDate: bigint | null;
    salesmanName: string | null;
    paymentType: PaymentType | null;
    paymentMode: PaymentMode | null;
  };
  onChange: (filters: any) => void;
}

export default function ReportsFilters({ filters, onChange }: ReportsFiltersProps) {
  const { data: invoices = [] } = useGetAllInvoices();
  const uniqueSalesmen = Array.from(new Set(invoices.map((inv) => inv.salesmanName))).sort();

  const handleDateChange = (field: 'startDate' | 'endDate', value: string) => {
    const timestamp = value ? BigInt(new Date(value).getTime() * 1000000) : null;
    onChange({ ...filters, [field]: timestamp });
  };

  const getPaymentTypeValue = () => {
    if (!filters.paymentType) return '';
    if (filters.paymentType === PaymentType.invoicePayment) return 'invoice';
    if (filters.paymentType === PaymentType.excessPayment) return 'excess';
    return '';
  };

  const getPaymentModeValue = () => {
    if (!filters.paymentMode) return '';
    if (filters.paymentMode === PaymentMode.cash) return 'cash';
    if (filters.paymentMode === PaymentMode.cheque) return 'cheque';
    if (filters.paymentMode === PaymentMode.bankTransfer) return 'bank';
    return '';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Filters</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <div>
            <Label htmlFor="start-date">Start Date</Label>
            <Input
              id="start-date"
              type="date"
              onChange={(e) => handleDateChange('startDate', e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="end-date">End Date</Label>
            <Input
              id="end-date"
              type="date"
              onChange={(e) => handleDateChange('endDate', e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="salesman">Salesman</Label>
            <select
              id="salesman"
              value={filters.salesmanName || ''}
              onChange={(e) =>
                onChange({ ...filters, salesmanName: e.target.value || null })
              }
              className="mt-1 w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
            >
              <option value="">All Salesmen</option>
              {uniqueSalesmen.map((salesman) => (
                <option key={salesman} value={salesman}>
                  {salesman}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="payment-type">Type</Label>
            <select
              id="payment-type"
              value={getPaymentTypeValue()}
              onChange={(e) => {
                const value = e.target.value;
                onChange({
                  ...filters,
                  paymentType: value === 'invoice' ? PaymentType.invoicePayment : value === 'excess' ? PaymentType.excessPayment : null,
                });
              }}
              className="mt-1 w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
            >
              <option value="">All Types</option>
              <option value="invoice">Invoice Payment</option>
              <option value="excess">Excess Payment</option>
            </select>
          </div>
          <div>
            <Label htmlFor="payment-mode">Mode</Label>
            <select
              id="payment-mode"
              value={getPaymentModeValue()}
              onChange={(e) => {
                const value = e.target.value;
                onChange({
                  ...filters,
                  paymentMode: value === 'cash' ? PaymentMode.cash : value === 'cheque' ? PaymentMode.cheque : value === 'bank' ? PaymentMode.bankTransfer : null,
                });
              }}
              className="mt-1 w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
            >
              <option value="">All Modes</option>
              <option value="cash">Cash</option>
              <option value="cheque">Cheque</option>
              <option value="bank">NEFT/RTGS/UPI</option>
            </select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
