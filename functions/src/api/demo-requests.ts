import { Router } from "express";
import { adminFirestore } from "../services/tracker";

const router = Router();

// GET /api/demo-requests — list all demo requests (admin only)
router.get("/", async (_req, res) => {
  try {
    const snapshot = await adminFirestore
      .collection("demo_requests")
      .orderBy("createdAt", "desc")
      .get();

    const requests = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch demo requests", error: String(err) });
  }
});

// PUT /api/demo-requests/:id — update status/notes
router.put("/:id", async (req, res) => {
  try {
    const { status, adminNotes } = req.body;
    const update: Record<string, unknown> = { updatedAt: new Date() };

    if (status) update.status = status;
    if (adminNotes !== undefined) update.adminNotes = adminNotes;

    await adminFirestore.collection("demo_requests").doc(req.params.id).update(update);

    res.json({ message: "Demo request updated" });
  } catch (err) {
    res.status(500).json({ message: "Failed to update demo request", error: String(err) });
  }
});

// DELETE /api/demo-requests/:id — delete a demo request
router.delete("/:id", async (req, res) => {
  try {
    await adminFirestore.collection("demo_requests").doc(req.params.id).delete();
    res.json({ message: "Demo request deleted" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete demo request", error: String(err) });
  }
});

export default router;

// Public endpoint for website form submissions (no auth required)
export async function submitDemoRequest(data: {
  name: string;
  email: string;
  subject: string;
  message: string;
  phone?: string;
  company?: string;
  businessType?: string;
  shipmentVolume?: string;
  mcDot?: string;
  preferredTime?: string;
}) {
  await adminFirestore.collection("demo_requests").add({
    ...data,
    status: "new",
    adminNotes: "",
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}
