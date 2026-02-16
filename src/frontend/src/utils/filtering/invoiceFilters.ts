import type { Invoice } from '../../backend';

export interface InvoiceFilters {
  retailerName?: string;
  retailerCode?: string;
  invoiceNumber?: string;
  salesmanName?: string;
}

export function filterInvoices(
  invoices: Invoice[],
  filters: InvoiceFilters
): Invoice[] {
  return invoices.filter((invoice) => {
    if (
      filters.retailerName &&
      !invoice.retailerName
        .toLowerCase()
        .includes(filters.retailerName.toLowerCase())
    ) {
      return false;
    }

    if (
      filters.retailerCode &&
      !invoice.retailerCode
        .toLowerCase()
        .includes(filters.retailerCode.toLowerCase())
    ) {
      return false;
    }

    if (
      filters.invoiceNumber &&
      !invoice.invoiceNumber
        .toLowerCase()
        .includes(filters.invoiceNumber.toLowerCase())
    ) {
      return false;
    }

    if (
      filters.salesmanName &&
      invoice.salesmanName !== filters.salesmanName
    ) {
      return false;
    }

    return true;
  });
}
