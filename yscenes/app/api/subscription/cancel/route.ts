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

    const existing = await subscriptionService.getUserSubscription(userId);
    if (!existing?.stripe_subscription_id) {
      return NextResponse.json({ error: 'No active Stripe subscription found' }, { status: 404 });
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2025-08-27.basil' });
    await stripe.subscriptions.cancel(existing.stripe_subscription_id);

    await subscriptionService.cancelSubscription(userId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Cancel subscription error:', error);
    return NextResponse.json({ error: 'Failed to cancel subscription' }, { status: 500 });
  }
}


