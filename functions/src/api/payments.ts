import { Router } from "express";
import { adminFirestore } from "../services/tracker";

const router = Router();

const TRACKER_PLAN_ORDER: Record<string, number> = {
  demo: 0, starter: 1, growth: 2, business: 3, enterprise: 4,
};

// GET /api/payments/subscriptions — list all subscriptions
router.get("/subscriptions", async (_req, res) => {
  try {
    const snapshot = await adminFirestore
      .collection("subscriptions")
      .orderBy("createdAt", "desc")
      .get();

    const subscriptions = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.json(subscriptions);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch subscriptions", error: String(err) });
  }
});

// POST /api/payments/subscriptions — create subscription
router.post("/subscriptions", async (req, res) => {
  try {
    const { companyId, userId, productId, plan } = req.body;

    const doc = await adminFirestore.collection("subscriptions").add({
      companyId,
      userId,
      productId,
      plan,
      status: "active",
      paymentProvider: "flitt",
      flittSubscriptionId: null, // Will be set when Flitt is integrated
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Log subscription event
    await adminFirestore.collection("subscription_events").add({
      product: "tracker",
      userId: userId || "",
      userEmail: "",
      fromPlan: null,
      toPlan: plan,
      eventType: "new",
      timestamp: new Date(),
      triggeredBy: "admin",
    });

    res.json({ id: doc.id, message: "Subscription created" });
  } catch (err) {
    res.status(500).json({ message: "Failed to create subscription", error: String(err) });
  }
});

// PUT /api/payments/subscriptions/:id — update subscription
router.put("/subscriptions/:id", async (req, res) => {
  try {
    const { plan, status } = req.body;

    // Fetch current subscription for event logging
    const currentDoc = await adminFirestore.collection("subscriptions").doc(req.params.id).get();
    const currentData = currentDoc.data();

    const update: Record<string, unknown> = { updatedAt: new Date() };

    if (plan) update.plan = plan;
    if (status) update.status = status;

    await adminFirestore.collection("subscriptions").doc(req.params.id).update(update);

    // Log plan change event
    if (plan && currentData && plan !== currentData.plan) {
      const fromOrder = TRACKER_PLAN_ORDER[currentData.plan] ?? 0;
      const toOrder = TRACKER_PLAN_ORDER[plan] ?? 0;
      await adminFirestore.collection("subscription_events").add({
        product: "tracker",
        userId: currentData.userId || "",
        userEmail: "",
        fromPlan: currentData.plan,
        toPlan: plan,
        eventType: toOrder > fromOrder ? "upgrade" : "downgrade",
        timestamp: new Date(),
        triggeredBy: "admin",
      });
    }

    // Log cancellation event
    if (status === "cancelled" && currentData && currentData.status !== "cancelled") {
      await adminFirestore.collection("subscription_events").add({
        product: "tracker",
        userId: currentData.userId || "",
        userEmail: "",
        fromPlan: currentData.plan || "",
        toPlan: currentData.plan || "",
        eventType: "cancellation",
        timestamp: new Date(),
        triggeredBy: "admin",
      });
    }

    res.json({ message: "Subscription updated" });
  } catch (err) {
    res.status(500).json({ message: "Failed to update subscription", error: String(err) });
  }
});

// DELETE /api/payments/subscriptions/:id — cancel subscription
router.delete("/subscriptions/:id", async (req, res) => {
  try {
    // Fetch current subscription for event logging
    const currentDoc = await adminFirestore.collection("subscriptions").doc(req.params.id).get();
    const currentData = currentDoc.data();

    await adminFirestore.collection("subscriptions").doc(req.params.id).update({
      status: "cancelled",
      updatedAt: new Date(),
    });

    // Log cancellation event
    if (currentData) {
      await adminFirestore.collection("subscription_events").add({
        product: "tracker",
        userId: currentData.userId || "",
        userEmail: "",
        fromPlan: currentData.plan || "",
        toPlan: currentData.plan || "",
        eventType: "cancellation",
        timestamp: new Date(),
        triggeredBy: "admin",
      });
    }

    res.json({ message: "Subscription cancelled" });
  } catch (err) {
    res.status(500).json({ message: "Failed to cancel subscription", error: String(err) });
  }
});

// GET /api/payments/history — payment event history
router.get("/history", async (_req, res) => {
  try {
    const snapshot = await adminFirestore
      .collection("payment_events")
      .orderBy("timestamp", "desc")
      .limit(100)
      .get();

    const events = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.json(events);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch payment history", error: String(err) });
  }
});

// GET /api/payments/plans — list pricing plans
router.get("/plans", async (_req, res) => {
  try {
    const snapshot = await adminFirestore
      .collection("pricing_plans")
      .where("isActive", "==", true)
      .get();

    const plans = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.json(plans);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch pricing plans", error: String(err) });
  }
});

// POST /api/payments/plans — create pricing plan
router.post("/plans", async (req, res) => {
  try {
    const { productId, name, price, yearlyPrice, limits, features } = req.body;

    const doc = await adminFirestore.collection("pricing_plans").add({
      productId,
      name,
      price,
      yearlyPrice: yearlyPrice || null,
      limits: limits || {},
      features: features || [],
      isActive: true,
    });

    res.json({ id: doc.id, message: "Pricing plan created" });
  } catch (err) {
    res.status(500).json({ message: "Failed to create pricing plan", error: String(err) });
  }
});

export default router;
