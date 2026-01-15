import "dotenv/config";
import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

export const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";

type AuthPayload = {
  userId: number;
  username: string;
};

declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

function readUser(req: Request): AuthPayload | null {
  const token = req.cookies?.auth;
  if (!token) return null;
  try {
    return jwt.verify(token, JWT_SECRET) as AuthPayload;
  } catch {
    return null;
  }
}

export function attachUser(req: Request, _res: Response, next: NextFunction) {
  const user = readUser(req);
  if (user) req.user = user;
  next();
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const user = readUser(req);
  if (!user) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  req.user = user;
  return next();
}
