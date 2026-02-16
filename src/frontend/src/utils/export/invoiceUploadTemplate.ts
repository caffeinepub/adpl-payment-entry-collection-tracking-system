/**
 * Generates and downloads an invoice upload template CSV file
 * with all required columns plus an optional "Ageing Days" column.
 */
export function downloadInvoiceUploadTemplate(): void {
  // Define headers including the optional "Ageing Days" column
  const headers = [
    'Retailer Code',
    'Retailer Name',
    'Invoice Number',
    'Invoice Date',
    'Salesman Name',
    'Balance Amount',
    'Ageing Days',
  ];

  // Create CSV content with headers only (no sample data)
  const csvContent = headers.join(',') + '\n';

  // Create a Blob from the CSV content
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });

  // Create a download link and trigger download
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', 'invoice_upload_template.csv');
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Clean up the URL object
  URL.revokeObjectURL(url);
}
