import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import Stripe from 'stripe';
import { subscriptionService } from '../../../lib/subscription-service';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-08-27.basil'
});

export async function POST(request: NextRequest) {
  try {
    const user = await currentUser();
    const userId = user?.id;
    
    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();
    const { sessionId } = body;

    if (!sessionId) {
      return NextResponse.json({ 
        error: 'Session ID is required' 
      }, { status: 400 });
    }

    // Retrieve the checkout session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (!session) {
      return NextResponse.json({ 
        error: 'Session not found' 
      }, { status: 404 });
    }

    // Verify the session belongs to the current user
    if (session.client_reference_id !== userId) {
      return NextResponse.json({ 
        error: 'Session does not belong to current user' 
      }, { status: 403 });
    }

    // Check if payment was successful
    if (session.payment_status !== 'paid') {
      return NextResponse.json({ 
        error: 'Payment not completed' 
      }, { status: 400 });
    }

    // Get subscription details
    if (!session.subscription) {
      return NextResponse.json({ 
        error: 'No subscription found for this session' 
      }, { status: 400 });
    }

    const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
    const priceId = subscription.items.data[0]?.price.id;
    const customerId = session.customer as string;
    const email = session.customer_details?.email;

    if (!email) {
      return NextResponse.json({ 
        error: 'No email found in session' 
      }, { status: 400 });
    }

    // Determine subscription type based on price ID
    const subscriptionType = getSubscriptionType(priceId);

    // Activate the subscription in our database
    const success = await subscriptionService.activateSubscription(
      userId,
      email,
      customerId,
      subscription.id,
      priceId || '',
      subscriptionType
    );

    if (!success) {
      return NextResponse.json({ 
        error: 'Failed to activate subscription in database' 
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      subscription: {
        status: subscription.status,
        type: subscriptionType,
        current_period_end: (subscription as any).current_period_end || null
      }
    });

  } catch (error) {
    console.error('Error verifying checkout session:', error);
    return NextResponse.json(
      { error: 'Failed to verify checkout session' },
      { status: 500 }
    );
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
