// Server-only. Minimal REST wrapper around Square's Invoices API — no SDK
// dependency, since this is three endpoints. Requires SQUARE_ACCESS_TOKEN,
// SQUARE_LOCATION_ID, and SQUARE_ENVIRONMENT ("sandbox" | "production") in
// the environment. Untested against a live Square account — verify against
// the sandbox before relying on it; see developer.squareup.com/docs/invoices-api.

const SQUARE_VERSION = "2025-01-23";

function baseUrl() {
  return process.env.SQUARE_ENVIRONMENT === "production"
    ? "https://connect.squareup.com"
    : "https://connect.squareupsandbox.com";
}

function headers() {
  return {
    "Square-Version": SQUARE_VERSION,
    Authorization: `Bearer ${process.env.SQUARE_ACCESS_TOKEN}`,
    "Content-Type": "application/json",
  };
}

export function squareConfigured() {
  return Boolean(process.env.SQUARE_ACCESS_TOKEN && process.env.SQUARE_LOCATION_ID);
}

export async function createApplicationFeeInvoice(opts: {
  householdId: string;
  applicationId: string;
  propertyName: string;
  feeTotal: number;
  adults: { name: string; email: string | null }[];
}) {
  if (!squareConfigured()) throw new Error("SQUARE_NOT_CONFIGURED");
  if (opts.adults.length === 0) throw new Error("No adults to invoice");

  const key = opts.applicationId;
  const perAdultCents = Math.round((opts.feeTotal / opts.adults.length) * 100);

  const customerRes = await fetch(`${baseUrl()}/v2/customers`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      idempotency_key: `${key}-customer`,
      given_name: opts.adults[0].name,
      email_address: opts.adults[0].email ?? undefined,
      reference_id: opts.householdId,
    }),
  });
  const customerData = await customerRes.json();
  if (!customerRes.ok) throw new Error(`Square customer error: ${JSON.stringify(customerData)}`);
  const customerId = customerData.customer.id as string;

  const orderRes = await fetch(`${baseUrl()}/v2/orders`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      idempotency_key: `${key}-order`,
      order: {
        location_id: process.env.SQUARE_LOCATION_ID,
        line_items: opts.adults.map((a) => ({
          name: `Application fee — ${a.name}`,
          quantity: "1",
          base_price_money: { amount: perAdultCents, currency: "USD" },
        })),
      },
    }),
  });
  const orderData = await orderRes.json();
  if (!orderRes.ok) throw new Error(`Square order error: ${JSON.stringify(orderData)}`);

  const invoiceRes = await fetch(`${baseUrl()}/v2/invoices`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      idempotency_key: `${key}-invoice`,
      invoice: {
        order_id: orderData.order.id,
        location_id: process.env.SQUARE_LOCATION_ID,
        primary_recipient: { customer_id: customerId },
        payment_requests: [{ request_type: "BALANCE", due_date: new Date().toISOString().slice(0, 10) }],
        delivery_method: "SHARE_MANUALLY",
        title: `${opts.propertyName} — Application Fee`,
        accepted_payment_methods: { card: true },
      },
    }),
  });
  const invoiceData = await invoiceRes.json();
  if (!invoiceRes.ok) throw new Error(`Square invoice error: ${JSON.stringify(invoiceData)}`);

  const publishRes = await fetch(`${baseUrl()}/v2/invoices/${invoiceData.invoice.id}/publish`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ version: invoiceData.invoice.version, idempotency_key: `${key}-publish` }),
  });
  const publishData = await publishRes.json();
  if (!publishRes.ok) throw new Error(`Square publish error: ${JSON.stringify(publishData)}`);

  return {
    customerId,
    invoiceId: publishData.invoice.id as string,
    publicUrl: publishData.invoice.public_url as string,
  };
}
