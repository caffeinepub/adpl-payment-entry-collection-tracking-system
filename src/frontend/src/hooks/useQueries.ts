import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { Invoice, PaymentEntry, PaymentMode, PaymentType, UserProfile } from '../backend';
import { UserRole } from '../backend';
import type { Principal } from '@icp-sdk/core/principal';

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
    }: {
      invoiceNumber: string;
      retailerCode: string;
      paymentAmount: bigint;
      paymentType: PaymentType;
      paymentMode: PaymentMode;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.addPayment(invoiceNumber, retailerCode, paymentAmount, paymentType, paymentMode);
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

export function useEditPayment() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      paymentId,
      paymentAmount,
      paymentType,
      paymentMode,
    }: {
      paymentId: bigint;
      paymentAmount: bigint;
      paymentType: PaymentType;
      paymentMode: PaymentMode;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.editPayment(paymentId, paymentAmount, paymentType, paymentMode);
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

      // Fetch profile and role for each principal
      const userPromises = Array.from(principalSet).map(async (principalStr) => {
        const principal = payments.find(p => p.enteredBy.toString() === principalStr)!.enteredBy;
        try {
          const [profile, role] = await Promise.all([
            actor.getUserProfile(principal),
            actor.getCallerUserRole(), // Note: This gets caller's role, we need the target user's role
          ]);
          
          // Since we can't get other users' roles directly, we'll infer from their profile
          // or use a default. The backend should ideally provide a method to get any user's role.
          return {
            principal,
            profile,
            effectiveRole: (profile?.role === 'admin' ? UserRole.admin : UserRole.user) as UserRole,
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
