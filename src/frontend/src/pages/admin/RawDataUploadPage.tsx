import { useState } from 'react';
import { useGetAllInvoices, useUploadInvoices, useClearAllData } from '../../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import InvoicesTable from '../../components/tables/InvoicesTable';
import { parseInvoicesXlsx } from '../../utils/excel/parseInvoicesXlsx';
import { downloadInvoiceUploadTemplate } from '../../utils/export/invoiceUploadTemplate';
import { toast } from 'sonner';
import { Upload, Search, Trash2, AlertTriangle, Download } from 'lucide-react';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import { filterInvoices } from '../../utils/filtering/invoiceFilters';

export default function RawDataUploadPage() {
  const { data: invoices = [], isLoading } = useGetAllInvoices();
  const uploadMutation = useUploadInvoices();
  const clearDataMutation = useClearAllData();
  const { isAdmin } = useCurrentUser();
  const [uploading, setUploading] = useState(false);
  const [searchRetailerName, setSearchRetailerName] = useState('');
  const [searchRetailerCode, setSearchRetailerCode] = useState('');
  const [searchInvoiceNumber, setSearchInvoiceNumber] = useState('');
  const [filterSalesman, setFilterSalesman] = useState('');

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const parsedInvoices = await parseInvoicesXlsx(file);
      await uploadMutation.mutateAsync(parsedInvoices);
      toast.success('Invoices uploaded successfully');
      event.target.value = '';
    } catch (error: any) {
      toast.error(error.message || 'Failed to upload invoices');
    } finally {
      setUploading(false);
    }
  };

  const handleClearAllData = async () => {
    try {
      await clearDataMutation.mutateAsync();
      toast.success('All data has been cleared successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to clear data');
    }
  };

  const handleDownloadTemplate = () => {
    try {
      downloadInvoiceUploadTemplate();
      toast.success('Template downloaded successfully');
    } catch (error: any) {
      toast.error('Failed to download template');
    }
  };

  const filteredInvoices = filterInvoices(invoices, {
    retailerName: searchRetailerName,
    retailerCode: searchRetailerCode,
    invoiceNumber: searchInvoiceNumber,
    salesmanName: filterSalesman,
  });

  const uniqueSalesmen = Array.from(new Set(invoices.map((inv) => inv.salesmanName))).sort();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Invoice Management</h1>
        <p className="text-muted-foreground mt-2">
          Upload and manage invoice data
        </p>
      </div>

      {isAdmin && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Upload Raw Data</CardTitle>
              <CardDescription>
                Upload CSV or tab-separated file with invoice data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-3 pb-4 border-b">
                  <Button
                    variant="outline"
                    onClick={handleDownloadTemplate}
                    className="gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Download Template
                  </Button>
                  <p className="text-sm text-muted-foreground">
                    Download a template file with the correct column headers
                  </p>
                </div>
                <div>
                  <Label htmlFor="file-upload">Select File (CSV or Tab-separated)</Label>
                  <div className="mt-2 flex items-center gap-4">
                    <Input
                      id="file-upload"
                      type="file"
                      accept=".csv,.txt,.xlsx"
                      onChange={handleFileUpload}
                      disabled={uploading}
                      className="max-w-md"
                    />
                    {uploading && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                        Uploading...
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-sm text-muted-foreground">
                  <p className="font-medium mb-1">Required columns:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Retailer Code</li>
                    <li>Retailer Name</li>
                    <li>Invoice Number</li>
                    <li>Invoice Date</li>
                    <li>Salesman Name</li>
                    <li>Balance Amount</li>
                  </ul>
                  <p className="mt-2 text-xs">
                    Note: File should be comma or tab separated. Excel files will be read as text.
                  </p>
                  <p className="mt-2 text-xs">
                    <strong>Ageing Days</strong> column is optional and will be auto-calculated in the app based on Invoice Date.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-destructive">
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                <CardTitle className="text-destructive">Danger Zone</CardTitle>
              </div>
              <CardDescription>
                Permanently erase all invoices and payment data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  This action will permanently delete all invoices and payments from the system. 
                  This cannot be undone. Use this to clear old data before uploading new records.
                </p>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="destructive"
                      disabled={clearDataMutation.isPending}
                      className="gap-2"
                    >
                      {clearDataMutation.isPending ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Clearing...
                        </>
                      ) : (
                        <>
                          <Trash2 className="h-4 w-4" />
                          Clear Old Data
                        </>
                      )}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-destructive" />
                        Are you absolutely sure?
                      </AlertDialogTitle>
                      <AlertDialogDescription className="space-y-2">
                        <p>
                          This action will permanently delete:
                        </p>
                        <ul className="list-disc list-inside space-y-1 ml-2">
                          <li>All invoices ({invoices.length} total)</li>
                          <li>All payment records</li>
                          <li>All payment history</li>
                        </ul>
                        <p className="font-semibold text-foreground mt-4">
                          This action cannot be undone.
                        </p>
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleClearAllData}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Yes, Clear All Data
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Search & Filter</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <Label htmlFor="search-retailer-name">Retailer Name</Label>
              <div className="relative mt-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search-retailer-name"
                  placeholder="Search..."
                  value={searchRetailerName}
                  onChange={(e) => setSearchRetailerName(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="search-retailer-code">Retailer Code</Label>
              <div className="relative mt-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search-retailer-code"
                  placeholder="Search..."
                  value={searchRetailerCode}
                  onChange={(e) => setSearchRetailerCode(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="search-invoice-number">Invoice Number</Label>
              <div className="relative mt-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search-invoice-number"
                  placeholder="Search..."
                  value={searchInvoiceNumber}
                  onChange={(e) => setSearchInvoiceNumber(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="filter-salesman">Salesman</Label>
              <select
                id="filter-salesman"
                value={filterSalesman}
                onChange={(e) => setFilterSalesman(e.target.value)}
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
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Invoices ({filteredInvoices.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                <p className="text-sm text-muted-foreground">Loading invoices...</p>
              </div>
            </div>
          ) : filteredInvoices.length === 0 ? (
            <div className="text-center py-12">
              <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {invoices.length === 0 ? 'No invoices uploaded yet' : 'No invoices match your search'}
              </p>
            </div>
          ) : (
            <InvoicesTable invoices={filteredInvoices} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
