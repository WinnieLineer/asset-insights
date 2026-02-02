
'use server';

import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2025-01-27-preview',
});

/**
 * 建立 Stripe Checkout Session
 * @param baseUrl 用於交易成功或取消後的跳轉路徑
 */
export async function createCheckoutSession(baseUrl: string) {
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
            unit_amount: 3000, // NT$ 30 (Stripe 使用最小單位，NTD 是整數但習慣上建議 *100 以符合規範，部分幣別需注意)
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
    throw new Error(error.message);
  }
}
