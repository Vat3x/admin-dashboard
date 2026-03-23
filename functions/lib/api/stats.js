"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const tracker_1 = require("../services/tracker");
const supabase_1 = require("../services/supabase");
const router = (0, express_1.Router)();
// GET /api/stats — aggregated overview stats from all products
router.get("/", async (_req, res) => {
    try {
        // Tracker stats
        let trackerStats = { companies: 0, users: 0, trips: 0 };
        try {
            const [companiesSnap, usersSnap, tripsSnap] = await Promise.all([
                (0, tracker_1.getTrackerFirestore)().collection("companies").count().get(),
                (0, tracker_1.getTrackerFirestore)().collection("users").count().get(),
                (0, tracker_1.getTrackerFirestore)().collection("trips").count().get(),
            ]);
            trackerStats = {
                companies: companiesSnap.data().count,
                users: usersSnap.data().count,
                trips: tripsSnap.data().count,
            };
        }
        catch (err) {
            console.error("Tracker stats error:", err);
        }
        // 3D Planning stats from Supabase
        let planningStats = { totalUsers: 0, paidUsers: 0 };
        try {
            const { count: planningUsers } = await (0, supabase_1.getSupabase)()
                .from("profiles")
                .select("*", { count: "exact", head: true });
            const { count: planningPaidUsers } = await (0, supabase_1.getSupabase)()
                .from("profiles")
                .select("*", { count: "exact", head: true })
                .eq("plan", "paid");
            planningStats = {
                totalUsers: planningUsers || 0,
                paidUsers: planningPaidUsers || 0,
            };
        }
        catch (err) {
            console.error("Supabase stats error:", err);
        }
        res.json({
            tracker: trackerStats,
            planning: planningStats,
        });
    }
    catch (err) {
        res.status(500).json({ message: "Failed to fetch stats", error: String(err) });
    }
});
exports.default = router;
//# sourceMappingURL=stats.js.map