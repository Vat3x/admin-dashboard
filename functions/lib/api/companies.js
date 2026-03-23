"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const crypto = require("crypto");
const tracker_1 = require("../services/tracker");
const resend_1 = require("../services/resend");
const router = (0, express_1.Router)();
function buildWelcomeEmailHtml(name, companyName, resetLink) {
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
</head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:system-ui,-apple-system,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
          <tr>
            <td style="background:#0891b2;padding:28px 32px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;letter-spacing:-0.5px;">LoadMind Tracker</h1>
              <p style="margin:6px 0 0;color:rgba(255,255,255,0.8);font-size:13px;font-weight:400;">Fleet Tracking Platform</p>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;background:#ffffff;">
              <h2 style="margin:0 0 8px;font-size:18px;color:#111827;">Hi ${name},</h2>
              <p style="margin:0 0 8px;font-size:15px;color:#4b5563;line-height:1.6;">
                Your LoadMind Tracker account has been created for <strong>${companyName}</strong>.
              </p>
              <p style="margin:0 0 24px;font-size:15px;color:#4b5563;line-height:1.6;">
                To get started, set your password by clicking the button below:
              </p>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${resetLink}" style="display:inline-block;padding:14px 32px;background:#0891b2;color:#ffffff;font-size:16px;font-weight:600;text-decoration:none;border-radius:8px;">
                      Set Password &amp; Get Started
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:24px 0 0;font-size:14px;color:#4b5563;line-height:1.6;">
                Once your password is set, you can log in at <a href="https://load-mind.com/tracker" style="color:#0891b2;">load-mind.com/tracker</a>.
              </p>
              <p style="margin:24px 0 0;font-size:14px;color:#4b5563;">
                Best regards,<br><strong>The LoadMind Team</strong>
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 32px;border-top:1px solid #e5e7eb;text-align:center;background:#ffffff;">
              <p style="margin:0;font-size:12px;color:#9ca3af;">
                LoadMind Inc. &mdash; <a href="https://load-mind.com" style="color:#9ca3af;">load-mind.com</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
// GET /api/companies — list all companies from Tracker with user counts
router.get("/", async (_req, res) => {
    try {
        const [companiesSnap, usersSnap] = await Promise.all([
            (0, tracker_1.getTrackerFirestore)().collection("companies").get(),
            (0, tracker_1.getTrackerFirestore)().collection("users").get(),
        ]);
        // Build user counts per company
        const userCounts = {};
        usersSnap.docs.forEach((doc) => {
            const data = doc.data();
            const cid = data.companyId;
            if (!cid)
                return;
            if (!userCounts[cid])
                userCounts[cid] = { total: 0, drivers: 0, dispatchers: 0 };
            userCounts[cid].total++;
            if (data.role === "driver")
                userCounts[cid].drivers++;
            if (data.role === "dispatcher")
                userCounts[cid].dispatchers++;
        });
        const companies = companiesSnap.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
            _users: userCounts[doc.id]?.total || 0,
            _drivers: userCounts[doc.id]?.drivers || 0,
            _dispatchers: userCounts[doc.id]?.dispatchers || 0,
        }));
        res.json(companies);
    }
    catch (err) {
        res.status(500).json({ message: "Failed to fetch companies", error: String(err) });
    }
});
// GET /api/companies/:id — get single company
router.get("/:id", async (req, res) => {
    try {
        const doc = await (0, tracker_1.getTrackerFirestore)().collection("companies").doc(req.params.id).get();
        if (!doc.exists) {
            res.status(404).json({ message: "Company not found" });
            return;
        }
        res.json({ id: doc.id, ...doc.data() });
    }
    catch (err) {
        res.status(500).json({ message: "Failed to fetch company", error: String(err) });
    }
});
// POST /api/companies/:id/block — block a company
router.post("/:id/block", async (req, res) => {
    try {
        const companyId = req.params.id;
        // Update company document
        await (0, tracker_1.getTrackerFirestore)().collection("companies").doc(companyId).update({
            blocked: true,
        });
        // Disable all users belonging to this company
        const usersSnapshot = await (0, tracker_1.getTrackerFirestore)()
            .collection("users")
            .where("companyId", "==", companyId)
            .get();
        const disablePromises = usersSnapshot.docs.map((userDoc) => (0, tracker_1.getTrackerAuth)().updateUser(userDoc.id, { disabled: true }));
        await Promise.all(disablePromises);
        res.json({ message: "Company blocked", usersDisabled: usersSnapshot.size });
    }
    catch (err) {
        res.status(500).json({ message: "Failed to block company", error: String(err) });
    }
});
// POST /api/companies/:id/unblock — unblock a company
router.post("/:id/unblock", async (req, res) => {
    try {
        const companyId = req.params.id;
        await (0, tracker_1.getTrackerFirestore)().collection("companies").doc(companyId).update({
            blocked: false,
        });
        const usersSnapshot = await (0, tracker_1.getTrackerFirestore)()
            .collection("users")
            .where("companyId", "==", companyId)
            .get();
        const enablePromises = usersSnapshot.docs.map((userDoc) => (0, tracker_1.getTrackerAuth)().updateUser(userDoc.id, { disabled: false }));
        await Promise.all(enablePromises);
        res.json({ message: "Company unblocked", usersEnabled: usersSnapshot.size });
    }
    catch (err) {
        res.status(500).json({ message: "Failed to unblock company", error: String(err) });
    }
});
// DELETE /api/companies/:id — delete a company, unlink its users
router.delete("/:id", async (req, res) => {
    try {
        const companyId = req.params.id;
        // Unlink all users from this company (set companyId to null)
        const usersSnapshot = await (0, tracker_1.getTrackerFirestore)()
            .collection("users")
            .where("companyId", "==", companyId)
            .get();
        const unlinkPromises = usersSnapshot.docs.map((userDoc) => userDoc.ref.update({ companyId: null }));
        await Promise.all(unlinkPromises);
        // Delete company document
        await (0, tracker_1.getTrackerFirestore)().collection("companies").doc(companyId).delete();
        res.json({ message: "Company deleted", usersUnlinked: usersSnapshot.size });
    }
    catch (err) {
        res.status(500).json({ message: "Failed to delete company", error: String(err) });
    }
});
// POST /api/companies/create — create company + dispatcher from admin panel
router.post("/create", async (req, res) => {
    let createdUid = null;
    let isExistingUser = false;
    try {
        const { name, email, companyName, address, fleetSize, mcDotNumber } = req.body;
        if (!name || !email || !companyName) {
            res.status(400).json({ message: "name, email, and companyName are required" });
            return;
        }
        const now = Date.now();
        const tempPassword = crypto.randomBytes(16).toString("hex");
        let uid;
        // 1. Create or find Firebase Auth user
        try {
            const userRecord = await (0, tracker_1.getTrackerAuth)().createUser({
                email,
                password: tempPassword,
                displayName: name,
                emailVerified: true,
            });
            uid = userRecord.uid;
            createdUid = uid;
        }
        catch (createErr) {
            // If user already exists, get their uid and continue
            const errCode = createErr?.errorInfo?.code;
            if (errCode === "auth/email-already-exists") {
                const existing = await (0, tracker_1.getTrackerAuth)().getUserByEmail(email);
                uid = existing.uid;
                isExistingUser = true;
                console.log("Create account: Using existing auth user", uid);
            }
            else {
                throw createErr;
            }
        }
        // If user already exists, check if they already have a company — skip duplicate creation
        if (isExistingUser) {
            const existingUserDoc = await (0, tracker_1.getTrackerFirestore)().collection("users").doc(uid).get();
            if (existingUserDoc.exists && existingUserDoc.data()?.companyId) {
                // User already has an account + company — just resend the password reset email
                const rawResetLink = await (0, tracker_1.getTrackerAuth)().generatePasswordResetLink(email, {
                    url: "https://load-mind.com/tracker",
                });
                const resetUrl = new URL(rawResetLink);
                const resetLink = `https://load-mind.com/tracker/auth/action?${resetUrl.searchParams.toString()}`;
                await (0, resend_1.getResend)().emails.send({
                    from: "LoadMind <team@load-mind.com>",
                    to: email,
                    subject: "Your LoadMind Tracker account is ready!",
                    html: buildWelcomeEmailHtml(name, companyName, resetLink),
                });
                console.log("Create account: Resent email for existing account", { uid, companyId: existingUserDoc.data()?.companyId });
                res.json({
                    message: "Account already exists — password reset email resent",
                    userId: uid,
                    companyId: existingUserDoc.data()?.companyId,
                });
                return;
            }
        }
        // 2. Create company document
        const companyRef = await (0, tracker_1.getTrackerFirestore)().collection("companies").add({
            name: companyName,
            ownerId: uid,
            createdAt: now,
            settings: { trackingIntervalMinutes: 40 },
            address: address || "",
            fleetSize: fleetSize || "",
            referralSource: "demo-request",
            mcDotNumber: mcDotNumber || "",
        });
        // 3. Create company member subcollection
        await (0, tracker_1.getTrackerFirestore)()
            .collection("companies")
            .doc(companyRef.id)
            .collection("members")
            .doc(uid)
            .set({
            userId: uid,
            role: "admin",
            joinedAt: now,
        });
        // 4. Mirror to Realtime Database
        await (0, tracker_1.getTrackerDatabase)()
            .ref(`company_members/${companyRef.id}/${uid}`)
            .set(true);
        // 5. Create user document
        await (0, tracker_1.getTrackerFirestore)().collection("users").doc(uid).set({
            email,
            displayName: name,
            role: "dispatcher",
            companyId: companyRef.id,
            fcmToken: null,
            createdAt: now,
        });
        // 6. Generate password reset link and rewrite to use Tracker dashboard directly
        const rawResetLink = await (0, tracker_1.getTrackerAuth)().generatePasswordResetLink(email, {
            url: "https://load-mind.com/tracker",
        });
        // Extract query params and redirect to our own auth action page
        const resetUrl = new URL(rawResetLink);
        const resetLink = `https://load-mind.com/tracker/auth/action?${resetUrl.searchParams.toString()}`;
        // 7. Send welcome email
        await (0, resend_1.getResend)().emails.send({
            from: "LoadMind <team@load-mind.com>",
            to: email,
            subject: "Your LoadMind Tracker account is ready!",
            html: buildWelcomeEmailHtml(name, companyName, resetLink),
        });
        console.log("Create account: Success", { uid, companyId: companyRef.id, isExistingUser });
        res.json({
            message: "Account created successfully",
            userId: uid,
            companyId: companyRef.id,
        });
    }
    catch (err) {
        console.error("Create account FAILED:", err);
        // Rollback: only delete auth user if we created it (not if it already existed)
        if (createdUid && !isExistingUser) {
            try {
                await (0, tracker_1.getTrackerAuth)().deleteUser(createdUid);
            }
            catch (rollbackErr) {
                console.error("Rollback failed:", rollbackErr);
            }
        }
        const detail = err instanceof Error ? err.message : String(err);
        res.status(500).json({ message: `Failed to create account: ${detail}` });
    }
});
exports.default = router;
//# sourceMappingURL=companies.js.map