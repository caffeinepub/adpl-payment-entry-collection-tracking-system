import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { Invoice, PaymentEntry, UserProfile } from '../backend';
import { PaymentMode, PaymentType, UserRole } from '../backend';
import type { Principal } from '@icp-sdk/core/principal';
import { htmlDateToBackendTime } from '../utils/payments/paymentDates';

export function useGetAllInvoices() {
  const { actor, isFetching } = useActor();

  return useQuery<Invoice[]>({
    queryKey: ['invoices'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllInvoices();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetInvoice(invoiceNumber: string) {
  const { actor, isFetching } = useActor();

  return useQuery<Invoice | null>({
    queryKey: ['invoice', invoiceNumber],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getInvoice(invoiceNumber);
    },
    enabled: !!actor && !isFetching && !!invoiceNumber,
  });
}

export function useGetAllPayments() {
  const { actor, isFetching } = useActor();

  return useQuery<PaymentEntry[]>({
    queryKey: ['payments'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllPayments();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetPaymentHistory(retailerCode: string) {
  const { actor, isFetching } = useActor();

  return useQuery<PaymentEntry[]>({
    queryKey: ['paymentHistory', retailerCode],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getPaymentHistory(retailerCode);
    },
    enabled: !!actor && !isFetching && !!retailerCode,
  });
}

export function useUploadInvoices() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (invoices: Invoice[]) => {
      if (!actor) throw new Error('Actor not available');
      return actor.uploadInvoices(invoices);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['reportsData'] });
    },
  });
}

export function useClearAllData() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.clearAllData();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['invoice'] });
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['paymentHistory'] });
      queryClient.invalidateQueries({ queryKey: ['reportsData'] });
    },
  });
}

export function useAddPayment() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      invoiceNumber,
      retailerCode,
      paymentAmount,
      paymentType,
      paymentMode,
      transactionId,
      chequeBankName,
      chequeNumber,
      chequeDate,
      bankTransferDate,
    }: {
      invoiceNumber: string;
      retailerCode: string;
      paymentAmount: bigint;
      paymentType: PaymentType;
      paymentMode: PaymentMode;
      transactionId?: string | null;
      chequeBankName?: string | null;
      chequeNumber?: string | null;
      chequeDate?: bigint | null;
      bankTransferDate?: bigint | null;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.addPayment(
        [invoiceNumber],
        retailerCode,
        paymentAmount,
        paymentType,
        paymentMode,
        transactionId || null,
        chequeBankName || null,
        chequeNumber || null,
        chequeDate || null,
        bankTransferDate || null
      );
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['invoice', variables.invoiceNumber] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['paymentHistory', variables.retailerCode] });
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['reportsData'] });
    },
  });
}

export function useAddBatchPayment() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      selectedInvoices,
      totalPaymentAmount,
      paymentMode,
      transactionId,
      chequeBankName,
      chequeNumber,
      paymentDate,
    }: {
      selectedInvoices: Invoice[];
      totalPaymentAmount: bigint;
      paymentMode: 'cheque' | 'online';
      transactionId?: string;
      chequeBankName?: string;
      chequeNumber?: string;
      paymentDate: string;
    }) => {
      if (!actor) throw new Error('Actor not available');

      // Convert date to backend time
      const dateInNanos = htmlDateToBackendTime(paymentDate);
      if (!dateInNanos) {
        throw new Error('Invalid payment date');
      }

      const backendPaymentMode = paymentMode === 'cheque' ? PaymentMode.cheque : PaymentMode.bankTransfer;
      
      // Group invoices by retailer
      const invoicesByRetailer = selectedInvoices.reduce((acc, inv) => {
        if (!acc[inv.retailerCode]) {
          acc[inv.retailerCode] = [];
        }
        acc[inv.retailerCode].push(inv);
        return acc;
      }, {} as Record<string, Invoice[]>);

      // Calculate payment distribution per retailer
      const totalOutstanding = selectedInvoices.reduce((sum, inv) => sum + Number(inv.balanceAmount), 0);
      const paymentEntries: Array<[bigint, string, Array<string>, PaymentType, PaymentMode, string | null, string | null, string | null, bigint | null, bigint | null]> = [];

      for (const [retailerCode, invoices] of Object.entries(invoicesByRetailer)) {
        const retailerOutstanding = invoices.reduce((sum, inv) => sum + Number(inv.balanceAmount), 0);
        const retailerPayment = Math.round((retailerOutstanding / totalOutstanding) * Number(totalPaymentAmount));
        
        paymentEntries.push([
          BigInt(retailerPayment),
          retailerCode,
          invoices.map(inv => inv.invoiceNumber),
          PaymentType.invoicePayment,
          backendPaymentMode,
          paymentMode === 'online' ? (transactionId || null) : null,
          paymentMode === 'cheque' ? (chequeBankName || null) : null,
          paymentMode === 'cheque' ? (chequeNumber || null) : null,
          paymentMode === 'cheque' ? dateInNanos : null,
          paymentMode === 'online' ? dateInNanos : null,
        ]);
      }

      // Use the first retailer code as the main retailer code for the batch
      const mainRetailerCode = Object.keys(invoicesByRetailer)[0];

      return actor.enterBatchPayment(
        totalPaymentAmount,
        paymentEntries,
        mainRetailerCode
      );
    },
    onSuccess: (_, variables) => {
      variables.selectedInvoices.forEach((invoice) => {
        queryClient.invalidateQueries({ queryKey: ['invoice', invoice.invoiceNumber] });
        queryClient.invalidateQueries({ queryKey: ['paymentHistory', invoice.retailerCode] });
      });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['reportsData'] });
    },
  });
}

