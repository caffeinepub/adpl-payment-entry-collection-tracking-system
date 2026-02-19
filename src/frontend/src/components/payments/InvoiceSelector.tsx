import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search } from 'lucide-react';
import type { Invoice } from '../../backend';

interface InvoiceSelectorProps {
  invoicesByRetailer: Record<string, Invoice[]>;
  selectedInvoices: Invoice[];
  onSelectionChange: (invoices: Invoice[]) => void;
}

export default function InvoiceSelector({
  invoicesByRetailer,
  selectedInvoices,
  onSelectionChange,
}: InvoiceSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');

  // Flatten all invoices for direct search
  const allInvoices = Object.values(invoicesByRetailer).flat();

  // Filter invoices by search query (invoice number, retailer code, or retailer name)
  const filteredInvoices = allInvoices.filter((invoice) => {
    const query = searchQuery.toLowerCase();
    return (
      invoice.invoiceNumber.toLowerCase().includes(query) ||
      invoice.retailerCode.toLowerCase().includes(query) ||
      invoice.retailerName.toLowerCase().includes(query)
    );
  });

  const formatCurrency = (amount: bigint) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(Number(amount));
  };

  const handleInvoiceToggle = (invoice: Invoice, checked: boolean) => {
    if (checked) {
      onSelectionChange([...selectedInvoices, invoice]);
    } else {
      onSelectionChange(selectedInvoices.filter((inv) => inv.invoiceNumber !== invoice.invoiceNumber));
    }
  };

  const isInvoiceSelected = (invoiceNumber: string) => {
    return selectedInvoices.some((inv) => inv.invoiceNumber === invoiceNumber);
  };

  const totalSelected = selectedInvoices.reduce((sum, inv) => sum + Number(inv.balanceAmount), 0);

  // Group selected invoices by retailer for display
  const selectedByRetailer = selectedInvoices.reduce((acc, inv) => {
    if (!acc[inv.retailerCode]) {
      acc[inv.retailerCode] = [];
    }
    acc[inv.retailerCode].push(inv);
    return acc;
  }, {} as Record<string, Invoice[]>);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Select Invoices</CardTitle>
        <p className="text-sm text-muted-foreground">
          Search and select multiple invoices by invoice number from any retailer
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Search Invoices</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by invoice number, retailer code, or name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {selectedInvoices.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Selected Invoices</Label>
              <Badge variant="secondary">
                {selectedInvoices.length} selected • Total: {formatCurrency(BigInt(totalSelected))}
              </Badge>
            </div>
            <div className="border rounded-lg p-3 space-y-2 bg-muted/30">
              {Object.entries(selectedByRetailer).map(([retailerCode, invoices]) => (
                <div key={retailerCode} className="space-y-1">
                  <div className="text-xs font-medium text-muted-foreground">
                    {retailerCode} - {invoices[0].retailerName}
                  </div>
                  {invoices.map((inv) => (
                    <div key={inv.invoiceNumber} className="flex items-center justify-between text-sm pl-2">
                      <span className="font-medium">{inv.invoiceNumber}</span>
                      <span className="text-muted-foreground">{formatCurrency(inv.balanceAmount)}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Available Invoices ({filteredInvoices.length})</Label>
          </div>

          {filteredInvoices.length > 0 ? (
            <div className="border rounded-lg divide-y max-h-[400px] overflow-y-auto">
              {filteredInvoices.map((invoice) => {
                const isSelected = isInvoiceSelected(invoice.invoiceNumber);

                return (
                  <div
                    key={invoice.invoiceNumber}
                    className="p-4 flex items-start gap-3 hover:bg-muted/50"
                  >
                    <Checkbox
                      id={invoice.invoiceNumber}
                      checked={isSelected}
                      onCheckedChange={(checked) => handleInvoiceToggle(invoice, checked as boolean)}
                    />
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <Label
                          htmlFor={invoice.invoiceNumber}
                          className="font-medium cursor-pointer"
                        >
                          {invoice.invoiceNumber}
                        </Label>
                        <span className="font-semibold text-primary">
                          {formatCurrency(invoice.balanceAmount)}
                        </span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {invoice.retailerCode} - {invoice.retailerName}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Date: {invoice.invoiceDate} • Salesman: {invoice.salesmanName}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              {searchQuery ? 'No invoices found matching your search' : 'No unpaid invoices available'}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
