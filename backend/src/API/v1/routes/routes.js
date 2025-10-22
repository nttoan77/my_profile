import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import UserController from "../Controller/Controller.js"; 
import authMiddleware, { adminMiddleware } from "../middleware/authMiddleware.js";


const router = express.Router();

// 📁 Đảm bảo thư mục uploads tồn tại
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// ⚙️ Cấu hình multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) =>
    cb(null, `${Date.now()}${path.extname(file.originalname)}`),
});
const upload = multer({ storage });

/* ---------------------- 🧍 USER ROUTES ---------------------- */

// 🔐 Đăng ký & Đăng nhập
router.post("/register", UserController.register);
router.post("/login", UserController.login);

// 🔑 Quên mật khẩu / OTP / Đổi mật khẩu
router.post("/forgot", UserController.forgetPassword);
router.post("/verify-otp", UserController.verifyOtp);
router.post("/change-password", UserController.changePassword);

// 🧾 Cập nhật thông tin người dùng (có upload file)
router.put(
  "/regisInformation",
  upload.fields([
    { name: "avatar", maxCount: 1 },
    { name: "attachments", maxCount: 10 },
    { name: "certificates", maxCount: 10 },
  ]),
  UserController.regisAddInformation
);

router.put("/:id/role", authMiddleware, adminMiddleware, UserController.updateUserRole);


// 👤 Lấy thông tin 1 người dùng
router.get("/:userId", UserController.getUser);

export default router;
