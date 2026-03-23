"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.submitDemoRequest = submitDemoRequest;
const express_1 = require("express");
const tracker_1 = require("../services/tracker");
const router = (0, express_1.Router)();
// GET /api/demo-requests — list all demo requests (admin only)
router.get("/", async (_req, res) => {
    try {
        const snapshot = await tracker_1.adminFirestore
            .collection("demo_requests")
            .orderBy("createdAt", "desc")
            .get();
        const requests = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        }));
        res.json(requests);
    }
    catch (err) {
        res.status(500).json({ message: "Failed to fetch demo requests", error: String(err) });
    }
});
// PUT /api/demo-requests/:id — update status/notes
router.put("/:id", async (req, res) => {
    try {
        const { status, adminNotes } = req.body;
        const update = { updatedAt: new Date() };
        if (status)
            update.status = status;
        if (adminNotes !== undefined)
            update.adminNotes = adminNotes;
        await tracker_1.adminFirestore.collection("demo_requests").doc(req.params.id).update(update);
        res.json({ message: "Demo request updated" });
    }
    catch (err) {
        res.status(500).json({ message: "Failed to update demo request", error: String(err) });
    }
});
// DELETE /api/demo-requests/:id — delete a demo request
router.delete("/:id", async (req, res) => {
    try {
        await tracker_1.adminFirestore.collection("demo_requests").doc(req.params.id).delete();
        res.json({ message: "Demo request deleted" });
    }
    catch (err) {
        res.status(500).json({ message: "Failed to delete demo request", error: String(err) });
    }
});
exports.default = router;
// Public endpoint for website form submissions (no auth required)
async function submitDemoRequest(data) {
    await tracker_1.adminFirestore.collection("demo_requests").add({
        ...data,
        status: "new",
        adminNotes: "",
        createdAt: new Date(),
        updatedAt: new Date(),
    });
}
//# sourceMappingURL=demo-requests.js.map