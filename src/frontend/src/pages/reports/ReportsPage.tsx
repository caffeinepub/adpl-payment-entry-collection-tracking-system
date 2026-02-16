import { useState } from 'react';
import { useGetReportsData } from '../../hooks/useQueries';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import ReportsFilters from '../../components/reports/ReportsFilters';
import RetailerLedgerTable from '../../components/reports/RetailerLedgerTable';
import { exportReportsToXlsx } from '../../utils/export/exportReportsToXlsx';
import { toast } from 'sonner';
import { Download, DollarSign, TrendingUp, AlertCircle } from 'lucide-react';
import type { PaymentMode, PaymentType } from '../../backend';

export default function ReportsPage() {
  const [filters, setFilters] = useState<{
    startDate: bigint | null;
    endDate: bigint | null;
    salesmanName: string | null;
    paymentType: PaymentType | null;
    paymentMode: PaymentMode | null;
  }>({
    startDate: null,
    endDate: null,
    salesmanName: null,
    paymentType: null,
    paymentMode: null,
  });

  const { data: reportsData, isLoading } = useGetReportsData(filters);

  const handleExport = () => {
    if (!reportsData) {
      toast.error('No data to export');
      return;
    }

    try {
      exportReportsToXlsx(reportsData, filters);
      toast.success('Report exported successfully as CSV');
    } catch (error: any) {
      toast.error(error.message || 'Failed to export report');
    }
  };

  const formatCurrency = (amount: bigint) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(Number(amount));
  };

  const stats = [
    {
      title: 'Total Collected',
      value: reportsData ? formatCurrency(reportsData.totalCollected) : '₹0',
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-50 dark:bg-green-950',
    },
    {
      title: 'Total Excess',
      value: reportsData ? formatCurrency(reportsData.totalExcess) : '₹0',
      icon: TrendingUp,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-950',
    },
    {
      title: 'Pending Balance',
      value: reportsData ? formatCurrency(reportsData.pendingBalance) : '₹0',
      icon: AlertCircle,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50 dark:bg-orange-950',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
          <p className="text-muted-foreground mt-2">
            Generate and download payment reports
          </p>
        </div>
        <Button onClick={handleExport} disabled={!reportsData || reportsData.payments.length === 0}>
          <Download className="mr-2 h-4 w-4" />
          Export to CSV
        </Button>
      </div>

      <ReportsFilters filters={filters} onChange={setFilters} />

      <div className="grid gap-4 md:grid-cols-3">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <div className={`${stat.bgColor} p-2 rounded-lg`}>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Retailer-wise Ledger</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                <p className="text-sm text-muted-foreground">Loading report...</p>
              </div>
            </div>
          ) : !reportsData || reportsData.payments.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No data available for the selected filters</p>
            </div>
          ) : (
            <RetailerLedgerTable payments={reportsData.payments} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
