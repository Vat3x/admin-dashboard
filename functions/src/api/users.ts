import { Router } from "express";
import { getTrackerFirestore, getTrackerAuth } from "../services/tracker";
import { getSupabase } from "../services/supabase";

const router = Router();

// GET /api/users — list all users across products
router.get("/", async (req, res) => {
  try {
    const product = req.query.product as string | undefined;
    const role = req.query.role as string | undefined;

    const users: Record<string, unknown>[] = [];

    // Fetch Tracker users
    if (!product || product === "tracker") {
      try {
        let query = getTrackerFirestore().collection("users") as FirebaseFirestore.Query;
        if (role) {
          query = query.where("role", "==", role);
        }
        const snapshot = await query.get();
        snapshot.docs.forEach((doc) => {
          users.push({ id: doc.id, product: "Tracker", ...doc.data() });
        });
      } catch (err) {
        console.error("Tracker users error:", err);
      }
    }

    // Fetch 3D Planning users from Supabase
    if (!product || product === "3d-planning") {
      try {
        const { data, error } = await getSupabase()
          .from("profiles")
          .select("*");

        if (!error && data) {
          data.forEach((profile) => {
            users.push({
              id: profile.id,
              product: "3D Planning",
              email: profile.email,
              displayName: profile.display_name,
              role: "user",
              plan: profile.plan,
              ...profile,
            });
          });
        }
      } catch (err) {
        console.error("Supabase users error:", err);
      }
    }

    res.json(users);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch users", error: String(err) });
  }
});

// POST /api/users/:id/block — disable a Tracker user in Firebase Auth
router.post("/:id/block", async (req, res) => {
  try {
    await getTrackerAuth().updateUser(req.params.id, { disabled: true });
    res.json({ message: "User blocked" });
  } catch (err) {
    res.status(500).json({ message: "Failed to block user", error: String(err) });
  }
});

// POST /api/users/:id/unblock — enable a Tracker user in Firebase Auth
router.post("/:id/unblock", async (req, res) => {
  try {
    await getTrackerAuth().updateUser(req.params.id, { disabled: false });
    res.json({ message: "User unblocked" });
  } catch (err) {
    res.status(500).json({ message: "Failed to unblock user", error: String(err) });
  }
});

// POST /api/users/:id/role — change a Tracker user's role
router.post("/:id/role", async (req, res) => {
  try {
    const { role } = req.body;
    if (!role) {
      res.status(400).json({ message: "Role is required" });
      return;
    }
    await getTrackerFirestore().collection("users").doc(req.params.id).update({ role });
    res.json({ message: `Role changed to ${role}` });
  } catch (err) {
    res.status(500).json({ message: "Failed to change role", error: String(err) });
  }
});

// DELETE /api/users/:id — delete a Tracker user from Auth and Firestore
router.delete("/:id", async (req, res) => {
  try {
    const userId = req.params.id;

    // Delete from Firebase Auth
    try {
      await getTrackerAuth().deleteUser(userId);
    } catch (err) {
      console.error("Auth delete error (may not exist):", err);
    }

    // Delete from Firestore
    await getTrackerFirestore().collection("users").doc(userId).delete();

    res.json({ message: "User deleted" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete user", error: String(err) });
  }
});

export default router;
