import express from "express";
import { login, me, register, updateProfile } from "../controllers/authController.js";
import { protect } from "../middleware/auth.js";
import { requireDb } from "../middleware/dbHealth.js";

const router = express.Router();

router.post("/register", requireDb, register);
router.post("/login", requireDb, login);
router.get("/me", requireDb, protect, me);
router.put("/update-profile", requireDb, protect, updateProfile);

export default router;