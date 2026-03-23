"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const supabase_1 = require("../services/supabase");
const tracker_1 = require("../services/tracker");
const PLAN_LIMITS = {
    free: 5,
    starter: 50,
    pro: 999,
    enterprise: 999,
};
const PLAN_ORDER = ["free", "starter", "pro", "enterprise"];
function getEventType(from, to) {
    const fi = PLAN_ORDER.indexOf(from);
    const ti = PLAN_ORDER.indexOf(to);
    if (fi < 0 || ti < 0)
        return "change";
    if (ti > fi)
        return "upgrade";
    if (ti < fi)
        return "downgrade";
    return "change";
}
const router = (0, express_1.Router)();
// GET /api/trial — list all 3D Planning trial users
router.get("/", async (_req, res) => {
    try {
        const { data, error } = await (0, supabase_1.getSupabase)()
            .from("profiles")
            .select("*")
            .order("created_at", { ascending: false });
        if (error)
            throw error;
        res.json(data);
    }
    catch (err) {
        res.status(500).json({ message: "Failed to fetch trial users", error: String(err) });
    }
});
// POST /api/trial/:id/reset-count — reset monthly usage count
router.post("/:id/reset-count", async (req, res) => {
    try {
        const { error } = await (0, supabase_1.getSupabase)()
            .from("profiles")
            .update({ monthly_count: 0, daily_count: 0 })
            .eq("id", req.params.id);
        if (error)
            throw error;
        res.json({ message: "Usage count reset" });
    }
    catch (err) {
        res.status(500).json({ message: "Failed to reset count", error: String(err) });
    }
});
// POST /api/trial/:id/override-limit — set custom monthly limit
router.post("/:id/override-limit", async (req, res) => {
    try {
        const { monthlyLimit } = req.body;
        const { error } = await (0, supabase_1.getSupabase)()
            .from("profiles")
            .update({ monthly_limit: monthlyLimit })
            .eq("id", req.params.id);
        if (error)
            throw error;
        res.json({ message: `Monthly limit set to ${monthlyLimit}` });
    }
    catch (err) {
        res.status(500).json({ message: "Failed to override limit", error: String(err) });
    }
});
// POST /api/trial/:id/change-plan — change user plan (free/starter/pro/enterprise)
router.post("/:id/change-plan", async (req, res) => {
    try {
        const { plan } = req.body;
        // Fetch current plan before updating
        const { data: currentUser } = await (0, supabase_1.getSupabase)()
            .from("profiles")
            .select("plan, email")
            .eq("id", req.params.id)
            .single();
        const monthlyLimit = PLAN_LIMITS[plan] ?? 5;
        const update = { plan, monthly_limit: monthlyLimit };
        const { error } = await (0, supabase_1.getSupabase)()
            .from("profiles")
            .update(update)
            .eq("id", req.params.id);
        if (error)
            throw error;
        // Log subscription event
        const fromPlan = currentUser?.plan || "free";
        if (fromPlan !== plan) {
            await tracker_1.adminFirestore.collection("subscription_events").add({
                product: "3d-planning",
                userId: req.params.id,
                userEmail: currentUser?.email || "",
                fromPlan,
                toPlan: plan,
                eventType: getEventType(fromPlan, plan),
                timestamp: new Date(),
                triggeredBy: "admin",
            });
        }
        res.json({ message: `Plan changed to ${plan}` });
    }
    catch (err) {
        res.status(500).json({ message: "Failed to change plan", error: String(err) });
    }
});
// POST /api/trial/:id/block — block a 3D Planning user
router.post("/:id/block", async (req, res) => {
    try {
        const { error } = await (0, supabase_1.getSupabase)()
            .from("profiles")
            .update({ status: "blocked" })
            .eq("id", req.params.id);
        if (error)
            throw error;
        res.json({ message: "User blocked" });
    }
    catch (err) {
        res.status(500).json({ message: "Failed to block user", error: String(err) });
    }
});
// POST /api/trial/:id/unblock — unblock a 3D Planning user
router.post("/:id/unblock", async (req, res) => {
    try {
        const { error } = await (0, supabase_1.getSupabase)()
            .from("profiles")
            .update({ status: "active" })
            .eq("id", req.params.id);
        if (error)
            throw error;
        res.json({ message: "User unblocked" });
    }
    catch (err) {
        res.status(500).json({ message: "Failed to unblock user", error: String(err) });
    }
});
// DELETE /api/trial/:id — delete a Supabase user (auth + profile)
router.delete("/:id", async (req, res) => {
    try {
        const userId = req.params.id;
        // Delete from Supabase Auth
        const { error: authError } = await (0, supabase_1.getSupabase)().auth.admin.deleteUser(userId);
        if (authError) {
            console.error("Supabase auth delete error:", authError);
        }
        // Delete from profiles table
        const { error } = await (0, supabase_1.getSupabase)()
            .from("profiles")
            .delete()
            .eq("id", userId);
        if (error)
            throw error;
        res.json({ message: "User deleted" });
    }
    catch (err) {
        res.status(500).json({ message: "Failed to delete user", error: String(err) });
    }
});
exports.default = router;
//# sourceMappingURL=trial-management.js.map