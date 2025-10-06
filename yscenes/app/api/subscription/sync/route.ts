import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import Stripe from 'stripe';
import { subscriptionService } from '../../../../lib/subscription-service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const user = await currentUser().catch(() => null as any);
    const userId = user?.id;
    if (!userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 });
    }

    const { email } = await request.json();
    if (!email) return NextResponse.json({ error: 'Email is required' }, { status: 400 });

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2025-08-27.basil' });

    // Find customer by email
    const customers = await stripe.customers.list({ email, limit: 1 });
    const customer = customers.data[0];
    if (!customer) return NextResponse.json({ error: 'Stripe customer not found' }, { status: 404 });

    // Find latest subscription (any status)
    const subs = await stripe.subscriptions.list({ customer: customer.id, status: 'all', limit: 1 });
    const subscription = subs.data[0];
    if (!subscription) return NextResponse.json({ error: 'No subscription found' }, { status: 404 });

    const priceId = subscription.items.data[0]?.price.id;
    const subscriptionType = getSubscriptionType(priceId);

    const startIso = subscription.current_period_start
      ? new Date(subscription.current_period_start * 1000).toISOString()
      : new Date().toISOString();
    const endIso = subscription.current_period_end
      ? new Date(subscription.current_period_end * 1000).toISOString()
      : undefined;

    const status: 'active' | 'cancelled' | 'expired' = subscription.status === 'canceled'
      ? 'cancelled'
      : (subscription.status === 'unpaid' || subscription.status === 'past_due')
        ? 'expired'
        : 'active';

    const upserted = await subscriptionService.upsertUserSubscription({
      user_id: userId,
      email,
      subscription_status: status,
      subscription_type: subscriptionType,
      stripe_customer_id: customer.id,
      stripe_subscription_id: subscription.id,
      stripe_price_id: priceId,
      subscription_start_date: startIso,
      subscription_end_date: endIso,
    });

    return NextResponse.json({ success: true, subscription: upserted });
  } catch (error) {
    console.error('Subscription sync error:', error);
    return NextResponse.json({ error: 'Failed to sync subscription' }, { status: 500 });
  }
}

function getSubscriptionType(priceId?: string): 'monthly' | 'annual' {
  const monthlyPriceIds = ['price_1S4WlwAUgweEW9eMOjeZmqdd'];
  const annualPriceIds = ['price_1S4WlwAUgweEW9eMiepCbYMv'];
  if (priceId && annualPriceIds.includes(priceId)) return 'annual';
  return 'monthly';
}


