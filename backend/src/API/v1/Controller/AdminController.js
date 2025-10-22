import User from "../models/models.js";

class AdminController {
  // 🟩 Lấy tất cả người dùng
  async getAllUsersAdmin(req, res) {
    try {
      const includeDeleted = req.query.includeDeleted === "true"; // 🟩 Lấy giá trị từ query

      let users;
      if (includeDeleted) {
        // 🟩 Nếu includeDeleted=true => lấy tất cả
        users = await User.find().sort({ createdAt: -1 }).select("-password");
      } else {
        // 🟩 Mặc định chỉ lấy người dùng chưa bị xóa mềm
        users = await User.find({ isDeleted: false })
          .sort({ createdAt: -1 })
          .select("-password");
      }

      res.status(200).json(users);
    } catch (err) {
      res.status(500).json({
        message: "Lỗi server khi lấy danh sách người dùng",
        error: err.message,
      });
    }
  }

  // 🟦 Tạo người dùng mới (Admin thêm user)
  async createUser(req, res) {
    try {
      const { nameUser, email, phone, workPosition } = req.body;

      if (!email || !phone) {
        return res
          .status(400)
          .json({ message: "Thiếu email hoặc số điện thoại!" });
      }

      const existingUser = await User.findOne({ $or: [{ email }, { phone }] });
      if (existingUser) {
        return res.status(400).json({ message: "Email hoặc SĐT đã tồn tại!" });
      }

      const newUser = new User({
        nameUser,
        email,
        phone,
        workPosition,
        password: "123456",
        isProfileComplete: false,
        isDeleted: false,
      });

      await newUser.save();

      res.status(201).json({
        message: "Tạo người dùng thành công!",
        user: newUser,
      });
    } catch (error) {
      console.error("❌ [ERROR] createUser:", {
        message: error.message,
        name: error.name,
        stack: error.stack,
        code: error.code,
        errors: error.errors,
      });

      res.status(500).json({
        message: "Không thể thêm người dùng!",
        error: error.message,
      });
    }
  }

  // 🟦 Thay đổi vai trò người dùng (chỉ Admin mới có quyền)
  async updateUserRole(req, res) {
    try {
      const { id } = req.params; // id của người cần đổi quyền
      const { role } = req.body; // vai trò mới: 'admin' hoặc 'user'

      // 🧩 Kiểm tra role hợp lệ
      if (!["admin", "user"].includes(role)) {
        return res.status(400).json({ message: "Vai trò không hợp lệ!" });
      }

      // 🧩 Không cho admin tự đổi quyền chính mình
      if (req.user.id === id) {
        return res
          .status(403)
          .json({ message: "Bạn không thể tự thay đổi quyền của chính mình!" });
      }

      // 🧩 Cập nhật role
      const updatedUser = await User.findByIdAndUpdate(
        id,
        { role },
        { new: true }
      );

      if (!updatedUser) {
        return res.status(404).json({ message: "Không tìm thấy người dùng!" });
      }

      res.status(200).json({
        message: `Đã cập nhật vai trò của ${updatedUser.nameUser} thành ${role}`,
        user: updatedUser,
      });
    } catch (error) {
      console.error("❌ [ERROR] updateUserRole:", error);
      res.status(500).json({ message: "Lỗi server khi cập nhật vai trò!" });
    }
  }

  // 🟥 Xóa người dùng
  async deleteUser(req, res) {
    try {
      const deleted = await User.findByIdAndUpdate(
        req.params.id,
        { isDeleted: true },
        { new: true }
      );

      if (!deleted)
        return res.status(404).json({ message: "Không tìm thấy người dùng" });

      res
        .status(200)
        .json({ message: "Xóa mềm người dùng thành công", user: deleted });
    } catch (err) {
      res
        .status(400)
        .json({ message: "Lỗi khi xóa người dùng", error: err.message });
    }
  }

  // 🟨 Lấy 1 người dùng theo ID
  async getUserById(req, res) {
    try {
      const user = await User.findById(req.params.id).select("-password");
      if (!user)
        return res.status(404).json({ message: "Không tìm thấy người dùng" });
      res.status(200).json(user);
    } catch (err) {
      res
        .status(500)
        .json({ message: "Lỗi khi lấy người dùng", error: err.message });
    }
  }

  // 🟧 Cập nhật thông tin người dùng
  async updateUser(req, res) {
    try {
      const updated = await User.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
      });
      if (!updated)
        return res.status(404).json({ message: "Không tìm thấy người dùng" });
      res.status(200).json({ message: "Cập nhật thành công", user: updated });
    } catch (err) {
      res.status(400).json({ message: "Lỗi khi cập nhật", error: err.message });
    }
  }
  // 🟪 Khôi phục người dùng đã xóa mềm
  async restoreUser(req, res) {
    try {
      const restored = await User.findByIdAndUpdate(
        req.params.id,
        { isDeleted: false },
        { new: true }
      );

      if (!restored)
        return res
          .status(404)
          .json({ message: "Không tìm thấy người dùng để khôi phục" });

      res.status(200).json({
        message: "Khôi phục người dùng thành công",
        user: restored,
      });
    } catch (err) {
      res.status(400).json({
        message: "Lỗi khi khôi phục người dùng",
        error: err.message,
      });
    }
  }
  // 🟥 Xóa vĩnh viễn
  async deleteUserPermanently(req, res) {
    try {
      const deleted = await User.findByIdAndDelete(req.params.id);
      if (!deleted)
        return res.status(404).json({ message: "Không tìm thấy người dùng" });

      res.status(200).json({ message: "Xóa vĩnh viễn người dùng thành công" });
    } catch (err) {
      res
        .status(400)
        .json({ message: "Lỗi khi xóa vĩnh viễn", error: err.message });
    }
  }

  async getDeletedUsers(req, res) {
    try {
      const users = await User.find({ isDeleted: true })
        .sort({ deletedAt: -1 })
        .select("-password");
      res.status(200).json(users);
    } catch (err) {
      res.status(500).json({ message: "Lỗi khi lấy người dùng đã xóa" });
    }
  }
}

export default new AdminController();
