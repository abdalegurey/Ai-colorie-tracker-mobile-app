import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import User, { IUser } from "../models/User.js";
import { getDatabaseErrorMessage, isDatabaseError } from "../utils/errors.js";


// extend the request interface to include the user object

declare global {
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}

export const protect = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  let token: string | undefined;

  // check if token is in the headers

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    // Bearer i3476378643786438746ksdgsgdjhs

    try {
      token = req.headers.authorization.split(" ")[1];

      if (!token) {
        res.status(401).json({ message: "Unauthorized , no token provided" });
        return;
      }

      // verify token

      const decoded = jwt.verify(token, process.env.JWT_SECRET || "") as {
        id: string;
      };

      //   get user from database
      const users = await User.findById(decoded.id).select("-password");

      if (!users) {
        res.status(401).json({ message: "Unauthorized , invalid token" });
        return;
      }

      req.user = users;
      next();

    } catch (error) {
        if (isDatabaseError(error)) {
          res.status(503).json({ message: getDatabaseErrorMessage() });
          return;
        }

        console.error("Error verifying token:", error);
        res.status(401).json({ message: "Unauthorized, invalid or expired token" });
        return;
    }
  }else{
    res.status(401).json({ message: "Unauthorized , no token provided" });
    return
  }
};