import { onRequest } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import * as express from "express";
import * as cors from "cors";
import { verifyAdmin } from "./middleware/auth";
import companiesRouter from "./api/companies";
import usersRouter from "./api/users";
import statsRouter from "./api/stats";
import demoRequestsRouter, { submitDemoRequest } from "./api/demo-requests";
import trialRouter from "./api/trial-management";
import paymentsRouter from "./api/payments";
import analyticsRouter from "./api/analytics";
import subscriptionAnalyticsRouter from "./api/subscription-analytics";
import broadcastsRouter from "./api/broadcasts";
import { getResend } from "./services/resend";

// Declare secrets so they're available at runtime
const trackerServiceAccount = defineSecret("TRACKER_SERVICE_ACCOUNT");
const supabaseUrl = defineSecret("SUPABASE_URL");
const supabaseServiceRoleKey = defineSecret("SUPABASE_SERVICE_ROLE_KEY");
const resendApiKey = defineSecret("RESEND_API_KEY");

const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

// Admin-only routes (require admin custom claim)
app.use("/api/companies", verifyAdmin, companiesRouter);
app.use("/api/users", verifyAdmin, usersRouter);
app.use("/api/stats", verifyAdmin, statsRouter);
app.use("/api/demo-requests", verifyAdmin, demoRequestsRouter);
app.use("/api/trial", verifyAdmin, trialRouter);
app.use("/api/payments", verifyAdmin, paymentsRouter);
app.use("/api/analytics", verifyAdmin, analyticsRouter);
app.use("/api/subscription-analytics", verifyAdmin, subscriptionAnalyticsRouter);
app.use("/api/broadcasts", verifyAdmin, broadcastsRouter);

// Public endpoint for demo request form on load-mind.com
app.post("/api/public/demo-request", async (req, res) => {
  try {
    const { name, email, subject, message, phone, company, businessType, shipmentVolume, mcDot, preferredTime } = req.body;

    if (!name || !email) {
      res.status(400).json({ message: "Name and email are required" });
      return;
    }

    await submitDemoRequest({
      name,
      email,
      subject: subject || "General",
      message: message || "",
      phone: phone || "",
      company: company || "",
      businessType: businessType || "",
      shipmentVolume: shipmentVolume || "",
      mcDot: mcDot || "",
      preferredTime: preferredTime || "",
    });

    // Send auto-reply confirmation email
    try {
      await getResend().emails.send({
        from: "LoadMind <team@load-mind.com>",
        to: email,
        subject: "We received your demo request!",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; color: #1a1a1a;">
            <div style="text-align: center; padding: 32px 0 24px;">
              <h1 style="font-size: 24px; font-weight: 700; margin: 0;">LoadMind</h1>
            </div>
            <p>Hi ${name},</p>
            <p>Thank you for your interest in LoadMind! We've received your demo request and our team will reach out to you within <strong>24 hours</strong>.</p>
            <p>In the meantime, feel free to explore our products:</p>
            <ul style="padding-left: 20px; line-height: 1.8;">
              <li><a href="https://load-mind.com/tracker" style="color: #0891b2;">LoadMind Tracker</a> — Real-time fleet tracking</li>
              <li><a href="https://load-mind.com/3d" style="color: #0891b2;">3D Load Planner</a> — AI-powered cargo optimization</li>
            </ul>
            <p>If you have any immediate questions, just reply to this email.</p>
            <p style="margin-top: 24px;">Best regards,<br><strong>The LoadMind Team</strong></p>
            <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 32px 0 16px;" />
            <p style="font-size: 12px; color: #888;">LoadMind Inc. &bull; <a href="https://load-mind.com" style="color: #888;">load-mind.com</a></p>
          </div>
        `,
      });
    } catch (emailErr) {
      console.error("Auto-reply email failed:", emailErr);
    }

    res.json({ message: "Demo request submitted" });
  } catch (err) {
    res.status(500).json({ message: "Failed to submit demo request", error: String(err) });
  }
});

export const api = onRequest(
  { secrets: [trackerServiceAccount, supabaseUrl, supabaseServiceRoleKey, resendApiKey] },
  app
);
