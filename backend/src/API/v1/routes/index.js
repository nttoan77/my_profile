import express from "express";
import userRoutes from "./routes.js"; // route cho user
import adminRoutes from "./adminRouter.js"; // route cho admin

const router = express.Router();

// Gom nhóm tất cả routes
router.use("/auth/Admin", adminRoutes); // /api/auth/Admin/...
router.use("/auth", userRoutes); // /api/auth/...

export default router;
