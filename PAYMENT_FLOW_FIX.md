# Payment Flow UX Issue - FIXED ✅

## Issue Description
Users who initiated payment and got redirected to Midtrans payment page, then decided to go back to browse products without completing payment, could not see the "Continue Payment" button on the order status page.

## Root Cause Analysis
The issue was in the `check-payment-status` function (`supabase/functions/check-payment-status/index.ts`):

### Problem 1: Incorrect Status Mapping
```typescript
// ❌ BEFORE (Line 119)
} else if (paymentStatus.transaction_status === 'pending') {
  newOrderStatus = 'pending_payment';  // This status doesn't exist in DB constraint
}
```

The function was setting order status to `'pending_payment'` instead of `'pending'` when payment was still pending. Since the Continue Payment button only shows for orders with status `'pending'`, it wouldn't appear.

### Problem 2: Invalid Status Values
The function was using status values that don't match the database constraint:
- `'pending_payment'` → Should be `'pending'`
- `'payment_failed'` → Should be `'cancelled'` or `'failed'`

## Solution Implemented ✅

### 1. Fixed Status Mapping
```typescript
// ✅ AFTER (Line 119)
} else if (paymentStatus.transaction_status === 'pending') {
  newOrderStatus = 'pending'; // Keep as 'pending' so Continue Payment button shows
} else if (['deny', 'cancel', 'expire', 'failure'].includes(paymentStatus.transaction_status)) {
  newOrderStatus = 'cancelled'; // Use 'cancelled' instead of 'payment_failed' to match DB constraint
}
```

### 2. Added Support for 'failed' Status
Updated all UI components to handle the `'failed'` status that's allowed by the database constraint:

- `src/pages/Orders.tsx`
- `src/pages/OrderDetail.tsx` 
- `src/pages/Account.tsx`
- `src/pages/admin/Dashboard.tsx`
- `src/pages/admin/Orders.tsx`
- `src/pages/admin/OrderDetail.tsx`

## Continue Payment Button Logic ✅

The button correctly appears when:
1. `order.status === 'pending'` ✅
2. `order.payment_url` exists (not null/empty) ✅

### Button Locations:
1. **Orders Page** (`src/pages/Orders.tsx` line 356-365) ✅
2. **Order Detail Page** (`src/pages/OrderDetail.tsx` line 390-398) ✅  
3. **Account Page** (`src/pages/Account.tsx` line 291-300) ✅

## Payment URL Handling ✅

- Payment URLs are stored when orders are created ✅
- URLs are only cleared when payment is successful (`status = 'paid'`) ✅
- URLs persist for pending orders so users can resume payment ✅

## Database Constraint Compliance ✅

All status values now comply with the database constraint:
```sql
CHECK (status IN ('pending', 'processing', 'paid', 'shipped', 'delivered', 'cancelled', 'failed'))
```

## Testing Scenario ✅

1. User initiates payment → Order created with `status = 'pending'` and `payment_url` stored
2. User redirected to Midtrans → Payment page opens
3. User goes back without completing → Order remains `status = 'pending'` (FIXED)
4. User visits Orders page → "Continue Payment" button appears (FIXED)
5. User clicks button → Payment page opens in new tab
6. User completes payment → Status changes to `'paid'` and `payment_url` cleared

## Files Modified ✅

1. `supabase/functions/check-payment-status/index.ts` - Fixed status mapping
2. `src/pages/Orders.tsx` - Added 'failed' status support
3. `src/pages/OrderDetail.tsx` - Added 'failed' status support
4. `src/pages/Account.tsx` - Added 'failed' status support
5. `src/pages/admin/Dashboard.tsx` - Added 'failed' status support
6. `src/pages/admin/Orders.tsx` - Added 'failed' status support
7. `src/pages/admin/OrderDetail.tsx` - Added 'failed' status support

## Result ✅

Users can now successfully resume incomplete payments by clicking the "Continue Payment" button that appears on:
- Order listing pages
- Individual order detail pages
- Account order history

The button opens the stored Midtrans payment URL in a new tab, allowing users to complete their payment seamlessly.
