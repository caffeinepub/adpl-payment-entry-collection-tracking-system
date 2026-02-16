import List "mo:core/List";
import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Time "mo:core/Time";

module {
  type InvoiceStatus = {
    #unpaid;
    #partiallyPaid;
    #paid;
    #excess;
  };

  type PaymentMode = {
    #cash;
    #cheque;
    #bankTransfer;
  };

  type PaymentType = {
    #invoicePayment;
    #excessPayment;
  };

  type OldPaymentEntry = {
    id : Nat;
    invoiceNumber : Text;
    retailerCode : Text;
    paymentAmount : Nat;
    paymentType : PaymentType;
    paymentMode : PaymentMode;
    enteredBy : Principal;
    createdTimestamp : Time.Time;
    transactionId : ?Text;
    chequeBankName : ?Text;
    chequeNumber : ?Text;
  };

  type OldActor = {
    invoices : Map.Map<Text, { retailerCode : Text; retailerName : Text; invoiceNumber : Text; invoiceDate : Text; salesmanName : Text; balanceAmount : Nat; status : InvoiceStatus }>;
    payments : List.List<OldPaymentEntry>;
    nextPaymentId : Nat;
  };

  type NewPaymentEntry = {
    id : Nat;
    invoiceNumber : Text;
    retailerCode : Text;
    paymentAmount : Nat;
    paymentType : PaymentType;
    paymentMode : PaymentMode;
    enteredBy : Principal;
    createdTimestamp : Time.Time;
    transactionId : ?Text;
    chequeBankName : ?Text;
    chequeNumber : ?Text;
    chequeDate : ?Time.Time;
    bankTransferDate : ?Time.Time;
  };

  type NewActor = {
    invoices : Map.Map<Text, { retailerCode : Text; retailerName : Text; invoiceNumber : Text; invoiceDate : Text; salesmanName : Text; balanceAmount : Nat; status : InvoiceStatus }>;
    payments : List.List<NewPaymentEntry>;
    nextPaymentId : Nat;
  };

  public func run(old : OldActor) : NewActor {
    let newPayments = old.payments.map<OldPaymentEntry, NewPaymentEntry>(
      func(oldPayment) {
        { oldPayment with chequeDate = null; bankTransferDate = null };
      }
    );
    { old with payments = newPayments };
  };
};
