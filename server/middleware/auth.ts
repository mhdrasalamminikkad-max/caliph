import { Request, Response, NextFunction } from "express";
import { storage } from "../storage";

// Extend Express Request to include currentUser
declare global {
  namespace Express {
    interface Request {
      currentUser?: {
        id: string;
        username: string;
        role: string;
      };
    }
  }
}

// Middleware to require admin role
export async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized: No token provided" });
  }

  const token = authHeader.substring(7);
  
  // For simplicity, using userId as the token (in production, use JWT)
  const user = await storage.getUser(token);
  
  if (!user) {
    return res.status(401).json({ message: "Unauthorized: Invalid token" });
  }

  if (user.role !== "admin") {
    return res.status(403).json({ message: "Forbidden: Admin access required" });
  }

  req.currentUser = {
    id: user.id,
    username: user.username,
    role: user.role,
  };

  next();
}

// Middleware to require authentication (any role)
export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized: No token provided" });
  }

  const token = authHeader.substring(7);
  
  // For simplicity, using userId as the token (in production, use JWT)
  const user = await storage.getUser(token);
  
  if (!user) {
    return res.status(401).json({ message: "Unauthorized: Invalid token" });
  }

  req.currentUser = {
    id: user.id,
    username: user.username,
    role: user.role,
  };

  next();
}
