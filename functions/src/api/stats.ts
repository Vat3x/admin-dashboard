import { Router } from "express";
import { getTrackerFirestore } from "../services/tracker";
import { getSupabase } from "../services/supabase";

const router = Router();

// GET /api/stats — aggregated overview stats from all products
router.get("/", async (_req, res) => {
  try {
    // Tracker stats
    let trackerStats = { companies: 0, users: 0, trips: 0 };
    try {
      const [companiesSnap, usersSnap, tripsSnap] = await Promise.all([
        getTrackerFirestore().collection("companies").count().get(),
        getTrackerFirestore().collection("users").count().get(),
        getTrackerFirestore().collection("trips").count().get(),
      ]);
      trackerStats = {
        companies: companiesSnap.data().count,
        users: usersSnap.data().count,
        trips: tripsSnap.data().count,
      };
    } catch (err) {
      console.error("Tracker stats error:", err);
    }

    // 3D Planning stats from Supabase
    let planningStats = { totalUsers: 0, paidUsers: 0 };
    try {
      const { count: planningUsers } = await getSupabase()
        .from("profiles")
        .select("*", { count: "exact", head: true });

      const { count: planningPaidUsers } = await getSupabase()
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("plan", "paid");

      planningStats = {
        totalUsers: planningUsers || 0,
        paidUsers: planningPaidUsers || 0,
      };
    } catch (err) {
      console.error("Supabase stats error:", err);
    }

    res.json({
      tracker: trackerStats,
      planning: planningStats,
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch stats", error: String(err) });
  }
});

export default router;
