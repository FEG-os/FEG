import { createHmac, timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { logActivity } from "@/lib/activity";

// Square webhook receiver. Verifies the HMAC-SHA256 signature per
// developer.squareup.com/docs/webhooks/step3validate, logs every event to
// webhook_events for idempotency/replay, then updates the matching
// payments row when an invoice/payment completes. Untested against live
// Square traffic — verify with the sandbox before relying on it, and set
// SQUARE_WEBHOOK_URL to the exact URL registered in the Square dashboard
// (signature verification is over that literal string, not the inbound
// request's own URL, which can differ behind a proxy).
export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-square-hmacsha256-signature");
  const signatureKey = process.env.SQUARE_WEBHOOK_SIGNATURE_KEY;

  if (!signatureKey || !signature) {
    return NextResponse.json({ error: "webhook not configured" }, { status: 501 });
  }

  const notificationUrl = process.env.SQUARE_WEBHOOK_URL ?? request.url;
  const expected = createHmac("sha256", signatureKey)
    .update(notificationUrl + rawBody)
    .digest("base64");

  const sigBuf = Buffer.from(signature);
  const expBuf = Buffer.from(expected);
  const valid = sigBuf.length === expBuf.length && timingSafeEqual(sigBuf, expBuf);
  if (!valid) {
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  }

  const event = JSON.parse(rawBody);
  const supabase = createServiceClient();

  await supabase.from("webhook_events").insert({
    provider: "square",
    event_type: event.type ?? "unknown",
    payload: event,
    processing_status: "received",
  });

  const object = event.data?.object;
  const invoice = object?.invoice;
  const payment = object?.payment;
  const isPaid = invoice?.status === "PAID" || payment?.status === "COMPLETED";

  if (isPaid) {
    const invoiceId: string | undefined = invoice?.id ?? payment?.invoice_id;
    const paymentId: string | undefined = payment?.id;
    const lookupColumn = invoiceId ? "square_invoice_id" : "square_payment_id";
    const lookupValue = invoiceId ?? paymentId;

    if (lookupValue) {
      const { data: existing } = await supabase
        .from("payments")
        .select("id, household_id, application_id, payment_type")
        .eq(lookupColumn, lookupValue)
        .maybeSingle();

      if (existing) {
        await supabase
          .from("payments")
          .update({
            status: "paid",
            paid_at: new Date().toISOString(),
            ...(paymentId ? { square_payment_id: paymentId } : {}),
          })
          .eq("id", existing.id);

        if (existing.payment_type === "application_fee" && existing.household_id) {
          await supabase
            .from("households")
            .update({ pipeline_stage: "payment_received" })
            .eq("id", existing.household_id)
            .eq("pipeline_stage", "application_submitted");
        }

        await logActivity(supabase, {
          householdId: existing.household_id,
          entityType: "payment",
          entityId: existing.id,
          eventType: "payment_confirmed",
          description: `Square confirmed payment${paymentId ? ` (${paymentId})` : ""}`,
        });
      }
    }
  }

  return NextResponse.json({ received: true });
}
