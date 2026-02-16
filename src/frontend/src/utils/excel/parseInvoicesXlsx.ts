import { Invoice, InvoiceStatus } from '../../backend';

const REQUIRED_COLUMNS = [
  'Retailer Code',
  'Retailer Name',
  'Invoice Number',
  'Invoice Date',
  'Salesman Name',
  'Balance Amount',
];

// Optional columns that can be present but will be ignored
const OPTIONAL_COLUMNS = [
  'Ageing Days',
];

// Simple CSV parser for .xlsx files (treating them as CSV)
function parseCSV(text: string): string[][] {
  const lines = text.split(/\r?\n/);
  const result: string[][] = [];
  
  for (const line of lines) {
    if (!line.trim()) continue;
    // Simple CSV parsing (handles basic cases)
    const values = line.split(/,|\t/).map(v => v.trim().replace(/^["']|["']$/g, ''));
    result.push(values);
  }
  
  return result;
}

export async function parseInvoicesXlsx(file: File): Promise<Invoice[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const rows = parseCSV(text);

        if (rows.length === 0) {
          reject(new Error('File is empty'));
          return;
        }

        const headers = rows[0];
        const missingColumns = REQUIRED_COLUMNS.filter(
          (col) => !headers.some(h => h.toLowerCase().includes(col.toLowerCase()))
        );

        if (missingColumns.length > 0) {
          reject(
            new Error(
              `Missing required columns: ${missingColumns.join(', ')}. Please upload a CSV file with tab or comma separated values.`
            )
          );
          return;
        }

        // Find column indexes for required columns
        const columnIndexes = {
          retailerCode: headers.findIndex(h => h.toLowerCase().includes('retailer code')),
          retailerName: headers.findIndex(h => h.toLowerCase().includes('retailer name')),
          invoiceNumber: headers.findIndex(h => h.toLowerCase().includes('invoice number')),
          invoiceDate: headers.findIndex(h => h.toLowerCase().includes('invoice date')),
          salesmanName: headers.findIndex(h => h.toLowerCase().includes('salesman')),
          balanceAmount: headers.findIndex(h => h.toLowerCase().includes('balance')),
        };

        // Note: "Ageing Days" column is optional and will be ignored if present
        // The app auto-calculates ageing days from Invoice Date

        const invoices: Invoice[] = [];

        for (let i = 1; i < rows.length; i++) {
          const row = rows[i];
          if (!row || row.length === 0 || !row[0]) continue;

          const balanceAmount = parseFloat(row[columnIndexes.balanceAmount]);
          if (isNaN(balanceAmount)) {
            reject(new Error(`Invalid balance amount at row ${i + 1}`));
            return;
          }

          invoices.push({
            retailerCode: String(row[columnIndexes.retailerCode] || '').trim(),
            retailerName: String(row[columnIndexes.retailerName] || '').trim(),
            invoiceNumber: String(row[columnIndexes.invoiceNumber] || '').trim(),
            invoiceDate: String(row[columnIndexes.invoiceDate] || '').trim(),
            salesmanName: String(row[columnIndexes.salesmanName] || '').trim(),
            balanceAmount: BigInt(Math.round(balanceAmount)),
            status: InvoiceStatus.unpaid,
          });
        }

        if (invoices.length === 0) {
          reject(new Error('No valid invoice data found in file'));
          return;
        }

        resolve(invoices);
      } catch (error: any) {
        reject(new Error(`Failed to parse file: ${error.message}`));
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsText(file);
  });
}
