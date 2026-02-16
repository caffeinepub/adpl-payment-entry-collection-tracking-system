# ADPL Payment Tracker - Go Live Checklist

## Pre-Deployment Verification

### 1. Authentication & Authorization
- [ ] Internet Identity login is working
- [ ] First user automatically becomes Admin
- [ ] Admin role has access to all features
- [ ] User role has appropriate restricted access
- [ ] Profile setup modal appears for new users
- [ ] Logout clears all cached data

### 2. Core Features - Admin
- [ ] Dashboard displays correct summary cards
- [ ] Invoice upload accepts CSV/TSV files
- [ ] Uploaded invoices appear in the table
- [ ] Search and filter work on invoices page
- [ ] Payment entry form validates correctly
- [ ] Payment history displays for each retailer
- [ ] Edit payment functionality works (Admin only)
- [ ] Reports page shows filtered data
- [ ] CSV export downloads correctly

### 3. Core Features - User
- [ ] User can view invoices
- [ ] User can enter payments
- [ ] User can view payment history
- [ ] User can view reports
- [ ] User CANNOT upload invoices
- [ ] User CANNOT edit payments

### 4. UI/UX
- [ ] App loads without errors on desktop
- [ ] App loads without errors on mobile
- [ ] Navigation menu works on all screen sizes
- [ ] All forms validate input correctly
- [ ] Loading states display during operations
- [ ] Error messages are clear and helpful
- [ ] Success messages confirm actions

### 5. Data Integrity
- [ ] Invoice balance updates after payment
- [ ] Payment status calculates correctly (Unpaid/Partially Paid/Paid/Excess)
- [ ] Excess payment warnings appear when appropriate
- [ ] Reports totals match individual payment records
- [ ] Edited payments update invoice balances correctly

### 6. Browser Compatibility
- [ ] Chrome/Edge (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Mobile browsers (iOS Safari, Chrome Android)

## Known Limitations

### Admin Identity
- The **first Internet Identity that logs in** becomes the Admin automatically
- This cannot be changed through the UI
- To identify your Admin identity:
  1. Log out completely
  2. Try different passkeys when logging in
  3. Check the role displayed under your name
  4. The identity showing "Admin" is your admin account

### File Upload Format
- Upload accepts CSV/TSV files (including .xlsx saved as text)
- Required columns: Retailer Code, Retailer Name, Invoice Number, Invoice Date, Salesman Name, Balance Amount
- Files must be properly formatted with headers

## Post-Deployment Smoke Test

After going live, verify:

1. **Navigate to your live URL**
2. **Login screen loads** ✓
3. **Sign in with Internet Identity** ✓
4. **Profile setup appears** (if first time) ✓
5. **Dashboard loads** with summary cards ✓
6. **Navigate to Invoices** page ✓
7. **Navigate to Reports** page ✓
8. **Logout** works ✓

## Support

If you encounter issues after going live:
- Check browser console for errors
- Verify Internet Identity is working at identity.internetcomputer.org
- Ensure you're using the correct Admin passkey for upload features
- Clear browser cache and try again

---

**Version:** 1.0  
**Last Updated:** February 16, 2026  
**Status:** Ready for Production
