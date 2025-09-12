import express from "express";
import User from "../models/models.js";
import path from 'path';
import multer from 'multer';
import fs from "fs";

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
  app.post("/api/auth/forget",UserController.forgetPassword);
  app.post("/api/auth/verify-otp",UserController.verifyOtp);
  app.post("/api/auth/reset-Password",UserController.resetPassword)
  
  app.post("/api/auth/register", UserController.register);
  app.post("/api/auth/login", UserController.login);

  app.put("/api/auth/addInformation", upload.single("avatar"), UserController.addInformation);

  // admin
  app.get("/api/auth/Admin",UserController.getAllUsers);
  app.post("/api/auth/Admin",UserController.createUser);
  app.delete('/api/auth/Admin/:id',UserController.deleteUser);


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
