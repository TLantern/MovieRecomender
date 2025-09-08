import { createServerSupabaseClient } from './supabase';

export interface UserSubscription {
  id: string;
  user_id: string;
  email: string;
  subscription_status: 'free' | 'active' | 'cancelled' | 'expired';
  subscription_type?: 'monthly' | 'annual' | 'lifetime';
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  stripe_price_id?: string;
  subscription_start_date?: string;
  subscription_end_date?: string;
  created_at: string;
  updated_at: string;
}

export class SubscriptionService {
  private supabase;

  constructor() {
    this.supabase = createServerSupabaseClient();
  }

  // Check if user has active subscription
  async hasActiveSubscription(userId: string): Promise<boolean> {
    try {
      const { data, error } = await this.supabase
        .from('user_subscriptions')
        .select('subscription_status, subscription_end_date')
        .eq('user_id', userId)
        .single();

      if (error || !data) {
        return false;
      }

      // Check if subscription is active
      if (data.subscription_status === 'active') {
        // If there's an end date, check if it's in the future
        if (data.subscription_end_date) {
          return new Date(data.subscription_end_date) > new Date();
        }
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error checking subscription status:', error);
      return false;
    }
  }

  // Get user subscription details
  async getUserSubscription(userId: string): Promise<UserSubscription | null> {
    try {
      const { data, error } = await this.supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error || !data) {
        return null;
      }

      return data as UserSubscription;
    } catch (error) {
      console.error('Error getting user subscription:', error);
      return null;
    }
  }

  // Create or update user subscription
  async upsertUserSubscription(subscriptionData: Partial<UserSubscription>): Promise<UserSubscription | null> {
    try {
      const { data, error } = await this.supabase
        .from('user_subscriptions')
        .upsert(subscriptionData, {
          onConflict: 'user_id'
        })
        .select()
        .single();

      if (error) {
        console.error('Error upserting subscription:', error);
        return null;
      }

      return data as UserSubscription;
    } catch (error) {
      console.error('Error upserting subscription:', error);
      return null;
    }
  }

  // Activate subscription after successful payment
  async activateSubscription(
    userId: string,
    email: string,
    stripeCustomerId: string,
    stripeSubscriptionId: string,
    stripePriceId: string,
    subscriptionType: 'monthly' | 'annual'
  ): Promise<boolean> {
    try {
      // Calculate end date based on subscription type
      const startDate = new Date();
      const endDate = new Date();
      
      if (subscriptionType === 'monthly') {
        endDate.setMonth(endDate.getMonth() + 1);
      } else {
        endDate.setFullYear(endDate.getFullYear() + 1);
      }

      const subscriptionData = {
        user_id: userId,
        email,
        subscription_status: 'active' as const,
        subscription_type: subscriptionType,
        stripe_customer_id: stripeCustomerId,
        stripe_subscription_id: stripeSubscriptionId,
        stripe_price_id: stripePriceId,
        subscription_start_date: startDate.toISOString(),
        subscription_end_date: endDate.toISOString()
      };

      const result = await this.upsertUserSubscription(subscriptionData);
      return !!result;
    } catch (error) {
      console.error('Error activating subscription:', error);
      return false;
    }
  }

  // Cancel subscription
  async cancelSubscription(userId: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('user_subscriptions')
        .update({ 
          subscription_status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      return !error;
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      return false;
    }
  }

  // Get subscription by Stripe customer ID (for webhooks)
  async getSubscriptionByStripeCustomerId(customerId: string): Promise<UserSubscription | null> {
    try {
      const { data, error } = await this.supabase
        .from('user_subscriptions')
        .select('*')
        .eq('stripe_customer_id', customerId)
        .single();

      if (error || !data) {
        return null;
      }

      return data as UserSubscription;
    } catch (error) {
      console.error('Error getting subscription by Stripe customer ID:', error);
      return null;
    }
  }

  // Check if user is VIP (for backward compatibility)
  async isVipUser(userId: string, email?: string): Promise<boolean> {
    // Check database first
    const hasActiveSubscription = await this.hasActiveSubscription(userId);
    if (hasActiveSubscription) {
      return true;
    }

    // Fallback to hardcoded VIP email for existing user
    if (email === 'pgtherealmvp@gmail.com') {
      return true;
    }

    return false;
  }

  // Update subscription end date (for renewals)
  async renewSubscription(userId: string, subscriptionType: 'monthly' | 'annual'): Promise<boolean> {
    try {
      const currentSubscription = await this.getUserSubscription(userId);
      if (!currentSubscription) {
        return false;
      }

      const newEndDate = new Date();
      if (subscriptionType === 'monthly') {
        newEndDate.setMonth(newEndDate.getMonth() + 1);
      } else {
        newEndDate.setFullYear(newEndDate.getFullYear() + 1);
      }

      const { error } = await this.supabase
        .from('user_subscriptions')
        .update({
          subscription_status: 'active',
          subscription_end_date: newEndDate.toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      return !error;
    } catch (error) {
      console.error('Error renewing subscription:', error);
      return false;
    }
  }
}

// Export singleton instance
export const subscriptionService = new SubscriptionService();
