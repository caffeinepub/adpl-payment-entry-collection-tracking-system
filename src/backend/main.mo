// This backend does not need any changes, as authentication/authorization is already handled by the prefabricated authorization component.
// Full login and session management flows depend on the frontend client.
import Array "mo:core/Array";
import Iter "mo:core/Iter";
import Order "mo:core/Order";
import Text "mo:core/Text";
import Time "mo:core/Time";
import List "mo:core/List";
import Map "mo:core/Map";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";
import Int "mo:core/Int";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";

actor {
  // Role-based Access Control
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

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

  public type PaymentType = {
    #invoicePayment;
    #excessPayment;
  };

  type PaymentEntry = {
    id : Nat;
    invoiceNumber : Text;
    retailerCode : Text;
    paymentAmount : Nat;
    paymentType : PaymentType;
    paymentMode : PaymentMode;
    enteredBy : Principal;
    createdTimestamp : Time.Time;
  };

  public type Invoice = {
    retailerCode : Text;
    retailerName : Text;
    invoiceNumber : Text;
    invoiceDate : Text;
    salesmanName : Text;
    balanceAmount : Nat;
    status : InvoiceStatus;
  };

  public type UserProfile = {
    name : Text;
    role : Text;
  };

  module PaymentEntry {
    public func compare(entry1 : PaymentEntry, entry2 : PaymentEntry) : Order.Order {
      Int.compare(entry1.createdTimestamp, entry2.createdTimestamp);
    };
  };

  // Storage
  var invoices = Map.empty<Text, Invoice>();
  var payments = List.empty<PaymentEntry>();
  var nextPaymentId : Nat = 0;
  let userProfiles = Map.empty<Principal, UserProfile>();

  // User Profile Management
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (caller.isAnonymous()) {
      Runtime.trap("Unauthorized: Only authenticated users can view profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (caller.isAnonymous()) {
      Runtime.trap("Unauthorized: Only authenticated users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // Raw Data Upload (Admin only)
  public shared ({ caller }) func uploadInvoices(rawInvoices : [Invoice]) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can upload invoices");
    };

    for (invoice in rawInvoices.values()) {
      invoices.add(invoice.invoiceNumber, invoice);
    };
  };

  // Clear All Data (Admin only)
  public shared ({ caller }) func clearAllData() : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can clear data");
    };
    invoices := Map.empty<Text, Invoice>();
    payments := List.empty<PaymentEntry>();
    nextPaymentId := 0;
  };

  // Add Payment Entry (User and Admin)
  public shared ({ caller }) func addPayment(
    invoiceNumber : Text,
    retailerCode : Text,
    paymentAmount : Nat,
    paymentType : PaymentType,
    paymentMode : PaymentMode
  ) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can add payments");
    };

    switch (invoices.get(invoiceNumber)) {
      case (null) { Runtime.trap("Invoice not found") };
      case (?invoice) {
        if (invoice.retailerCode != retailerCode) {
          Runtime.trap("Retailer code mismatch");
        };

        let newPayment : PaymentEntry = {
          id = nextPaymentId;
          invoiceNumber = invoiceNumber;
          retailerCode = retailerCode;
          paymentAmount = paymentAmount;
          paymentType = paymentType;
          paymentMode = paymentMode;
          enteredBy = caller;
          createdTimestamp = Time.now();
        };

        nextPaymentId += 1;
        payments.add(newPayment);

        let updatedInvoice = {
          invoice with balanceAmount = if (paymentType == #invoicePayment) {
            if (paymentAmount > invoice.balanceAmount) {
              0;
            } else {
              invoice.balanceAmount - paymentAmount;
            };
          } else {
            invoice.balanceAmount;
          };
          status = if (paymentType == #invoicePayment) {
            let newBalance = if (paymentAmount > invoice.balanceAmount) {
              0;
            } else {
              invoice.balanceAmount - paymentAmount;
            };
            if (newBalance == 0 and paymentAmount > invoice.balanceAmount) {
              #excess;
            } else if (newBalance == 0) {
              #paid;
            } else if (newBalance < invoice.balanceAmount) {
              #partiallyPaid;
            } else {
              #unpaid;
            };
          } else {
            invoice.status;
          };
        };

        invoices.add(invoiceNumber, updatedInvoice);

        "Payment successfully recorded for ADPL";
      };
    };
  };

  // Edit Payment Entry (Admin only)
  public shared ({ caller }) func editPayment(
    paymentId : Nat,
    paymentAmount : Nat,
    paymentType : PaymentType,
    paymentMode : PaymentMode
  ) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can edit payments");
    };

    let paymentArray = payments.toArray();
    var found = false;
    var oldPayment : ?PaymentEntry = null;

    for (payment in paymentArray.vals()) {
      if (payment.id == paymentId) {
        found := true;
        oldPayment := ?payment;
      };
    };

    if (not found) {
      Runtime.trap("Payment entry not found");
    };

    switch (oldPayment) {
      case (null) { Runtime.trap("Payment entry not found") };
      case (?old) {
        // Revert old payment effect
        switch (invoices.get(old.invoiceNumber)) {
          case (null) {};
          case (?invoice) {
            let revertedBalance = if (old.paymentType == #invoicePayment) {
              invoice.balanceAmount + old.paymentAmount;
            } else {
              invoice.balanceAmount;
            };

            let revertedInvoice = {
              invoice with balanceAmount = revertedBalance;
            };
            invoices.add(old.invoiceNumber, revertedInvoice);
          };
        };

        // Apply new payment
        let updatedPayment : PaymentEntry = {
          old with paymentAmount = paymentAmount;
          paymentType = paymentType;
          paymentMode = paymentMode;
        };

        payments := payments.map<PaymentEntry, PaymentEntry>(
          func(p : PaymentEntry) : PaymentEntry {
            if (p.id == paymentId) { updatedPayment } else { p };
          }
        );

        switch (invoices.get(old.invoiceNumber)) {
          case (null) {};
          case (?invoice) {
            let newBalance = if (paymentType == #invoicePayment) {
              if (paymentAmount > invoice.balanceAmount) {
                0;
              } else {
                invoice.balanceAmount - paymentAmount;
              };
            } else {
              invoice.balanceAmount;
            };

            let newStatus = if (paymentType == #invoicePayment) {
              if (newBalance == 0 and paymentAmount > invoice.balanceAmount) {
                #excess;
              } else if (newBalance == 0) {
                #paid;
              } else if (newBalance < invoice.balanceAmount) {
                #partiallyPaid;
              } else {
                #unpaid;
              };
            } else {
              invoice.status;
            };

            let updatedInvoice = {
              invoice with balanceAmount = newBalance;
              status = newStatus;
            };
            invoices.add(old.invoiceNumber, updatedInvoice);
          };
        };
      };
    };
  };

  // Get Payment History for Retailer (User and Admin)
  public query ({ caller }) func getPaymentHistory(retailerCode : Text) : async [PaymentEntry] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view payment history");
    };

    payments.toArray().filter(
      func(entry : PaymentEntry) : Bool {
        entry.retailerCode == retailerCode;
      }
    );
  };

  // Get Invoice by Number (User and Admin)
  public query ({ caller }) func getInvoice(invoiceNumber : Text) : async ?Invoice {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view invoices");
    };
    invoices.get(invoiceNumber);
  };

  // Get All Invoices (User and Admin)
  public query ({ caller }) func getAllInvoices() : async [Invoice] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view invoices");
    };
    invoices.values().toArray();
  };

  // Get All Payments (User and Admin)
  public query ({ caller }) func getAllPayments() : async [PaymentEntry] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view payments");
    };
    payments.toArray();
  };

  // Get Reports Data (User and Admin)
  public query ({ caller }) func getReportsData(
    startDate : ?Time.Time,
    endDate : ?Time.Time,
    salesmanName : ?Text,
    paymentType : ?PaymentType,
    paymentMode : ?PaymentMode
  ) : async {
    totalCollected : Nat;
    totalExcess : Nat;
    pendingBalance : Nat;
    payments : [PaymentEntry];
  } {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view reports");
    };

    let filteredPayments = payments.toArray().filter(
      func(entry : PaymentEntry) : Bool {
        var matches = true;

        switch (startDate) {
          case (?start) { matches := matches and entry.createdTimestamp >= start };
          case (null) {};
        };

        switch (endDate) {
          case (?end) { matches := matches and entry.createdTimestamp <= end };
          case (null) {};
        };

        switch (paymentType) {
          case (?pType) { matches := matches and entry.paymentType == pType };
          case (null) {};
        };

        switch (paymentMode) {
          case (?pMode) { matches := matches and entry.paymentMode == pMode };
          case (null) {};
        };

        matches;
      }
    );
    var totalCollected : Nat = 0;
    var totalExcess : Nat = 0;

    for (payment in filteredPayments.vals()) {
      if (payment.paymentType == #invoicePayment) {
        totalCollected += payment.paymentAmount;
      } else {
        totalExcess += payment.paymentAmount;
      };
    };

    var pendingBalance : Nat = 0;
    for (invoice in invoices.values()) {
      pendingBalance += invoice.balanceAmount;
    };

    {
      totalCollected = totalCollected;
      totalExcess = totalExcess;
      pendingBalance = pendingBalance;
      payments = filteredPayments;
    };
  };
};

