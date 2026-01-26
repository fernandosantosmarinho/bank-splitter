# 🧪 Stripe Checkout Fix - Testing Checklist

## ✅ Pre-Test Setup

- [x] Build completed successfully (no TypeScript errors)
- [x] Dev server running on port 3000
- [ ] Stripe CLI webhook listener running
- [ ] Browser console open for logs
- [ ] Stripe Dashboard open (Subscriptions & Payments tabs)

---

## 🎯 Test 1: Basic Checkout Flow

**Goal:** Verify only 1 subscription is created and modal exits loading state

### Steps:
1. Open browser to `http://localhost:3000`
2. Navigate to pricing page
3. Open browser DevTools → Console tab
4. Open DevTools → Network tab
5. Click **"Subscribe Starter Plan"**

### Expected Results:
- ✅ Console shows: `[CheckoutModal] create-subscription START`
- ✅ Only **ONE** POST to `/api/stripe/create-subscription` in Network tab
- ✅ Console shows one of:
  - `[CheckoutModal] Got clientSecret directly` → PaymentElement appears immediately
  - `[CheckoutModal] Needs polling, starting...` → Polling logs appear → `[CheckoutModal] Poll found clientSecret` → PaymentElement appears
- ✅ Modal exits loading state within 1-2 seconds
- ✅ PaymentElement is visible and interactive
- ✅ No infinite loading spinner

### Verify in Stripe Dashboard:
- Go to **Subscriptions** → Filter by "Incomplete"
- Should see **exactly 1** new incomplete subscription
- Go to **Payments** → Payment Intents
- Should see **exactly 1** new payment intent

### Verify in Database:
```sql
SELECT COUNT(*) FROM stripe_intents 
WHERE created_at > NOW() - INTERVAL '5 minutes';
```
- Should return **1**

---

## 🔄 Test 2: React StrictMode Resilience

**Goal:** Verify no duplicate calls despite StrictMode double-mounting

### Steps:
1. Verify `next.config.js` has `reactStrictMode: true`
2. Clear browser console
3. Click **"Subscribe Starter Plan"**
4. Watch console carefully

### Expected Results:
- ✅ Console may show double mount logs (normal in dev)
- ✅ Only **ONE** `[CheckoutModal] create-subscription START` log
- ✅ Only **ONE** API call in Network tab
- ✅ No duplicate subscriptions created

---

## 🔁 Test 3: Modal Close/Reopen

**Goal:** Verify cleanup works and modal can be reopened

### Steps:
1. Click **"Subscribe Starter Plan"**
2. Wait for PaymentElement to appear
3. Click **Cancel** or press ESC
4. Console should show: `[CheckoutModal] Cleanup: aborting requests`
5. Wait 2 seconds
6. Click **"Subscribe Starter Plan"** again

### Expected Results:
- ✅ Modal opens fresh
- ✅ New session token generated (check console)
- ✅ New API call succeeds
- ✅ PaymentElement appears again
- ✅ No errors in console

---

## 🛡️ Test 4: Idempotency

**Goal:** Verify same session doesn't create duplicate subscriptions

### Steps:
1. Click **"Subscribe Starter Plan"**
2. Note the session token in console: `sessionToken: "1234567890-abc123"`
3. While modal is loading, copy the Network request
4. In DevTools → Network → Right-click the request → Copy as cURL
5. Run the cURL command again in terminal

### Expected Results:
- ✅ Second request returns same `subscriptionId`
- ✅ Console shows: `[Create Sub] Found existing subscription with same idempotency key`
- ✅ No duplicate subscription in Stripe Dashboard

---

## ⚡ Test 5: Webhook Integration

**Goal:** Verify webhook properly saves payment_intent.created

### Prerequisites:
```bash
# Terminal 1: Start Stripe CLI
stripe listen --forward-to localhost:3000/api/stripe/webhook

# Copy the webhook secret (whsec_...)
# Add to .env.local:
# STRIPE_WEBHOOK_SECRET=whsec_...

# Terminal 2: Dev server should already be running
```

