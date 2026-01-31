/**
 * PAYSTACK WEBHOOK HANDLER
 * 
 * Supabase Edge Function to handle Paystack webhook events.
 * Verifies webhook signature and processes payment events.
 * 
 * Deploy: supabase functions deploy paystack-webhook
 * 
 * Set secrets:
 *   supabase secrets set PAYSTACK_SECRET_KEY=sk_xxxxx
 */

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createHmac } from "https://deno.land/std@0.177.0/node/crypto.ts";

// ==================== TYPES ====================

interface PaystackWebhookEvent {
  event: string;
  data: {
    id: number;
    domain: string;
    status: string;
    reference: string;
    amount: number;
    gateway_response: string;
    paid_at: string;
    created_at: string;
    channel: string;
    currency: string;
    customer: {
      id: number;
      email: string;
      customer_code: string;
      first_name: string | null;
      last_name: string | null;
      phone: string | null;
    };
    authorization?: {
      authorization_code: string;
      bin: string;
      last4: string;
      exp_month: string;
      exp_year: string;
      card_type: string;
      bank: string;
      country_code: string;
      brand: string;
      reusable: boolean;
      signature: string;
    };
    metadata?: {
      user_id: string;
      plan_id: string;
      is_trial: boolean;
    };
  };
}

interface SubscriptionPlan {
  name: string;
  durationMonths: number;
  priceNaira: number;
}

// ==================== CONSTANTS ====================

const SUBSCRIPTION_PLANS: Record<string, SubscriptionPlan> = {
  monthly: { name: "Monthly", durationMonths: 1, priceNaira: 10000 },
  quarterly: { name: "3-Month", durationMonths: 3, priceNaira: 28000 },
  hero: { name: "Hero (6-Month)", durationMonths: 6, priceNaira: 50000 },
  ultimate: { name: "Ultimate (12-Month)", durationMonths: 12, priceNaira: 96000 },
};

const TRIAL_DURATION_DAYS = 3;

// ==================== HELPERS ====================

/**
 * Verify Paystack webhook signature
 */
function verifyWebhookSignature(
  payload: string,
  signature: string,
  secretKey: string
): boolean {
  const hash = createHmac("sha512", secretKey)
    .update(payload)
    .digest("hex");
  return hash === signature;
}

/**
 * Add months to a date
 */
function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

/**
 * Add days to a date
 */
function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

// ==================== MAIN HANDLER ====================