export function useEditPayment() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      paymentId,
      paymentAmount,
      paymentType,
      paymentMode,
      transactionId,
      chequeBankName,
      chequeNumber,
      chequeDate,
      bankTransferDate,
    }: {
      paymentId: bigint;
      paymentAmount: bigint;
      paymentType: PaymentType;
      paymentMode: PaymentMode;
      transactionId?: string | null;
      chequeBankName?: string | null;
      chequeNumber?: string | null;
      chequeDate?: bigint | null;
      bankTransferDate?: bigint | null;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.editPayment(
        paymentId,
        paymentAmount,
        paymentType,
        paymentMode,
        transactionId || null,
        chequeBankName || null,
        chequeNumber || null,
        chequeDate || null,
        bankTransferDate || null
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['paymentHistory'] });
      queryClient.invalidateQueries({ queryKey: ['reportsData'] });
    },
  });
}

export function useGetReportsData(filters: {
  startDate: bigint | null;
  endDate: bigint | null;
  salesmanName: string | null;
  paymentType: PaymentType | null;
  paymentMode: PaymentMode | null;
}) {
  const { actor, isFetching } = useActor();

  return useQuery({
    queryKey: [
      'reportsData',
      filters.startDate?.toString(),
      filters.endDate?.toString(),
      filters.salesmanName,
      filters.paymentType,
      filters.paymentMode,
    ],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getReportsData(
        filters.startDate,
        filters.endDate,
        filters.salesmanName,
        filters.paymentType,
        filters.paymentMode
      );
    },
    enabled: !!actor && !isFetching,
  });
}

// User Management Hooks
export function useGetAllUserProfiles() {
  const { actor, isFetching } = useActor();

  return useQuery<Array<{
    principal: Principal;
    profile: UserProfile | null;
    effectiveRole: UserRole;
  }>>({
    queryKey: ['allUserProfiles'],
    queryFn: async () => {
      if (!actor) return [];
      
      // Get all payments to extract unique principals
      const payments = await actor.getAllPayments();
      const principalSet = new Set<string>();
      
      payments.forEach(payment => {
        principalSet.add(payment.enteredBy.toString());
      });

      // Fetch profile for each principal
      const userPromises = Array.from(principalSet).map(async (principalStr) => {
        const principal = payments.find(p => p.enteredBy.toString() === principalStr)!.enteredBy;
        try {
          const profile = await actor.getUserProfile(principal);
          
          // Infer role from profile or default to user
          const effectiveRole = (profile?.role === 'admin' ? UserRole.admin : UserRole.user) as UserRole;
          
          return {
            principal,
            profile,
            effectiveRole,
          };
        } catch {
          return {
            principal,
            profile: null,
            effectiveRole: UserRole.user,
          };
        }
      });

      return Promise.all(userPromises);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAssignUserRole() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ user, role }: { user: Principal; role: UserRole }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.assignCallerUserRole(user, role);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allUserProfiles'] });
      queryClient.invalidateQueries({ queryKey: ['currentUserRole'] });
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}
