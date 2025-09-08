# Payment System Setup Guide

## Overview
This guide will help you set up the complete paid user subscription system using Stripe and Supabase.

## 1. Database Setup (Supabase)

### Step 1: Run the SQL Schema
Go to your Supabase dashboard → SQL Editor and run the contents of `lib/database-schema.sql`:

```sql
-- This will create the user_subscriptions table and all necessary indexes
-- The file is located at: yscenes/lib/database-schema.sql
```

### Step 2: Verify Table Creation
After running the SQL, you should see a new table called `user_subscriptions` in your Tables view.

## 2. Stripe Setup

### Step 1: Get Your Stripe Keys
1. Go to [Stripe Dashboard](https://dashboard.stripe.com/)
2. Get your **Secret Key** (starts with `sk_`)
3. Get your **Publishable Key** (starts with `pk_`)
4. Create webhook endpoint secret (see step 3)

### Step 2: Create Products and Prices
1. In Stripe Dashboard, go to Products
2. Create a product called "Movie Recommender Pro"
3. Create two prices:
   - Monthly: e.g., $9.99/month
   - Annual: e.g., $99.99/year (save the price IDs)

### Step 3: Set Up Webhook
1. In Stripe Dashboard, go to Webhooks
2. Create a new webhook endpoint
3. URL: `https://yourdomain.com/api/webhooks/stripe`
4. Select these events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Save the webhook secret (starts with `whsec_`)

## 3. Environment Variables

Add these to your `.env` file:

```env
# Stripe Keys
STRIPE_SECRET_KEY=sk_test_your_secret_key_here
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Supabase (you should already have these)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Clerk (you should already have these)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
```

## 4. Update Price IDs

### Step 1: Update Paywall Modal
In `components/paywall-modal.tsx`, replace the placeholder price IDs:

```typescript
const priceId = isAnnual 
  ? "price_your_annual_price_id" // Replace with your annual price ID
  : "price_your_monthly_price_id"; // Replace with your monthly price ID
```

### Step 2: Update Webhook Handler
In `app/api/webhooks/stripe/route.ts`, update the `getSubscriptionType` function:

```typescript
function getSubscriptionType(priceId?: string): 'monthly' | 'annual' {
  const monthlyPriceIds = [
    'price_your_monthly_price_id', // Replace with your monthly price ID
  ];
  
  const annualPriceIds = [
    'price_your_annual_price_id', // Replace with your annual price ID
  ];

  if (priceId && annualPriceIds.includes(priceId)) {
    return 'annual';
  }
  
  return 'monthly';
}
```

### Step 3: Update Verification Endpoint
In `app/api/verify-checkout-session/route.ts`, update the same `getSubscriptionType` function.

## 5. Testing

### Step 1: Test Environment
Use Stripe test mode with test card numbers:
- Success: `4242424242424242`
- Failure: `4000000000000002`

### Step 2: Test Flow
1. Sign up/login to your app
2. Try to search (should hit limit after 1 search)
3. Click upgrade, go through Stripe checkout
4. Verify webhook receives events
5. Check Supabase to see subscription record
6. Verify unlimited searches work

## 6. Features Included

### For VIP/Paid Users:
- ✅ Unlimited movie recommendations
- ✅ All existing features unrestricted
- ✅ Database-tracked subscription status
- ✅ Automatic renewal handling
- ✅ Webhook-based activation

### For Free Users:
- ✅ 1 free search per session
- ✅ Paywall after limit reached
- ✅ Upgrade prompts

## 7. Additional Features to Implement (Optional)

### Subscription Management Dashboard
- View current subscription
- Cancel subscription
- Update payment method
- Download invoices

### Enhanced VIP Features
- Priority customer support
- Early access to new features
- Advanced filtering options
- Export functionality

## 8. Troubleshooting

### Common Issues:
1. **Webhook not receiving events**: Check URL and selected events
2. **Price ID not found**: Verify you're using the correct price IDs from Stripe
3. **Subscription not activating**: Check Supabase logs and webhook logs
4. **User not recognized as VIP**: Verify database record and check API logs

### Debug Steps:
1. Check browser console for errors
2. Check Supabase logs
3. Check Stripe webhook logs
4. Check your server logs

## 9. Go Live Checklist

When ready for production:
- [ ] Switch to Stripe live mode
- [ ] Update webhook URL to production domain
- [ ] Update all price IDs to live price IDs
- [ ] Test with real payment method
- [ ] Set up monitoring for failed payments
- [ ] Configure email notifications for subscription events

## Support

If you encounter issues:
1. Check the logs in your Next.js console
2. Check Supabase logs
3. Check Stripe webhook logs
4. Verify all environment variables are set correctly
