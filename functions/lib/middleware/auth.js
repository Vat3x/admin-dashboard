"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyAdmin = verifyAdmin;
const tracker_1 = require("../services/tracker");
async function verifyAdmin(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
        res.status(401).json({ message: "Missing authorization header" });
        return;
    }
    const token = authHeader.split("Bearer ")[1];
    try {
        const decoded = await tracker_1.adminAuth.verifyIdToken(token);
        if (decoded.admin !== true) {
            res.status(403).json({ message: "Admin privileges required" });
            return;
        }
        // Attach user info to request
        req.uid = decoded.uid;
        next();
    }
    catch {
        res.status(401).json({ message: "Invalid or expired token" });
    }
}
//# sourceMappingURL=auth.js.map