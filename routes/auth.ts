
import express from "express";
import { login, me, register } from "../controllers/authController.js";
import { protect } from "../middleware/auth.js";
// import { login, me, register, updateProfile } from "../controller/authController.js";
// import { protect } from "../middleware/auth.js";

const router = express.Router();

router.post('/register', register);
 router.post('/login', login);
 router.get('/me', protect, me);
// router.put('/update-profile', protect, updateProfile);

export default router;