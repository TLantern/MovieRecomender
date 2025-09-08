import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { subscriptionService } from '../../../../lib/subscription-service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const user = await currentUser();
    const userId = user?.id;
    
    if (!userId) {
      return NextResponse.json({ 
        isVip: false, 
        hasActiveSubscription: false,
        subscription: null,
        error: 'Not authenticated' 
      }, { status: 401 });
    }

    // Get user subscription details
    const subscription = await subscriptionService.getUserSubscription(userId);
    const hasActiveSubscription = await subscriptionService.hasActiveSubscription(userId);
    
    // Get email from request query params as fallback
    const url = new URL(request.url);
    const email = url.searchParams.get('email');
    
    const isVip = await subscriptionService.isVipUser(userId, email || undefined);

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
    const user = await currentUser();
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
