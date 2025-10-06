import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { subscriptionService } from '../../../../lib/subscription-service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // Initialize Stripe only when needed
    if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
      return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 });
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-08-27.basil'
    });

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    const body = await request.text();
    const headersList = await headers();
    const signature = headersList.get('stripe-signature');

    if (!signature) {
      console.error('No Stripe signature found');
      return NextResponse.json({ error: 'No signature' }, { status: 400 });
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    console.log('Stripe webhook event received:', event.type);

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session, stripe);
        break;
      }

      case 'customer.subscription.created': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionCreated(subscription);
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdated(subscription);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription);
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentSucceeded(invoice);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentFailed(invoice);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook error' }, { status: 500 });
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session, stripe: Stripe) {
  try {
    console.log('Checkout completed for session:', session.id);

    if (!session.customer || !session.client_reference_id) {
      console.error('Missing customer or client_reference_id in session');
      return;
    }

    const customerId = session.customer as string;
    const userId = session.client_reference_id; // This should be the Clerk user ID
    const email = session.customer_details?.email;

    if (!email) {
      console.error('No email found in checkout session');
      return;
    }

    // Prefer subscription id from session; supports trialing immediately after checkout
    let subscription: Stripe.Subscription | null = null;
    const sessionSubId = typeof session.subscription === 'string' ? session.subscription : null;
    if (sessionSubId) {
      try {
        subscription = await stripe.subscriptions.retrieve(sessionSubId);
      } catch (e) {
        console.error('Failed to retrieve subscription from session.subscription:', e);
      }
    }

    // Fallback: fetch most recent subscription for customer (any status)
    if (!subscription) {
      const subs = await stripe.subscriptions.list({ customer: customerId, status: 'all', limit: 1 });
      subscription = subs.data[0] || null;
    }

    if (!subscription) {
      console.error('No subscription found for customer after checkout');
      return;
    }

    const priceId = subscription.items.data[0]?.price.id;
    
    // Determine subscription type based on price ID
    const subscriptionType = getSubscriptionType(priceId);

    // Upsert subscription in our database using Stripe period boundaries
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
        : 'active'; // treat trialing as active for access

    await subscriptionService.upsertUserSubscription({
      user_id: userId,
      email,
      subscription_status: status,
      subscription_type: subscriptionType,
      stripe_customer_id: customerId,
      stripe_subscription_id: subscription.id,
      stripe_price_id: priceId,
      subscription_start_date: startIso,
      subscription_end_date: endIso,
    });

    console.log(`Subscription upserted for user ${userId} with status ${status}`);

  } catch (error) {
    console.error('Error handling checkout completed:', error);
  }
}

async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  console.log('Subscription created:', subscription.id);
  // This is usually handled by checkout.session.completed
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  try {
    console.log('Subscription updated:', subscription.id);

    const customerId = subscription.customer as string;
    const userSubscription = await subscriptionService.getSubscriptionByStripeCustomerId(customerId);

    if (!userSubscription) {
      console.error('User subscription not found for customer:', customerId);
      return;
    }

    // Update subscription status based on Stripe status
    let status: 'active' | 'cancelled' | 'expired' = 'active';
    
    if (subscription.status === 'canceled' || subscription.status === 'incomplete_expired') {
      status = 'cancelled';
    } else if (subscription.status === 'past_due' || subscription.status === 'unpaid') {
      status = 'expired';
    }

    await subscriptionService.upsertUserSubscription({
      user_id: userSubscription.user_id,
      subscription_status: status,
      subscription_end_date: (subscription as any).current_period_end ? new Date((subscription as any).current_period_end * 1000).toISOString() : undefined
    });

    console.log(`Subscription updated for user ${userSubscription.user_id}: ${status}`);

  } catch (error) {
    console.error('Error handling subscription updated:', error);
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  try {
    console.log('Subscription deleted:', subscription.id);

    const customerId = subscription.customer as string;
    const userSubscription = await subscriptionService.getSubscriptionByStripeCustomerId(customerId);

    if (!userSubscription) {
      console.error('User subscription not found for customer:', customerId);
      return;
    }

    // Cancel the subscription in our database
    await subscriptionService.cancelSubscription(userSubscription.user_id);
    
    console.log(`Subscription cancelled for user ${userSubscription.user_id}`);

  } catch (error) {
    console.error('Error handling subscription deleted:', error);
  }
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  try {
    console.log('Payment succeeded for invoice:', invoice.id);

    if (!(invoice as any).subscription || typeof (invoice as any).subscription !== 'string') {
      return; // Not a subscription payment
    }

    const customerId = invoice.customer as string;
    const userSubscription = await subscriptionService.getSubscriptionByStripeCustomerId(customerId);

    if (!userSubscription) {
      console.error('User subscription not found for customer:', customerId);
      return;
    }

    // Ensure subscription is active after successful payment
    await subscriptionService.upsertUserSubscription({
      user_id: userSubscription.user_id,
      subscription_status: 'active'
    });

    console.log(`Payment processed for user ${userSubscription.user_id}`);

  } catch (error) {
    console.error('Error handling payment succeeded:', error);
  }
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  try {
    console.log('Payment failed for invoice:', invoice.id);

    if (!(invoice as any).subscription || typeof (invoice as any).subscription !== 'string') {
      return; // Not a subscription payment
    }

    const customerId = invoice.customer as string;
    const userSubscription = await subscriptionService.getSubscriptionByStripeCustomerId(customerId);

    if (!userSubscription) {
      console.error('User subscription not found for customer:', customerId);
      return;
    }

    // Mark subscription as expired after failed payment
    await subscriptionService.upsertUserSubscription({
      user_id: userSubscription.user_id,
      subscription_status: 'expired'
    });

    console.log(`Payment failed for user ${userSubscription.user_id}, subscription marked as expired`);

  } catch (error) {
    console.error('Error handling payment failed:', error);
  }
}

function getSubscriptionType(priceId?: string): 'monthly' | 'annual' {
  // Map your Stripe price IDs to subscription types
  const monthlyPriceIds = [
    'price_1S4WlwAUgweEW9eMOjeZmqdd', // Monthly price ID
    // Add other monthly price IDs if you have multiple
  ];
  
  const annualPriceIds = [
    'price_1S4WlwAUgweEW9eMiepCbYMv', // Annual price ID
    // Add other annual price IDs if you have multiple
  ];

  if (priceId && annualPriceIds.includes(priceId)) {
    return 'annual';
  }
  
  return 'monthly'; // Default to monthly
}
