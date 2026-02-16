import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Eye, History } from 'lucide-react';
import type { Invoice } from '../../backend';

interface InvoicesTableProps {
  invoices: Invoice[];
}

export default function InvoicesTable({ invoices }: InvoicesTableProps) {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const totalPages = Math.ceil(invoices.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentInvoices = invoices.slice(startIndex, endIndex);

  const formatCurrency = (amount: bigint) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(Number(amount));
  };

  const getStatusBadge = (status: any) => {
    if ('paid' in status) return <Badge variant="default" className="bg-green-600">Paid</Badge>;
    if ('partiallyPaid' in status) return <Badge variant="secondary">Partially Paid</Badge>;
    if ('excess' in status) return <Badge className="bg-blue-600">Excess</Badge>;
    return <Badge variant="outline">Unpaid</Badge>;
  };

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Retailer Code</TableHead>
              <TableHead>Retailer Name</TableHead>
              <TableHead>Invoice Number</TableHead>
              <TableHead>Invoice Date</TableHead>
              <TableHead>Salesman</TableHead>
              <TableHead className="text-right">Balance</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentInvoices.map((invoice) => (
              <TableRow key={invoice.invoiceNumber} className="cursor-pointer hover:bg-muted/50">
                <TableCell className="font-medium">{invoice.retailerCode}</TableCell>
                <TableCell>{invoice.retailerName}</TableCell>
                <TableCell>{invoice.invoiceNumber}</TableCell>
                <TableCell>{invoice.invoiceDate}</TableCell>
                <TableCell>{invoice.salesmanName}</TableCell>
                <TableCell className="text-right font-medium">
                  {formatCurrency(invoice.balanceAmount)}
                </TableCell>
                <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate({ to: `/payment-entry/${invoice.invoiceNumber}` })}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Pay
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate({ to: `/payment-history/${invoice.retailerCode}` })}
                    >
                      <History className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {startIndex + 1} to {Math.min(endIndex, invoices.length)} of {invoices.length} invoices
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
