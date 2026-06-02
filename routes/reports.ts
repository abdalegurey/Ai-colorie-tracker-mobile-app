import express from "express";
import { protect } from "../middleware/auth.js";
import { getDailyReports, getWeeklyReports } from "../controllers/reportsController.js";

const router = express.Router();

router.get('/daily',protect, getDailyReports);
 router.get('/weekly',protect, getWeeklyReports);
// router.get('/monthly',protect, getMonthlyReports);

export default router;