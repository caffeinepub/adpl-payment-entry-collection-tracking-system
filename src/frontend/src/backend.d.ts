import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export type Time = bigint;
export interface PaymentEntry {
    id: bigint;
    retailerCode: string;
    invoiceNumber: string;
    createdTimestamp: Time;
    paymentMode: PaymentMode;
    paymentType: PaymentType;
    paymentAmount: bigint;
    enteredBy: Principal;
}
export interface Invoice {
    status: InvoiceStatus;
    balanceAmount: bigint;
    retailerCode: string;
    retailerName: string;
    salesmanName: string;
    invoiceDate: string;
    invoiceNumber: string;
}
export interface UserProfile {
    name: string;
    role: string;
}
export enum InvoiceStatus {
    paid = "paid",
    unpaid = "unpaid",
    excess = "excess",
    partiallyPaid = "partiallyPaid"
}
export enum PaymentMode {
    cash = "cash",
    bankTransfer = "bankTransfer",
    cheque = "cheque"
}
export enum PaymentType {
    excessPayment = "excessPayment",
    invoicePayment = "invoicePayment"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addPayment(invoiceNumber: string, retailerCode: string, paymentAmount: bigint, paymentType: PaymentType, paymentMode: PaymentMode): Promise<string>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    clearAllData(): Promise<void>;
    editPayment(paymentId: bigint, paymentAmount: bigint, paymentType: PaymentType, paymentMode: PaymentMode): Promise<void>;
    getAllInvoices(): Promise<Array<Invoice>>;
    getAllPayments(): Promise<Array<PaymentEntry>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getInvoice(invoiceNumber: string): Promise<Invoice | null>;
    getPaymentHistory(retailerCode: string): Promise<Array<PaymentEntry>>;
    getReportsData(startDate: Time | null, endDate: Time | null, salesmanName: string | null, paymentType: PaymentType | null, paymentMode: PaymentMode | null): Promise<{
        payments: Array<PaymentEntry>;
        totalCollected: bigint;
        totalExcess: bigint;
        pendingBalance: bigint;
    }>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    uploadInvoices(rawInvoices: Array<Invoice>): Promise<void>;
}
