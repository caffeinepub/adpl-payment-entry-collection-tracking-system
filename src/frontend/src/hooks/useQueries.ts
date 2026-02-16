import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { Invoice, PaymentEntry, PaymentMode, PaymentType } from '../backend';

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
