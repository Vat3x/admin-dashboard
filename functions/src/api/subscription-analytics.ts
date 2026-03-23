import { Router, Request } from "express";
import { adminFirestore } from "../services/tracker";
import { getSupabase } from "../services/supabase";

const router = Router();

const TRACKER_PRICES: Record<string, number> = {
  demo: 0,
  starter: 39,
  growth: 99,
  business: 189,
  enterprise: 0, // custom pricing, excluded from MRR calc
};

const PLANNING_PRICES: Record<string, number> = {
  free: 0,
  starter: 29,
  pro: 79,
  enterprise: 0, // custom pricing, excluded from MRR calc
};

// GET /api/subscription-analytics?product=tracker|3d-planning
router.get("/", async (req: Request, res) => {
  try {
    const productFilter = req.query.product as string | undefined;
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    let mrr = 0;
    let activeSubscriptions = 0;
    const planCounts: Record<string, number> = {};

    // Tracker subscriptions
    if (!productFilter || productFilter === "tracker") {
      try {
        const subsSnapshot = await adminFirestore
          .collection("subscriptions")
          .where("status", "==", "active")
          .get();

        for (const doc of subsSnapshot.docs) {
          const data = doc.data();
          activeSubscriptions++;
          const plan = (data.plan || "demo").toLowerCase();
          mrr += TRACKER_PRICES[plan] || 0;
          planCounts[plan] = (planCounts[plan] || 0) + 1;
        }
      } catch (err) {
        console.error("Tracker subscriptions error:", err);
      }
    }

    // 3D Planning users by plan
    if (!productFilter || productFilter === "3d-planning") {
      try {
        for (const planName of Object.keys(PLANNING_PRICES)) {
          const { count } = await getSupabase()
            .from("profiles")
            .select("*", { count: "exact", head: true })
            .eq("plan", planName);
          const planCount = count || 0;
          if (planCount > 0) {
            if (planName !== "free") activeSubscriptions += planCount;
            mrr += planCount * (PLANNING_PRICES[planName] || 0);
            planCounts[planName] = (planCounts[planName] || 0) + planCount;
          }
        }
        // Count users with no plan set as free
        const { count: nullCount } = await getSupabase()
          .from("profiles")
          .select("*", { count: "exact", head: true })
          .is("plan", null);
        if (nullCount && nullCount > 0) {
          planCounts["free"] = (planCounts["free"] || 0) + nullCount;
        }
      } catch (err) {
        console.error("Supabase planning users error:", err);
      }
    }

    // Subscription events — filter by product if specified
    let upgrades30d = 0;
    let downgrades30d = 0;
    let newSubs30d = 0;
    let cancellations30d = 0;
    const eventsByMonth: Record<string, { upgrades: number; downgrades: number; cancellations: number; new: number }> = {};
    const recentEvents: Array<Record<string, unknown>> = [];

    try {
      let eventsQuery = adminFirestore
        .collection("subscription_events")
        .orderBy("timestamp", "desc");

      const eventsSnapshot = await eventsQuery.get();

      for (const doc of eventsSnapshot.docs) {
        const data = doc.data();

        // Filter by product if specified
        if (productFilter && data.product !== productFilter) continue;

        const ts = data.timestamp?.toDate
          ? data.timestamp.toDate()
          : new Date(data.timestamp);
        const month = ts.toISOString().slice(0, 7);

        if (!eventsByMonth[month]) {
          eventsByMonth[month] = { upgrades: 0, downgrades: 0, cancellations: 0, new: 0 };
        }

        const eventType = data.eventType as string;
        if (eventType === "upgrade") eventsByMonth[month].upgrades++;
        else if (eventType === "downgrade") eventsByMonth[month].downgrades++;
        else if (eventType === "cancellation") eventsByMonth[month].cancellations++;
        else if (eventType === "new") eventsByMonth[month].new++;

        if (ts >= thirtyDaysAgo) {
          if (eventType === "upgrade") upgrades30d++;
          else if (eventType === "downgrade") downgrades30d++;
          else if (eventType === "cancellation") cancellations30d++;
          else if (eventType === "new") newSubs30d++;
        }

        if (recentEvents.length < 20) {
          recentEvents.push({
            id: doc.id,
            userEmail: data.userEmail || "",
            eventType: data.eventType,
            fromPlan: data.fromPlan,
            toPlan: data.toPlan,
            product: data.product,
            timestamp: ts.toISOString(),
          });
        }
      }
    } catch (err) {
      console.error("Subscription events error:", err);
    }

    const activeAtStart = activeSubscriptions + cancellations30d;
    const churnRate = activeAtStart > 0
      ? Math.round((cancellations30d / activeAtStart) * 1000) / 10
      : 0;

    const sortedEventMonths = Object.keys(eventsByMonth).sort();
    const eventsTrend = sortedEventMonths.map((month) => ({
      month,
      ...eventsByMonth[month],
    }));

    const planDistribution = Object.entries(planCounts).map(([plan, count]) => ({
      plan,
      count,
    }));

    res.json({
      mrr,
      activeSubscriptions,
      churnRate,
      upgrades30d,
      downgrades30d,
      newSubscriptions30d: newSubs30d,
      cancellations30d,
      netGrowth30d: newSubs30d + upgrades30d - downgrades30d - cancellations30d,
      eventsByMonth: eventsTrend,
      planDistribution,
      recentEvents,
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch subscription analytics", error: String(err) });
  }
});

export default router;
