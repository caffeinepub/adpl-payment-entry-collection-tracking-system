import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Eye, History, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import type { Invoice } from '../../backend';
import { normalizeInvoiceStatus } from '@/utils/invoices/normalizeInvoiceStatus';
import { calculateAgeingDays, formatAgeingDays } from '@/utils/invoices/ageingDays';

interface InvoicesTableProps {
  invoices: Invoice[];
}

type SortDirection = 'asc' | 'desc' | null;

export default function InvoicesTable({ invoices }: InvoicesTableProps) {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [ageingSortDirection, setAgeingSortDirection] = useState<SortDirection>(null);
  const itemsPerPage = 10;

  // Sort invoices by ageing days if sorting is active
  const sortedInvoices = ageingSortDirection
    ? [...invoices].sort((a, b) => {
        const ageingA = calculateAgeingDays(a.invoiceDate);
        const ageingB = calculateAgeingDays(b.invoiceDate);

        // Place null values at the bottom
        if (ageingA === null && ageingB === null) return 0;
        if (ageingA === null) return 1;
        if (ageingB === null) return -1;

        // Sort by ageing days
        if (ageingSortDirection === 'desc') {
          return ageingB - ageingA; // Oldest first (highest days)
        } else {
          return ageingA - ageingB; // Newest first (lowest days)
        }
      })
    : invoices;

  const totalPages = Math.ceil(sortedInvoices.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentInvoices = sortedInvoices.slice(startIndex, endIndex);

  const formatCurrency = (amount: bigint) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(Number(amount));
  };

  const getStatusBadge = (status: any) => {
    const normalizedStatus = normalizeInvoiceStatus(status);
    
    switch (normalizedStatus) {
      case 'paid':
        return <Badge variant="default" className="bg-green-600">Paid</Badge>;
      case 'partiallyPaid':
        return <Badge variant="secondary">Partially Paid</Badge>;
      case 'excess':
        return <Badge className="bg-blue-600">Excess</Badge>;
      case 'unpaid':
      default:
        return <Badge variant="outline">Unpaid</Badge>;
    }
  };

  const toggleAgeingSort = () => {
    if (ageingSortDirection === null) {
      setAgeingSortDirection('desc'); // Start with oldest first
    } else if (ageingSortDirection === 'desc') {
      setAgeingSortDirection('asc'); // Then newest first
    } else {
      setAgeingSortDirection(null); // Then no sort
    }
    setCurrentPage(1); // Reset to first page when sorting changes
  };

  const getSortIcon = () => {
    if (ageingSortDirection === 'desc') {
      return <ArrowDown className="h-4 w-4 ml-1" />;
    } else if (ageingSortDirection === 'asc') {
      return <ArrowUp className="h-4 w-4 ml-1" />;
    } else {
      return <ArrowUpDown className="h-4 w-4 ml-1 opacity-50" />;
    }
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
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleAgeingSort}
                  className="h-auto p-0 font-medium hover:bg-transparent"
                >
                  Ageing Days
                  {getSortIcon()}
                </Button>
              </TableHead>
              <TableHead>Salesman</TableHead>
              <TableHead className="text-right">Balance</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentInvoices.map((invoice) => {
              const ageingDays = calculateAgeingDays(invoice.invoiceDate);
              return (
                <TableRow key={invoice.invoiceNumber} className="cursor-pointer hover:bg-muted/50">
                  <TableCell className="font-medium">{invoice.retailerCode}</TableCell>
                  <TableCell>{invoice.retailerName}</TableCell>
                  <TableCell>{invoice.invoiceNumber}</TableCell>
                  <TableCell>{invoice.invoiceDate}</TableCell>
                  <TableCell className="font-medium">
                    {formatAgeingDays(ageingDays)}
                  </TableCell>
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
              );
            })}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {startIndex + 1} to {Math.min(endIndex, sortedInvoices.length)} of {sortedInvoices.length} invoices
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
