import { NextFunction, Request, Response } from "express";
import { isDbConnected } from "../config/db.js";

export const requireDb = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!isDbConnected()) {
    res.status(503).json({
      message:
        "Database is temporarily unavailable. Please check your connection and try again.",
    });
    return;
  }

  next();
};
