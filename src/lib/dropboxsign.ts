// Server-only. Thin wrapper around Dropbox Sign's REST API (no SDK — a
// handful of endpoints doesn't need one). Requires DROPBOX_SIGN_API_KEY.
//
// Note: the connected account is on the Free plan, which ships with
// api_signature_requests_left = 0 — real (non-test) requests will be
// rejected until it's upgraded to a paid plan with API access. Test-mode
// requests (DROPBOX_SIGN_TEST_MODE=true) work regardless and are what
// this app uses until that upgrade happens.

const API_BASE = "https://api.hellosign.com/v3";

function authHeader() {
  const key = process.env.DROPBOX_SIGN_API_KEY!;
  return "Basic " + Buffer.from(`${key}:`).toString("base64");
}

export function dropboxSignConfigured() {
  return Boolean(process.env.DROPBOX_SIGN_API_KEY);
}

function isTestMode() {
  return process.env.DROPBOX_SIGN_TEST_MODE !== "false";
}

export async function sendSignatureRequest(opts: {
  title: string;
  subject: string;
  message?: string;
  signers: { name: string; email: string }[];
  file: File;
}) {
  const form = new FormData();
  form.set("title", opts.title);
  form.set("subject", opts.subject);
  if (opts.message) form.set("message", opts.message);
  form.set("test_mode", isTestMode() ? "1" : "0");
  opts.signers.forEach((s, i) => {
    form.set(`signers[${i}][name]`, s.name);
    form.set(`signers[${i}][email_address]`, s.email);
    form.set(`signers[${i}][order]`, String(i));
  });
  form.set("file[0]", opts.file, opts.file.name);

  const res = await fetch(`${API_BASE}/signature_request/send`, {
    method: "POST",
    headers: { Authorization: authHeader() },
    body: form,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Dropbox Sign send error: ${JSON.stringify(data)}`);
  return data.signature_request as {
    signature_request_id: string;
    is_complete: boolean;
    signatures: { signer_email_address: string; status_code: string }[];
  };
}

export async function getSignatureRequest(signatureRequestId: string) {
  const res = await fetch(`${API_BASE}/signature_request/${signatureRequestId}`, {
    headers: { Authorization: authHeader() },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Dropbox Sign fetch error: ${JSON.stringify(data)}`);
  return data.signature_request as {
    signature_request_id: string;
    is_complete: boolean;
    is_declined: boolean;
    signatures: { signer_email_address: string; status_code: string; signed_at: number | null }[];
  };
}

export async function downloadExecutedFile(signatureRequestId: string) {
  const res = await fetch(`${API_BASE}/signature_request/files/${signatureRequestId}?file_type=pdf`, {
    headers: { Authorization: authHeader() },
  });
  if (!res.ok) throw new Error(`Dropbox Sign file download error: ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}
