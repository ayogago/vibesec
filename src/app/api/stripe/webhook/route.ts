import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { headers } from 'next/headers';
import * as db from '@/lib/db';
import type { SubscriptionTier } from '@/lib/subscription';
import Stripe from 'stripe';

// Disable body parsing for webhook
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const body = await request.text();
  const headersList = await headers();
  const signature = headersList.get('stripe-signature');

  if (!signature) {
    return NextResponse.json(
      { error: 'Missing stripe-signature header' },
      { status: 400 }
    );
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET not configured');
    return NextResponse.json(
      { error: 'Webhook secret not configured' },
      { status: 500 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json(
      { error: 'Webhook signature verification failed' },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutComplete(session);
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdate(subscription);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionCanceled(subscription);
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaid(invoice);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoiceFailed(invoice);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

async function handleCheckoutComplete(session: Stripe.Checkout.Session) {
  const userEmail = session.metadata?.userEmail || session.customer_email;
  const plan = session.metadata?.plan as SubscriptionTier;

  if (!userEmail || !plan) {
    console.error('Missing userEmail or plan in checkout session metadata');
    return;
  }

  // Update user subscription in database
  if (db.isDatabaseConfigured()) {
    const result = await db.updateUserSubscription(userEmail, plan);
    if (result.error) {
      console.error('Failed to update user subscription:', result.error);
    } else {
      console.log(`Successfully activated ${plan} subscription for ${userEmail}`);
    }
  }
}

async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  const plan = subscription.metadata?.plan as SubscriptionTier;

  if (!plan) return;

  // Get customer email
  const customer = await stripe.customers.retrieve(subscription.customer as string);
  if (customer.deleted) return;

  const email = customer.email;
  if (!email) return;

  // Check subscription status
  if (subscription.status === 'active') {
    if (db.isDatabaseConfigured()) {
      await db.updateUserSubscription(email, plan);
    }
  }
}

async function handleSubscriptionCanceled(subscription: Stripe.Subscription) {
  // Get customer email
  const customer = await stripe.customers.retrieve(subscription.customer as string);
  if (customer.deleted) return;

  const email = customer.email;
  if (!email) return;

  // Downgrade to free tier
  if (db.isDatabaseConfigured()) {
    await db.updateUserSubscription(email, 'free');
    console.log(`Subscription canceled for ${email}, downgraded to free tier`);
  }
}

async function handleInvoicePaid(invoice: Stripe.Invoice) {
  // Log successful payment
  console.log(`Invoice paid: ${invoice.id} for customer ${invoice.customer_email}`);
}

async function handleInvoiceFailed(invoice: Stripe.Invoice) {
  // Log failed payment - could send email notification here
  console.error(`Invoice payment failed: ${invoice.id} for customer ${invoice.customer_email}`);
}
