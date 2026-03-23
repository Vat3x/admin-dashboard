"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.api = void 0;
const https_1 = require("firebase-functions/v2/https");
const params_1 = require("firebase-functions/params");
const express = require("express");
const cors = require("cors");
const auth_1 = require("./middleware/auth");
const companies_1 = require("./api/companies");
const users_1 = require("./api/users");
const stats_1 = require("./api/stats");
const demo_requests_1 = require("./api/demo-requests");
const trial_management_1 = require("./api/trial-management");
const payments_1 = require("./api/payments");
const analytics_1 = require("./api/analytics");
const subscription_analytics_1 = require("./api/subscription-analytics");
const broadcasts_1 = require("./api/broadcasts");
const resend_1 = require("./services/resend");
// Declare secrets so they're available at runtime
const trackerServiceAccount = (0, params_1.defineSecret)("TRACKER_SERVICE_ACCOUNT");
const supabaseUrl = (0, params_1.defineSecret)("SUPABASE_URL");
const supabaseServiceRoleKey = (0, params_1.defineSecret)("SUPABASE_SERVICE_ROLE_KEY");
const resendApiKey = (0, params_1.defineSecret)("RESEND_API_KEY");
const app = express();
app.use(cors({ origin: true }));
app.use(express.json());
// Admin-only routes (require admin custom claim)
app.use("/api/companies", auth_1.verifyAdmin, companies_1.default);
app.use("/api/users", auth_1.verifyAdmin, users_1.default);
app.use("/api/stats", auth_1.verifyAdmin, stats_1.default);
app.use("/api/demo-requests", auth_1.verifyAdmin, demo_requests_1.default);
app.use("/api/trial", auth_1.verifyAdmin, trial_management_1.default);
app.use("/api/payments", auth_1.verifyAdmin, payments_1.default);
app.use("/api/analytics", auth_1.verifyAdmin, analytics_1.default);
app.use("/api/subscription-analytics", auth_1.verifyAdmin, subscription_analytics_1.default);
app.use("/api/broadcasts", auth_1.verifyAdmin, broadcasts_1.default);
// Public endpoint for demo request form on load-mind.com
app.post("/api/public/demo-request", async (req, res) => {
    try {
        const { name, email, subject, message, phone, company, businessType, shipmentVolume, mcDot, preferredTime } = req.body;
        if (!name || !email) {
            res.status(400).json({ message: "Name and email are required" });
            return;
        }
        await (0, demo_requests_1.submitDemoRequest)({
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
            await (0, resend_1.getResend)().emails.send({
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
        }
        catch (emailErr) {
            console.error("Auto-reply email failed:", emailErr);
        }
        res.json({ message: "Demo request submitted" });
    }
    catch (err) {
        res.status(500).json({ message: "Failed to submit demo request", error: String(err) });
    }
});
exports.api = (0, https_1.onRequest)({ secrets: [trackerServiceAccount, supabaseUrl, supabaseServiceRoleKey, resendApiKey] }, app);
//# sourceMappingURL=index.js.map