### Steps:
1. Click **"Subscribe Starter Plan"**
2. Wait for PaymentElement to appear
3. Watch Stripe CLI terminal

### Expected Results:
- ✅ Stripe CLI shows: `payment_intent.created` event received
- ✅ Server logs show: `[Webhook] payment_intent.created`
- ✅ Server logs show: `[Webhook] Successfully saved payment_intent to stripe_intents`
- ✅ No error logs about failed inserts

### Verify in Database:
```sql
SELECT * FROM stripe_intents 
ORDER BY created_at DESC 
LIMIT 1;
```
- Should show the new payment_intent with `client_secret` populated

---

## 🚨 Test 6: Error Handling

**Goal:** Verify graceful error handling

### Test 6a: Network Error
1. Open DevTools → Network tab
2. Enable "Offline" mode
3. Click **"Subscribe Starter Plan"**

**Expected:**
- ✅ Error toast appears
- ✅ Modal closes
- ✅ No infinite loading

### Test 6b: Invalid Plan
1. Open DevTools → Console
2. Run:
```js
// This will fail validation
fetch('/api/stripe/create-subscription', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ plan: 'invalid', billingPeriod: 'monthly' })
})
```

**Expected:**
- ✅ Returns error response
- ✅ No subscription created
- ✅ Proper error logged

---

## 📊 Success Criteria Summary

| Test | Status | Notes |
|------|--------|-------|
| Basic Checkout Flow | ⬜ | 1 subscription, 1 API call |
| StrictMode Resilience | ⬜ | No duplicate calls |
| Modal Close/Reopen | ⬜ | Clean state reset |
| Idempotency | ⬜ | Same token = same subscription |
| Webhook Integration | ⬜ | Events saved to DB |
| Error Handling | ⬜ | Graceful failures |

---

## 🐛 If Tests Fail

### Issue: Multiple API calls still happening
- Check console for `[CheckoutModal] Already started, skipping duplicate call`
- If not present, check if `startedRef.current` is being reset incorrectly
- Verify `sessionTokenRef` is generating unique tokens

### Issue: Modal stuck in loading
- Check Network tab for failed requests
- Check console for polling timeout logs
- Verify webhook is receiving `payment_intent.created` events
- Check database for `stripe_intents` entries

### Issue: Duplicate subscriptions
- Check if idempotency key is being sent in headers
- Verify backend is checking for existing subscriptions
- Check Stripe Dashboard for subscription metadata

### Issue: Webhook not working
- Verify `STRIPE_WEBHOOK_SECRET` in `.env.local`
- Check Stripe CLI is forwarding to correct URL
- Verify webhook signature validation is passing

---

## 📝 Test Results Log

**Date:** _____________  
**Tester:** _____________  
**Environment:** Development / Production  

**Test 1 - Basic Flow:** ✅ / ❌  
Notes: _______________________________________________

**Test 2 - StrictMode:** ✅ / ❌  
Notes: _______________________________________________

**Test 3 - Close/Reopen:** ✅ / ❌  
Notes: _______________________________________________

**Test 4 - Idempotency:** ✅ / ❌  
Notes: _______________________________________________

**Test 5 - Webhook:** ✅ / ❌  
Notes: _______________________________________________

**Test 6 - Error Handling:** ✅ / ❌  
Notes: _______________________________________________

**Overall Result:** ✅ PASS / ❌ FAIL  

---

## 🚀 Ready for Production?

Before deploying to production:

- [ ] All tests pass locally
- [ ] Webhook secret updated in production environment variables
- [ ] Stripe publishable key is production key (not test)
- [ ] Database has `stripe_intents` table with proper schema
- [ ] RLS policies allow webhook to insert into `stripe_intents`
- [ ] Monitoring/alerting set up for failed webhook events
- [ ] Tested with real payment method in Stripe test mode
- [ ] Verified subscription activation flow end-to-end

---

**Quick Start Testing:**
```bash
# Terminal 1: Stripe webhook listener
stripe listen --forward-to localhost:3000/api/stripe/webhook

# Terminal 2: Already running
npm run dev

# Browser: Open console and test!
open http://localhost:3000
```