serve(async (req: Request) => {
  // Only allow POST
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    // Get secrets
    const PAYSTACK_SECRET_KEY = Deno.env.get("PAYSTACK_SECRET_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!PAYSTACK_SECRET_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      console.error("Missing environment variables");
      return new Response("Server configuration error", { status: 500 });
    }

    // Get raw body for signature verification
    const payload = await req.text();

    // Verify signature
    const signature = req.headers.get("x-paystack-signature");
    if (!signature) {
      console.error("Missing Paystack signature");
      return new Response("Missing signature", { status: 400 });
    }

    if (!verifyWebhookSignature(payload, signature, PAYSTACK_SECRET_KEY)) {
      console.error("Invalid Paystack signature");
      return new Response("Invalid signature", { status: 401 });
    }

    // Parse event
    const event: PaystackWebhookEvent = JSON.parse(payload);
    console.log(`Received Paystack event: ${event.event}`);

    // Initialize Supabase client with service role
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Handle different events
    switch (event.event) {
      case "charge.success":
        await handleChargeSuccess(supabase, event);
        break;

      case "charge.failed":
        await handleChargeFailed(supabase, event);
        break;

      default:
        console.log(`Unhandled event type: ${event.event}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response(
      JSON.stringify({ error: "Webhook processing failed" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});

// ==================== EVENT HANDLERS ====================

/**
 * Handle successful charge
 */
async function handleChargeSuccess(
  supabase: ReturnType<typeof createClient>,
  event: PaystackWebhookEvent
) {
  const { data } = event;
  const { reference, amount, paid_at, channel, metadata, authorization, customer } = data;

  console.log(`Processing successful charge: ${reference}`);

  // Update transaction record
  const transactionUpdate: Record<string, any> = {
    status: "success",
    paystack_id: data.id,
    gateway_response: data.gateway_response,
    channel,
    paid_at,
    updated_at: new Date().toISOString(),
  };

  if (authorization) {
    transactionUpdate.card_last4 = authorization.last4;
    transactionUpdate.card_brand = authorization.brand;
  }

  const { error: txError } = await supabase
    .from("payment_transactions")
    .update(transactionUpdate)
    .eq("reference", reference);

  if (txError) {
    console.error("Failed to update transaction:", txError);
  }

  // Get metadata
  if (!metadata?.user_id || !metadata?.plan_id) {
    console.error("Missing metadata in webhook");
    return;
  }

  const { user_id, plan_id, is_trial } = metadata;
  const plan = SUBSCRIPTION_PLANS[plan_id];

  if (!plan) {
    console.error(`Unknown plan: ${plan_id}`);
    return;
  }

  // Calculate subscription dates
  const now = new Date();
  let endDate: Date;
  
  if (is_trial) {
    endDate = addDays(now, TRIAL_DURATION_DAYS);
  } else {
    endDate = addMonths(now, plan.durationMonths);
  }

  // Upsert user subscription
  const subscriptionData: Record<string, any> = {
    user_id,
    plan_id,
    status: is_trial ? "trial" : "active",
    start_date: now.toISOString(),
    end_date: endDate.toISOString(),
    amount_paid: amount / 100, // Convert from kobo
    payment_reference: reference,
    auto_renew: false,
    updated_at: now.toISOString(),
  };

  if (is_trial) {
    subscriptionData.trial_start_date = now.toISOString();
    subscriptionData.trial_end_date = endDate.toISOString();
  }

  const { error: subError } = await supabase
    .from("user_subscriptions")
    .upsert(subscriptionData, { onConflict: "user_id" });

  if (subError) {
    console.error("Failed to update subscription:", subError);
    return;
  }

  // Mark trial as used if applicable
  if (is_trial) {
    await supabase
      .from("users")
      .update({ has_used_trial: true })
      .eq("id", user_id);
  }

  // Log audit event
  await supabase.from("audit_logs").insert({
    user_id,
    action: is_trial ? "trial_started" : "subscription_activated",
    entity_type: "subscription",
    entity_id: user_id,
    details: {
      plan_id,
      amount: amount / 100,
      reference,
      channel,
    },
    created_at: now.toISOString(),
  });

  // Send confirmation email via email service (if configured)
  try {
    // Get user email
    const { data: userData } = await supabase
      .from("users")
      .select("email, full_name")
      .eq("id", user_id)
      .single();

    if (userData?.email) {
      // You can trigger email here via another edge function or email service
      console.log(`Should send confirmation email to ${userData.email}`);
    }
  } catch (emailError) {
    console.error("Failed to send confirmation email:", emailError);
  }

  console.log(`Successfully processed payment for user ${user_id}, plan ${plan_id}`);
}

/**
 * Handle failed charge
 */
async function handleChargeFailed(
  supabase: ReturnType<typeof createClient>,
  event: PaystackWebhookEvent
) {
  const { data } = event;
  const { reference, metadata } = data;

  console.log(`Processing failed charge: ${reference}`);

  // Update transaction record
  const { error } = await supabase
    .from("payment_transactions")
    .update({
      status: "failed",
      gateway_response: data.gateway_response,
      updated_at: new Date().toISOString(),
    })
    .eq("reference", reference);

  if (error) {
    console.error("Failed to update transaction:", error);
  }

  // Log audit event
  if (metadata?.user_id) {
    await supabase.from("audit_logs").insert({
      user_id: metadata.user_id,
      action: "payment_failed",
      entity_type: "payment",
      entity_id: reference,
      details: {
        plan_id: metadata.plan_id,
        gateway_response: data.gateway_response,
      },
      created_at: new Date().toISOString(),
    });
  }

  console.log(`Recorded failed payment: ${reference}`);
}
