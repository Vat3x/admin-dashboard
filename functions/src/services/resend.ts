import { Resend } from "resend";

// Lazy-initialize Resend client (only when actually called)
let _resend: Resend | null = null;

export function getResend(): Resend {
  if (_resend) return _resend;

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("RESEND_API_KEY must be set");
  }

  _resend = new Resend(apiKey);
  return _resend;
}
