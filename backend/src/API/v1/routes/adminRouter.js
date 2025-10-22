import express from "express";
import AdminController from "../Controller/AdminController.js";
import authMiddleware, { adminMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

// Lấy tất cả người dùng
router.get("/", AdminController.getAllUsersAdmin);

// Lấy chi tiết 1 người dùng
router.get("/:id", AdminController.getUserById);

// Tạo mới người dùng
router.post("/", AdminController.createUser);

// Cập nhật thông tin người dùng
router.put("/:id", AdminController.updateUser);

// // Xóa người dùng
router.delete("/:id", AdminController.deleteUser);

//  Khôi phục người dùng
router.patch("/restore/:id", AdminController.restoreUser);

// xóa người dùng vĩnh viễn
router.delete("/permanent/:id", AdminController.deleteUserPermanently);

router.get("/deleted", AdminController.getDeletedUsers);

//  Route phân quyền người dùng
router.put("/:id/role", authMiddleware, adminMiddleware, AdminController.updateUserRole);



export default router;
