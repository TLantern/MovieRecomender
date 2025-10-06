import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { subscriptionService } from '../../../../lib/subscription-service';
import Stripe from 'stripe';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const user = await currentUser().catch(() => null as any);
    const userId = user?.id;
    
    if (!userId) {
      return NextResponse.json({ 
        isVip: false, 
        hasActiveSubscription: false,
        subscription: null,
        error: 'Not authenticated' 
      }, { status: 401 });
    }

    // Get user subscription details (DB)
    let subscription = await subscriptionService.getUserSubscription(userId);
    let hasActiveSubscription = await subscriptionService.hasActiveSubscription(userId);
    
    // Get email from request query params as fallback
    const url = new URL(request.url);
    const email = url.searchParams.get('email');
    
    let isVip = await subscriptionService.isVipUser(userId, email || undefined);

    // Fallback: If DB not configured or no active sub found, check Stripe by email
    if (!hasActiveSubscription && process.env.STRIPE_SECRET_KEY && (email || subscription?.stripe_customer_id)) {
      try {
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2025-08-27.basil' });
        let customerId: string | undefined = subscription?.stripe_customer_id;
        if (!customerId && email) {
          const customers = await stripe.customers.list({ email: email || undefined, limit: 1 });
          customerId = customers.data[0]?.id;
        }
        if (customerId) {
          const subs = await stripe.subscriptions.list({ customer: customerId, status: 'all', limit: 1 });
          const stripeSub = subs.data[0];
          if (stripeSub && ['active', 'trialing'].includes(stripeSub.status)) {
            hasActiveSubscription = true;
            isVip = true;
            const subAny: any = subscription ?? {};
            subAny.stripe_customer_id = customerId;
            subAny.stripe_subscription_id = stripeSub.id;
            subAny.stripe_price_id = stripeSub.items.data[0]?.price.id;
            subscription = subAny;
          }
        }
      } catch (e) {
        console.warn('Stripe fallback failed in subscription check');
      }
    }

    return NextResponse.json({
      isVip,
      hasActiveSubscription,
      subscription,
      userId
    });

  } catch (error) {
    console.error('Subscription check error:', error);
    return NextResponse.json({ 
      isVip: false, 
      hasActiveSubscription: false,
      subscription: null,
      error: 'Failed to check subscription' 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await currentUser().catch(() => null as any);
    const userId = user?.id;
    
    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Create free subscription record if doesn't exist
    const existingSubscription = await subscriptionService.getUserSubscription(userId);
    
    if (!existingSubscription) {
      const newSubscription = await subscriptionService.upsertUserSubscription({
        user_id: userId,
        email,
        subscription_status: 'free'
      });

      return NextResponse.json({
        success: true,
        subscription: newSubscription
      });
    }

    return NextResponse.json({
      success: true,
      subscription: existingSubscription
    });

  } catch (error) {
    console.error('Subscription creation error:', error);
    return NextResponse.json({ 
      error: 'Failed to create subscription record' 
    }, { status: 500 });
  }
}
