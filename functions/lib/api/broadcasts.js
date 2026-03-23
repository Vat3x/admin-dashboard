"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const tracker_1 = require("../services/tracker");
const tracker_2 = require("../services/tracker");
const supabase_1 = require("../services/supabase");
const resend_1 = require("../services/resend");
const router = (0, express_1.Router)();
// GET /api/broadcasts — list sent broadcasts
router.get("/", async (_req, res) => {
    try {
        const snapshot = await tracker_1.adminFirestore
            .collection("broadcasts")
            .orderBy("sentAt", "desc")
            .limit(50)
            .get();
        const broadcasts = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
            sentAt: doc.data().sentAt?.toDate
                ? doc.data().sentAt.toDate().toISOString()
                : doc.data().sentAt,
        }));
        res.json(broadcasts);
    }
    catch (err) {
        res.status(500).json({ message: "Failed to fetch broadcasts", error: String(err) });
    }
});
// Helper: collect emails by recipient group
async function collectEmails(recipientGroup) {
    const emails = new Set();
    const fetchTrackerEmails = async () => {
        const snapshot = await (0, tracker_2.getTrackerFirestore)()
            .collection("users")
            .get();
        for (const doc of snapshot.docs) {
            const data = doc.data();
            if (data.email && data.status !== "blocked") {
                emails.add(data.email);
            }
        }
    };
    const fetchSupabaseEmails = async (planFilter) => {
        let query = (0, supabase_1.getSupabase)()
            .from("profiles")
            .select("email, status, plan");
        if (planFilter) {
            query = query.eq("plan", planFilter);
        }
        const { data } = await query;
        for (const p of data || []) {
            if (p.email && p.status !== "blocked") {
                emails.add(p.email);
            }
        }
    };
    switch (recipientGroup) {
        case "all":
            await Promise.all([fetchTrackerEmails(), fetchSupabaseEmails()]);
            break;
        case "tracker":
            await fetchTrackerEmails();
            break;
        case "3d-planning":
        case "website":
            await fetchSupabaseEmails();
            break;
        case "free":
            await fetchSupabaseEmails("free");
            break;
        case "paid":
            // Supabase paid users + Tracker users with paid subscriptions
            await fetchSupabaseEmails("paid");
            try {
                const subsSnapshot = await tracker_1.adminFirestore
                    .collection("subscriptions")
                    .where("status", "==", "active")
                    .get();
                for (const doc of subsSnapshot.docs) {
                    const data = doc.data();
                    if (data.userId) {
                        // Try to get email from tracker users collection
                        const userDoc = await (0, tracker_2.getTrackerFirestore)()
                            .collection("users")
                            .doc(data.userId)
                            .get();
                        if (userDoc.exists && userDoc.data()?.email) {
                            emails.add(userDoc.data().email);
                        }
                    }
                }
            }
            catch (err) {
                console.error("Error fetching paid tracker users:", err);
            }
            break;
        default:
            throw new Error(`Unknown recipient group: ${recipientGroup}`);
    }
    return Array.from(emails);
}
// Helper: chunk array into batches
function chunkArray(array, size) {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
        chunks.push(array.slice(i, i + size));
    }
    return chunks;
}
// POST /api/broadcasts — send email broadcast
router.post("/", async (req, res) => {
    try {
        const { subject, body, recipientGroup } = req.body;
        if (!subject || !body || !recipientGroup) {
            res.status(400).json({ message: "Subject, body, and recipientGroup are required" });
            return;
        }
        const validGroups = ["all", "free", "paid", "tracker", "3d-planning", "website"];
        if (!validGroups.includes(recipientGroup)) {
            res.status(400).json({ message: `Invalid recipientGroup. Must be one of: ${validGroups.join(", ")}` });
            return;
        }
        // Collect recipient emails
        const emails = await collectEmails(recipientGroup);
        if (emails.length === 0) {
            res.status(400).json({ message: "No recipients found for the selected group" });
            return;
        }
        // Send via Resend in batches of 50
        const resend = (0, resend_1.getResend)();
        const batches = chunkArray(emails, 50);
        let failedCount = 0;
        for (const batch of batches) {
            try {
                await resend.batch.send(batch.map((email) => ({
                    from: "LoadMind <team@load-mind.com>",
                    to: [email],
                    subject,
                    html: body,
                })));
            }
            catch (err) {
                console.error("Batch send error:", err);
                failedCount += batch.length;
            }
        }
        const status = failedCount === 0
            ? "sent"
            : failedCount === emails.length
                ? "failed"
                : "partial";
        // Store broadcast record
        await tracker_1.adminFirestore.collection("broadcasts").add({
            subject,
            body,
            recipientGroup,
            recipientCount: emails.length,
            sentCount: emails.length - failedCount,
            sentAt: new Date(),
            status,
        });
        res.json({
            message: `Broadcast ${status}`,
            recipientCount: emails.length,
            sentCount: emails.length - failedCount,
            status,
        });
    }
    catch (err) {
        res.status(500).json({ message: "Failed to send broadcast", error: String(err) });
    }
});
exports.default = router;
//# sourceMappingURL=broadcasts.js.map