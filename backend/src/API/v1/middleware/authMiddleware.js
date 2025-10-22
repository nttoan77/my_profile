import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import User from "../models/models.js";

dotenv.config();

// 🧩 Xác thực token
export default function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ message: "Bạn chưa đăng nhập" });
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "Thiếu token xác thực" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secretkey");
    req.user = decoded;
    next();
  } catch (err) {
    console.error("❌ Lỗi xác thực token:", err.message);
    return res
      .status(401)
      .json({ message: "Token không hợp lệ hoặc đã hết hạn" });
  }
}

// 🧩 Kiểm tra quyền admin
export const adminMiddleware = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    // ✅ Cho phép 5 user đầu tiên (id 1-5) có quyền admin
    if (!user && req.user.id <= 5) {
      return next();
    }

    if (!user) {
      return res.status(403).json({ message: "Không tìm thấy người dùng" });
    }

    if (user.role !== "admin") {
      return res.status(403).json({ message: "Không có quyền admin" });
    }
    next();
  } catch (error) {
    console.error("❌ Lỗi trong adminMiddleware:", error);
    res.status(500).json({ message: "Lỗi kiểm tra quyền admin" });
  }
};
