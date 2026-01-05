import { supabase } from './supabase';

export const PREMIUM_PLAN_ID = 'e7d91173-1eeb-480e-9cdc-7f8f965ae1b6';

export async function checkPremiumStatus(userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('plans_assinar')
      .select('id')
      .eq('user_id', userId)
      .eq('plan_id', PREMIUM_PLAN_ID)
      .eq('status', 'active')
      .limit(1);

    if (error) {
      console.error('Error checking premium status:', error);
      return false;
    }

    return data && data.length > 0;
  } catch (error) {
    console.error('Unexpected error checking premium status:', error);
    return false;
  }
}

export async function getPremiumCheckoutUrl(): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('planos')
      .select('checkout_url')
      .eq('id', PREMIUM_PLAN_ID)
      .single();

    if (error) {
      console.error('Error fetching checkout URL:', error);
      return null;
    }

    return data?.checkout_url || null;
  } catch (error) {
    console.error('Unexpected error fetching checkout URL:', error);
    return null;
  }
}
