export interface PaymentLine {
  id: string;
  mode: 'cash' | 'cheque' | 'online';
  amount: string;
  cashAmount: string;
  bankName: string;
  chequeNumber: string;
  chequeDate: string;
  chequeAmount: string;
  transactionId: string;
  transferDate: string;
  transferAmount: string;
}
