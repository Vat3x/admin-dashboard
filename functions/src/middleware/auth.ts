import { type Request, type Response, type NextFunction } from "express";
import { adminAuth } from "../services/tracker";

export async function verifyAdmin(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ message: "Missing authorization header" });
    return;
  }

  const token = authHeader.split("Bearer ")[1];

  try {
    const decoded = await adminAuth.verifyIdToken(token);

    if (decoded.admin !== true) {
      res.status(403).json({ message: "Admin privileges required" });
      return;
    }

    // Attach user info to request
    (req as Request & { uid: string }).uid = decoded.uid;
    next();
  } catch {
    res.status(401).json({ message: "Invalid or expired token" });
  }
}
