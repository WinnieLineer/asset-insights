
'use server';

import Stripe from 'stripe';

/**
 * 初始化 Stripe 客戶端
 * 加入安全檢查，避免在沒有 Key 的情況下導致應用啟動錯誤
 */
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripe = stripeSecretKey ? new Stripe(stripeSecretKey, {
  apiVersion: '2025-01-27-preview',
}) : null;

/**
 * 建立 Stripe Checkout Session
 * @param baseUrl 用於交易成功或取消後的跳轉路徑
 */
export async function createCheckoutSession(baseUrl: string) {
  if (!stripe) {
    throw new Error('Stripe is not configured. Please add STRIPE_SECRET_KEY to your .env file.');
  }

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'twd',
            product_data: {
              name: 'Asset Insights Pro - Lifetime License',
              description: 'Unlock unlimited asset tracking and AI financial advisor features forever.',
            },
            unit_amount: 30, // NT$ 30 (Stripe 在 TWD 是直接以元為單位)
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${baseUrl}?session_id={CHECKOUT_SESSION_ID}&payment_success=true`,
      cancel_url: `${baseUrl}?payment_cancel=true`,
    });

    return { sessionId: session.id, url: session.url };
  } catch (error: any) {
    console.error('Stripe Session Error:', error);
    throw new Error(error.message || 'Failed to create payment session');
  }
}
