import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/models.js";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import transporter from "../../../util/mailer.js";
import mongoose from "mongoose";

dotenv.config();

// const { mongooseToObject } = require("../../util/mongoose");

let otpStore = {};

class Controller {
  // Get /api/auth/user

  async getUser(req, res) {
    try {
      const { userId } = req.params;

      // Không ép kiểu nữa
      const user = await User.findOne({ userId });

      if (!user) {
        return res.status(404).json({ message: "Không tìm thấy người dùng!" });
      }

      const formatDateVN = (date) => {
        if (!date) return null;
        const d = new Date(date);
        const day = String(d.getDate()).padStart(2, "0");
        const month = String(d.getMonth() + 1).padStart(2, "0");
        const year = d.getFullYear();
        return `${day}/${month}/${year}`;
      };

      const userObj = user.toObject();
      userObj.birthDay = formatDateVN(userObj.birthDay);

      res.status(200).json(userObj);
    } catch (error) {
      res.status(500).json({ message: "Lỗi server" });
    }
  }

  //create /api/users
 // Controller/UserController.js

async createUser(req, res) {
  try {
    const { nameUser, email, phone, password, role } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Thiếu email hoặc mật khẩu!" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email đã tồn tại!" });
    }

    // 🔢 Lấy userId kế tiếp (tự tăng)
    const lastUser = await User.findOne().sort({ userId: -1 }).limit(1);
    const nextUserId = lastUser ? lastUser.userId + 1 : 1;

    // ✅ Nếu userId trong khoảng 1 → 5 thì là admin
    const assignedRole =
      nextUserId >= 1 && nextUserId <= 5 ? "admin" : role || "user";

    const newUser = new User({
      userId: nextUserId,
      nameUser,
      email,
      phone,
      password,
      role: assignedRole,
      isProfileComplete: false,
    });

    await newUser.save();

    res.status(201).json({
      message: "Đăng ký thành công!",
      user: newUser,
    });
  } catch (error) {
    res.status(500).json({
      message: "Lỗi server khi đăng ký tài khoản!",
      error: error.message,
    });
  }
}


  // delete /api/users
  async deleteUser(req, res) {
    try {
      const user = await User.findByIdAndDelete(req.params.id);

      if (!user) {
        return res.status(404).json({ message: "Không tìm thấy User" });
      }

      res.status(200).json({ message: "Xóa thành công!" });
    } catch (error) {
      console.error("❌ Lỗi khi xóa user:", error);
      res
        .status(500)
        .json({ message: "Lỗi không thể xóa!", error: error.message });
    }
  }

  // login
  async login(req, res) {
    try {
      const { identifier, email, password } = req.body;

      const loginKey = identifier || email;

      const user = await User.findOne({
        $or: [{ email: loginKey }, { phone: loginKey }],
      });

      if (!user)
        return res.status(404).json({ message: "Người dùng không tồn tại!" });

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch)
        return res.status(400).json({ message: "Mật khẩu không đúng!" });

      // Tính isProfileComplete dựa trên dữ liệu thực
      const profileFields = ["nameUser", "birthDay", "workPosition"];
      const isCompleteData = profileFields.every((f) => !!user[f]);
      user.isProfileComplete = isCompleteData; // ✅ update trước khi trả về

      const token = jwt.sign(
        { id: user._id, email: user.email, role: user.role },
        process.env.JWT_SECRET || "secretkey",
        { expiresIn: "1d" }
      );

      return res.status(200).json({
        message: "Đăng nhập thành công!",
        token,
        user: {
          userId: user.userId,
          nameUser: user.nameUser,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone,
          avatar: user.avatar,
          isProfileComplete: user.isProfileComplete,
          birthDay: user.birthDay,
          workPosition: user.workPosition,
        },
      });
    } catch (error) {
      return res.status(500).json({ message: "Lỗi server khi đăng nhập!" });
    }
  }

  async forgetPassword(req, res) {
    try {
      const { email } = req.body;

      // Kiểm tra người dùng tồn tại trong MongoDB
      const user = await User.findOne({ email });
      if (!user) {
        console.log("Không tìm thấy email:", email);
        return res
          .status(404)
          .json({ message: "Email không tồn tại trong hệ thống" });
      }

      // Tạo mã OTP ngẫu nhiên 6 chữ số
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

      // Lưu OTP vào user (có thời hạn 5 phút)
      user.resetPasswordOTP = {
        code: otpCode,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
        verified: false,
      };
      await user.save();

      // Gửi email
      await transporter.sendMail({
        from: `"Hỗ trợ hệ thống" <${process.env.GMAIL_USER}>`,
        to: email,
        subject: "Mã OTP đặt lại mật khẩu",
        text: `Xin chào ${
          user.name || ""
        },\n\nMã OTP của bạn là: ${otpCode}\nMã này sẽ hết hạn sau 5 phút.\n\nTrân trọng.`,
      });

      // console.log(`✅ OTP đã gửi tới email: ${email}`);
      return res
        .status(200)
        .json({ message: "OTP đã được gửi về email của bạn" });
    } catch (err) {
      console.error("❌ Lỗi gửi OTP:", err);
      return res.status(500).json({ message: "Lỗi server khi gửi OTP" });
    }
  }

  // ========== 2️⃣ XÁC MINH OTP ==========
  async verifyOtp(req, res) {
    try {
      const { email, otp } = req.body;
      const user = await User.findOne({ email });

      if (!user || !user.resetPasswordOTP)
        return res.status(400).json({ message: "Không tìm thấy mã OTP" });

      const { code, expiresAt } = user.resetPasswordOTP;

      if (new Date() > expiresAt) {
        user.resetPasswordOTP = undefined;
        await user.save();
        return res.status(400).json({ message: "Mã OTP đã hết hạn" });
      }

      if (otp !== code)
        return res.status(400).json({ message: "Mã OTP không đúng" });

      // Đánh dấu đã xác minh
      user.resetPasswordOTP.verified = true;
      await user.save();

      // Tạo token reset password (hết hạn sau 10 phút)
      const token = jwt.sign({ email }, process.env.JWT_SECRET, {
        expiresIn: "10m",
      });

      return res.json({
        message: "Xác minh OTP thành công",
        token,
      });
    } catch (err) {
      console.error("Lỗi xác minh OTP:", err);
      return res.status(500).json({ message: "Lỗi xác minh OTP" });
    }
  }

  // ========== 3️⃣ ĐẶT LẠI MẬT KHẨU ==========
  async resetPassword(req, res) {
    try {
      const { email, newPassword } = req.body;
      const user = await User.findOne({ email });

      if (!user)
        return res.status(404).json({ message: "Người dùng không tồn tại" });

      if (!user.resetPasswordOTP?.verified)
        return res.status(400).json({ message: "OTP chưa được xác minh" });

      // Hash mật khẩu mới
      const hashedPassword = await bcrypt.hash(newPassword, 6);

      // ✅ Cập nhật mật khẩu & xoá OTP bằng updateOne để tránh tạo user mới
      await User.updateOne(
        { email },
        {
          $set: {
            password: hashedPassword,
            resetPasswordOTP: undefined,
          },
        }
      );

      return res.json({ message: "Đặt lại mật khẩu thành công" });
    } catch (err) {
      console.error("Lỗi đặt lại mật khẩu:", err);
      return res.status(500).json({ message: "Lỗi đặt lại mật khẩu" });
    }
  }

  // change password
  async changePassword(req, res) {
    try {
      const { email, newPassword } = req.body;

      // Kiểm tra dữ liệu đầu vào
      if (!email || !newPassword) {
        return res
          .status(400)
          .json({ message: "Thiếu email hoặc mật khẩu mới!" });
      }

      // Tìm user theo email
      const user = await User.findOne({ email });
      if (!user) {
        return res
          .status(404)
          .json({ message: "Không tìm thấy người dùng với email này!" });
      }

      // Cập nhật mật khẩu
      const hashedPassword = await bcrypt.hash(newPassword, 6);

      // Xóa OTP cũ (nếu có)

      // ✅ Update trực tiếp
      await User.updateOne(
        { email },
        {
          $set: {
            password: hashedPassword,
            resetPasswordOTP: undefined,
            tokenVersion: (user.tokenVersion || 0) + 1,
          },
        }
      );

      return res.status(200).json({ message: "Đặt lại mật khẩu thành công!" });
    } catch (error) {
      console.error("Lỗi khi đổi mật khẩu:", error);
      return res.status(500).json({ message: "Lỗi server khi đổi mật khẩu!" });
    }
  }

  // ==================^=====================

  // register
  async register(req, res) {
    try {
      const { email, password, name, phone, configPassword } = req.body;

      // Kiểm tra mật khẩu nhập lại
      if (password !== configPassword) {
        return res
          .status(400)
          .json({ message: "Mật khẩu nhập lại không khớp" });
      }

      //  Kiểm tra email tồn tại
      const existEmail = await User.findOne({ email });
      if (existEmail)
        return res.status(400).json({ message: "Email đã tồn tại" });

      //  Kiểm tra số điện thoại tồn tại
      const existPhone = await User.findOne({ phone });
      if (existPhone)
        return res.status(400).json({ message: "Số điện thoại đã tồn tại" });

      // Hash password
      // const hashedPassword = await bcrypt.hash(password, 6);
      // Tạo user mới
      const user = new User({
        email,
        password,
        name,
        phone,
        isProfileComplete: false,
      });

      await user.save();

      //  create token
      const token = jwt.sign(
        { id: user._id, email: user.email },
        process.env.JWT_SECRET || "secretkey",
        { expiresIn: "1d" }
      );

      // console.log(user);

      res.status(201).json({ message: "Đăng ký thành công", user, token });
    } catch (error) {
      console.error("Register Error:", error);
      res.status(500).json({ message: "Lỗi server", error: error.message });
    }
  }

  // regisAddInformation
  async regisAddInformation(req, res) {
    try {
      const {
        userId,
        nameUser,
        birthDay,
        website,
        gender,
        address,
        careerGoal,
        workPosition,
        desireInWork,
        action = "replace",
      } = req.body;

      let skills = [];
      let study = [];
      let certificatesMeta;

      // sử lý date
      const parseDate = (str) => {
        if (!str) return null;
        const [day, month, year] = str.split("/");
        const d = new Date(`${year}-${month}-${day}`);
        return isNaN(d) ? null : d;
      };

      // 🟢 parse mảng workExperiences
      let workExperiences = [];
      if (req.body.workExperiences) {
        try {
          workExperiences = JSON.parse(req.body.workExperiences);
        } catch (err) {
          console.error("Parse workExperiences lỗi:", err);
        }
      }

      // 🟢 parse skills

      if (req.body.skills) {
        try {
          skills = JSON.parse(req.body.skills);
        } catch (err) {
          console.error("Parse skills lỗi:", err);
        }
      }

      // 🟢 parse education

      if (req.body.study) {
        try {
          study = JSON.parse(req.body.study);
        } catch (err) {
          console.error("Parse study lỗi:", err);
        }
      }

      // 🟢 parse certificates metadata (nếu có)
      if (req.body.certificates) {
        try {
          certificatesMeta = JSON.parse(req.body.certificates);
        } catch (err) {
          console.error("Parse certificates lỗi:", err);
        }
      }

      const user = await User.findOne({ userId: userId });

      if (!user)
        return res.status(404).json({ massage: "Người dùng không tồn tại!" });

      // --------------------------------
      // update thông tin cơ bản
      user.nameUser = nameUser || user.nameUser;
      // user.birthDay = birthDay || user.birthDay;
      user.website = website || user.website;
      user.gender = gender || user.gender;
      user.address = address || user.address;
      user.workPosition = workPosition || user.workPosition;
      user.careerGoal = careerGoal || user.careerGoal;
      user.desireInWork = desireInWork || user.desireInWork;
      if (birthDay) {
        user.birthDay = parseDate(birthDay);
      }

      // -----------------------------------------

      // ✅ avatar (1 file)
      // ✅ Avatar (1 ảnh)
      if (req.files && req.files.avatar && req.files.avatar.length > 0) {
        const avatarFile = req.files.avatar[0];
        user.avatar = `${req.protocol}://${req.get("host")}/uploads/${
          avatarFile.filename
        }`;
      }

      // ✅ Certificates (nhiều file ảnh chứng chỉ)
      if (
        req.files &&
        req.files.certificates &&
        req.files.certificates.length > 0
      ) {
        const newCertificates = req.files.certificates.map((file) => ({
          file: {
            filename: file.originalname,
            url: `${req.protocol}://${req.get("host")}/uploads/${
              file.filename
            }`, // ✅ URL public
            mimetype: file.mimetype,
            size: file.size,
          },
        }));

        if (action === "append") {
          user.certificate = [...(user.certificate || []), ...newCertificates];
        } else {
          user.certificate = newCertificates;
        }
      }

      // ✅ workExperiences
      if (workExperiences && workExperiences.length > 0) {
        const arr = Array.isArray(workExperiences)
          ? workExperiences
          : [workExperiences];

        const normalized = arr.map((exp) => ({
          company: exp.company,
          position: exp.position,
          startDate: exp.startDate || "",
          endDate: exp.endDate || "",
          description: exp.description || "",
          achievements: exp.achievements || "",
        }));

        if (normalized.length > 0) {
          if (action === "append" || !action) {
            user.workExperiences.push(...normalized);
          } else {
            user.workExperiences = normalized;
          }
        }
      }

      // ✅ skills

      if (req.body.skills) {
        let skills = [];
        try {
          skills = JSON.parse(req.body.skills);
        } catch (err) {
          console.error("Parse skills lỗi:", err);
        }

        if (Array.isArray(skills) && skills.length > 0) {
          const normalized = skills.map((s) => ({
            type: s.type || "hard",
            name: s.name || "",
            partials: Array.isArray(s.partials)
              ? s.partials.map((p) => ({
                  name: p.name || "",
                  level: p.level || "",
                }))
              : [],
          }));

          if (action === "append") {
            user.skills.push(...normalized);
          } else {
            user.skills = normalized;
          }
        }
      }

      // ✅ study (education)
      if (study && study.length > 0) {
        const arr = Array.isArray(study) ? study : [study];

        const normalized = arr.map((edu) => ({
          school: edu.school || "",
          degree: edu.degree || "",
          fieldOfStudy: edu.fieldOfStudy || "",
          startDate: edu.startDate || "",
          endDate: edu.endDate || "",
          description: edu.description || "",
          subjects: Array.isArray(edu.subjects) ? edu.subjects : [],
          achievements: Array.isArray(edu.achievements) ? edu.achievements : [],
        }));

        if (action === "append") {
          user.study.push(...normalized);
        } else {
          user.study = normalized;
        }
      }
      // ✅ Tính isProfileComplete dựa trên dữ liệu thực
      const profileFields = ["nameUser", "birthDay", "workPosition"];
      const isCompleteData = profileFields.every((f) => !!user[f]);
      user.isProfileComplete = isCompleteData;
      await user.save();
      res.status(200).json({ message: "Cập nhật thành công", user });
    } catch (error) {
      res.status(500).json({ message: "Lỗi server", error: error.message });
      console.error("🔥 Lỗi khi cập nhật thông tin:", error);
    }
  }

  // PUT /api/users/:id/role
async updateUserRole(req, res) {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!["user", "admin"].includes(role)) {
      return res.status(400).json({ message: "Vai trò không hợp lệ!" });
    }

    const user = await User.findByIdAndUpdate(
      id,
      { role },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy người dùng!" });
    }

    res.status(200).json({ message: "Cập nhật quyền thành công!", user });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server khi cập nhật quyền!" });
  }
}

}

export default new Controller();
