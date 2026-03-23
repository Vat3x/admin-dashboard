import { Router } from "express";
import { getSupabase } from "../services/supabase";
import { getTrackerFirestore } from "../services/tracker";

const router = Router();

// GET /api/analytics — aggregated analytics for dashboard charts
router.get("/", async (_req, res) => {
  try {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

    // Fetch all profiles for aggregation
    const { data: profiles, error: profilesError } = await getSupabase()
      .from("profiles")
      .select("created_at, plan, status");

    if (profilesError) throw profilesError;

    // Signup trends — group by month
    const signupsByMonth: Record<string, number> = {};
    let recentSignups = 0;
    let freeCount = 0;
    let paidCount = 0;
    let activeCount = 0;
    let blockedCount = 0;

    for (const p of profiles || []) {
      // Monthly aggregation
      if (p.created_at) {
        const month = p.created_at.slice(0, 7); // "2026-03"
        signupsByMonth[month] = (signupsByMonth[month] || 0) + 1;

        if (p.created_at >= sevenDaysAgo) {
          recentSignups++;
        }
      }

      // Plan distribution
      if (p.plan === "paid") paidCount++;
      else freeCount++;

      // Status distribution
      if (p.status === "blocked") blockedCount++;
      else activeCount++;
    }

    // Sort months and format
    const sortedMonths = Object.keys(signupsByMonth).sort();
    const signupsTrend = sortedMonths.map((month) => ({
      month,
      count: signupsByMonth[month],
    }));

    // Demo requests — group by month
    const demoRequestsByMonth: Record<string, number> = {};
    let recentDemoRequests = 0;
    try {
      const snapshot = await getTrackerFirestore()
        .collection("demoRequests")
        .orderBy("createdAt", "desc")
        .get();

      for (const doc of snapshot.docs) {
        const data = doc.data();
        if (data.createdAt) {
          const ts = data.createdAt.toDate
            ? data.createdAt.toDate()
            : new Date(data.createdAt);
          const month = ts.toISOString().slice(0, 7);
          demoRequestsByMonth[month] = (demoRequestsByMonth[month] || 0) + 1;

          if (ts >= new Date(sevenDaysAgo)) {
            recentDemoRequests++;
          }
        }
      }
    } catch (err) {
      console.error("Demo requests analytics error:", err);
    }

    const sortedDemoMonths = Object.keys(demoRequestsByMonth).sort();
    const demoTrend = sortedDemoMonths.map((month) => ({
      month,
      count: demoRequestsByMonth[month],
    }));

    res.json({
      signupsByMonth: signupsTrend,
      demoRequestsByMonth: demoTrend,
      planDistribution: { free: freeCount, paid: paidCount },
      statusDistribution: { active: activeCount, blocked: blockedCount },
      recentSignups,
      recentDemoRequests,
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch analytics", error: String(err) });
  }
});

export default router;
