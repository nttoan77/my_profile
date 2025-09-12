import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/models.js";

// const { mongooseToObject } = require("../../util/mongoose");

let otpStore = {};

class Controller {
  // ADMIN
  // GET /api/users
  async getAllUsers(req, res) {
    try {
      User.findOne({}).sort({ _id: "desc" });

      const users = await User.find().sort({ createdAt: -1 });

      res.status(200).json(users);
    } catch (err) {
      res.status(500).json({ message: "Lỗi server", error: err.message });
    }
  }

  //create /api/users
  async createUser(req, res) {
    try {
      const newUser = new User(req.body);
      await newUser.save();
      res.status(200).json(newUser);
    } catch (error) {
      res
        .status(500)
        .json({ message: "Lỗi khi tạo user", error: error.massage });
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
      const { identifier, password } = req.body;
      // search user email
      const user = await User.findOne({
        $or: [{ email: identifier }, { phone: identifier }],
      });
      if (!user) {
        return res.status(404).json({ message: "Người dùng không tồn tại!" });
      }

      // compare birth password
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch)
        return res.status(400).json({ message: "Mật khẩu không tồn tại!" });

      // create token

      // const header = {
      //   alg:"HS256",
      //   typ:"JWT",
      // };
      // const payload = {
      //   sub: user.id,
      //   exp: Date.now + 3600000,
      // }
      // const  encodeHeader = btoa(JSON.stringify(header));
      // const encodePayload = btoa(JSON.stringify(payload));

      // const tokenData = `${encodeHeader}.${encodePayload}`;
      // const hmac = crypto.createHmac()

      // end

      //  create token
      const token = jwt.sign(
        { id: user._id, email: user.email },
        process.env.JWT_SECRET || "secretkey",
        { expiresIn: "1d" }
      );

      res.json({ message: "Đăng nhập thành công", token, user });
    } catch (error) {
      res.status(500).json({ message: "Lỗi sever", error: error.message });
    }
  }

  // forget password
  async forgetPassword(req, res) {
    try {
      const { email, phone } = req.body;

      //search user
      const user = await User.findOne({ $or: [{ email }, { phone }] });
      if (!user)
        return res.status(404).json({ message: "Không tìm thấy tài khoản!" });

      // create OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();

      // saver otp
      otpStore[user._id] = { otp, expires: Date.now() + 5 * 60 * 1000 };

      //send otp
      if (email) {
        const transporter = nodemailer.createTransport({
          service: "gmail",
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
          },
        });
        await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: user.email,
          subject: "Mã OTP khôi phục mật khẩu",
          text: `Mã OTP của bạn là: ${otp}`,
        });
      }
      res.json({ message: "Mã OTP đã được gửi đến email/số điện thoại." });
    } catch (error) {
      res.status(500).json({ message: "Lỗi serve", error: error.message });
    }
  }

  // verifyOtp
  async verifyOtp(req, res) {
    const { userId, otp } = req.body;

    if (!otpStore[userId])
      return res
        .status(400)
        .json({ message: "OTP không tồn tại hoặc đã hết hạn" });

    const { otp: storedOtp, expires } = otpStore[userId];

    if (Date.now() > expires)
      return res.status(400).json({ message: "OTP đã hết hạn" });
    if (otp !== storedOtp)
      return res.status(400).json({ message: "OTP không đúng" });

    // Tạo token cho phép reset password
    const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
      expiresIn: "10m",
    });

    res.json({ message: "Xác minh thành công", token });
  }

  // reset password
  async resetPassword(req, res) {
    try {
      const { token, newPassword } = req.body;

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId);

      if (!user)
        return res.status(404).json({ message: "Người dùng không tồn tại" });

      user.password = await bcrypt.hash(newPassword, 10);
      await user.save();

      delete otpStore[user._id]; // Xóa OTP cũ

      res.json({ message: "Đặt lại mật khẩu thành công" });
    } catch (error) {
      res.status(500).json({ message: "Lỗi server", error: error.message });
    }
  }

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
      });

      await user.save();

      //  create token
      const token = jwt.sign(
        { id: user._id, email: user.email },
        process.env.JWT_SECRET || "secretkey",
        { expiresIn: "1d" }
      );

      console.log(user);

      res.status(201).json({ message: "Đăng ký thành công", user, token });
    } catch (error) {
      res.status(500).json({ message: "Lỗi server", error: error.message });
    }
  }

  // addInformation
  async addInformation(req, res) {
    try {
      const {
        userId,
        nameUser,
        birdDay,
        website,
        gender,
        Address,
        careerGoal,
        action = "replace",
      } = req.body;

      // 🟢 parse mảng workExperiences (từ FormData -> string)
      let workExperiences = [];
      if (req.body.workExperiences) {
        try {
          workExperiences = JSON.parse(req.body.workExperiences);
        } catch (err) {
          console.error("Parse workExperiences lỗi:", err);
        }
      }

      const user = await User.findById(userId);
      if (!user)
        return res.status(404).json({ massage: "Người dùng không tồn tại!" });

      // update
      user.nameUser = nameUser || user.nameUser;
      user.birdDay = birdDay || user.birdDay;
      user.website = website || user.website;
      user.gender = gender || user.gender;
      user.Address = Address || user.Address;
      user.careerGoal = careerGoal || user.careerGoal;

      // upload avatar (1 file)
      if (req.file) {
        user.avatar = req.file.path; // đường dẫn file ảnh
      }

      // ✅ upload nhiều file (nếu có)
      if (req.files && req.files.length > 0) {
        // Ví dụ bạn lưu tất cả file vào mảng user.attachments
        const newFiles = req.files.map((file) => ({
          filename: file.originalname,
          path: file.path,
          mimetype: file.mimetype,
        }));

        if (action === "append") {
          user.attachments = [...(user.attachments || []), ...newFiles];
        } else {
          user.attachments = newFiles;
        }
      }

      // object information
      if (workExperiences && workExperiences.length > 0) {
        // isArray
        const arr = Array.isArray(workExperiences)
          ? workExperiences
          : [workExperiences];

        // chuẩn hóa field ngày tháng
        const normalized = arr.map((exp) => ({
          company: exp.company,
          position: exp.position,
          startDate: exp.startDate ? new Date(exp.startDate) : null,
          endDate: exp.endDate ? new Date(exp.endDate) : null,
          description: exp.description,
          achievements: exp.achievements,
        }));

        if (action === "append") {
          user.workExperiences.push(...normalized);
        } else {
          user.workExperiences = normalized;
        }
      }

      await user.save();
      res.status(200).json({ message: "Cập nhật thành công", user });
    } catch (error) {
      console.error(" Error addInformation:", error);
      res.status(500).json({ message: "Lỗi server", error: error.message });
    }
  }
}

export default new Controller();
