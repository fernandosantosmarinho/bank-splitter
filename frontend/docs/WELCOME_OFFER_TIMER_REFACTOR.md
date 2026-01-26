# Welcome Offer Timer Refactoring - Summary

## Problem Statement
The Welcome Offer timer had critical bugs:
1. **Modal showed "Offer Expired" incorrectly** - Even for newly created accounts within 48h window
2. **Timer reset on navigation** - Countdown restarted when user opened Settings → Billing
3. **Inconsistent state** - Banner showed 47:59:54 while Modal showed "expired"
4. **No single source of truth** - Each component calculated offer state independently

## Root Causes
1. **Local state initialization** - `remainingMs` initialized to `0`, causing flash of expired state
2. **Prop-based calculation** - `SettingsView` calculated `isPromoActive` and `timeLeftInSeconds` on mount, resetting on navigation
3. **Different data sources** - Banner used `welcome_offer_expires_at`, Modal tried to calculate from mount time
4. **No centralized logic** - Each component had its own timer implementation

## Solution: Centralized Hook

### Created `/hooks/useWelcomeOffer.ts`
Single source of truth for Welcome Offer state:

```typescript
export function useWelcomeOffer(
    accountCreatedAtIso: string | null | undefined,
    welcomeOfferUsed: boolean | null | undefined
): WelcomeOfferState {
    // Calculate expiration: accountCreatedAt + 48h
    // Update every second
    // Return: { isActive, expiresAtMs, remainingMs, remainingLabel }
}
```

**Key Features:**
- ✅ Always based on `account_created_at` (persisted timestamp)
- ✅ Never resets on navigation/remount
- ✅ Robust date parsing with NaN checks
- ✅ Consistent HH:MM:SS formatting
- ✅ Single calculation for `isActive` logic

## Changes Made

### 1. BillingHeader.tsx
**Before:**
- Received `isPromoActive` and `timeLeftInSeconds` as props
- Had local state and `useEffect` for countdown
- Timer reset on component remount

**After:**
```tsx
const offer = useWelcomeOffer(
    userMetrics?.account_created_at,
    userMetrics?.welcome_offer_used
);
// Use offer.isActive and offer.remainingLabel
```

### 2. DocumentLimitModal.tsx
**Before:**
- Received `expiresAt` prop
- Calculated timer locally with `useState` and `useEffect`
- Initial state was `0`, causing "expired" flash

**After:**
```tsx
const offer = useWelcomeOffer(accountCreatedAt, welcomeOfferUsed);
// Use offer.isActive and offer.remainingLabel
```

### 3. PricingCard.tsx
**Before:**
- Received `isPromoActive` as prop
- No timer display, just used for pricing logic

**After:**
```tsx
const offer = useWelcomeOffer(
    userMetrics?.account_created_at,
    userMetrics?.welcome_offer_used
);
const prices = offer.isActive ? promoPrices : basePrices;
```

### 4. SettingsView.tsx
**Before:**
```tsx
const [isPromoActive, setIsPromoActive] = useState(false);
const [timeLeftInSeconds, setTimeLeftInSeconds] = useState(0);

useEffect(() => {
    // Calculate from welcome_offer_expires_at
    // This reset on every navigation!
}, [stats]);
```

**After:**
```tsx
const offer = useWelcomeOffer(
    stats?.account_created_at,
    stats?.welcome_offer_used
);
// Pass to CheckoutModal: isPromoActive={offer.isActive}
```

### 5. ExtractionView.tsx
**Before:**
```tsx
<DocumentLimitModal
    expiresAt={userMetrics?.welcome_offer_expires_at}
/>
```

**After:**
```tsx
<DocumentLimitModal
    accountCreatedAt={userMetrics?.account_created_at}
    welcomeOfferUsed={userMetrics?.welcome_offer_used}
/>
```

## Data Flow

### Before (Broken)
```
Backend → welcome_offer_expires_at (calculated field)
    ↓
SettingsView calculates isPromoActive on mount
    ↓
Passes to BillingHeader, PricingCard (stale on navigation)
    
Modal receives expiresAt, calculates independently
    ↓
Different results! Banner: 47:59:54, Modal: "Expired"
```

### After (Fixed)
```
Backend → account_created_at (immutable)
         welcome_offer_used (boolean)
    ↓
useWelcomeOffer hook (single calculation)
    ↓
All components use same hook
    ↓
Consistent state everywhere!
```

## Testing Checklist

### ✅ New Account (< 48h)
- [x] Banner shows countdown ~48:00:00
- [x] Modal shows countdown (same time)
- [x] Both count down in sync
- [x] No "Offer Expired" message

### ✅ Navigation
- [x] Open Settings → Billing
- [x] Note timer value
- [x] Navigate away and back
- [x] Timer continues from correct value (doesn't reset)

### ✅ Old Account (> 48h)
- [x] Banner doesn't appear
- [x] Modal shows "Oferta expirada"
- [x] Normal pricing displayed

### ✅ Offer Already Used
- [x] Banner doesn't appear
- [x] Modal doesn't show offer
- [x] Even if within 48h window

## Benefits

1. **Reliability** - Timer never resets, always based on persisted data
2. **Consistency** - All components show identical state
3. **Maintainability** - Single hook to update if logic changes
4. **Performance** - One interval per hook instance (not per component)
5. **Correctness** - No more "expired" flash or timezone bugs

## Migration Notes

### Backend Requirements
Ensure `account_created_at` is:
- ISO 8601 format (e.g., "2024-01-26T00:00:00Z")
- UTC timezone
- Immutable (never changes after account creation)

### Optional: Remove `welcome_offer_expires_at`
Since we now calculate expiration in the hook, the backend field `welcome_offer_expires_at` is no longer needed. However, keeping it won't cause issues.

## Future Improvements

1. **Server-side validation** - Backend should also check 48h window
2. **Analytics** - Track when users view offer vs when they convert
3. **A/B testing** - Easy to modify hook for different offer durations
4. **Timezone display** - Could format timer in user's local timezone
