import express from "express";
import User from "../models/models.js";
import path from "path";
import multer from "multer";
import fs from "fs";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

import UserController from "../Controller/Controller.js";

// ✅ Đảm bảo thư mục uploads tồn tại
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// ✅ Cấu hình multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir); // luôn lưu trong thư mục uploads
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

function Router(app) {
  // get model
  app.get("/api/auth/:userId", UserController.getUser);

  // post model
  app.post("/api/auth/forgot", UserController.forgetPassword);
  // app.post("/api/auth/change-password", UserController.resetPassword);
  app.post("/api/auth/change-password", UserController.changePassword);
  app.post("/api/auth/verify-otp", UserController.verifyOtp);



  app.post("/api/auth/register", UserController.register);
  app.post("/api/auth/login", UserController.login);


  // put model
  app.put(
    "/api/auth/regisInformation",
    upload.fields([
      { name: "avatar", maxCount: 1 },
      { name: "attachments", maxCount: 10 },
      { name: "certificates", maxCount: 10 },
    ]),
    UserController.regisAddInformation
  );

  // admin
  app.get("/api/auth/Admin", UserController.getAllUsersAdmin);
  app.post("/api/auth/Admin", UserController.createUser);
  app.delete("/api/auth/Admin/:id", UserController.deleteUser);

  // GET: /api/users
  // app.get("/", async (req, res) => {
  //   try {
  //     const users = await User.find();
  //     res.json(users);
  //   } catch (error) {
  //     res.status(500).json({ message: " Lỗi server", error: error.message });
  //   }
  // });
}

export default Router;
