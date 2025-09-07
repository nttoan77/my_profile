import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/models.js";

// const { mongooseToObject } = require("../../util/mongoose");

class Controller {
  // GET /api/users
  async getAllUsers(req, res) {
    try {
      const users = await User.find();
      res.json(users);
    } catch (err) {
      res.status(500).json({ message: "Lỗi server", error: err.message });
    }
  }

  // POST /api/users
  async createUser(req, res) {
    try {
      const user = new User(req.body);
      const saved = await user.save();
      res.status(201).json(saved);
    } catch (err) {
      res.status(400).json({ message: "Lỗi tạo user", error: err.message });
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

      console.log(user)

      res.status(201).json({ message: "Đăng ký thành công", user, token });
    } catch (error) {
      res.status(500).json({ message: "Lỗi server", error: error.message });
    }
  }

  // addInformation
  async addInformation(req,res){
    try {
      const { userId,nameUser, birdDay, website, gender, Address } = req.body;
      
      const user = await User.findById(userId);
      if(!user)return res.status(404).json({massage:"Người dùng không tồn tại!"})

      // update
      user.nameUser = nameUser || user.nameUser;
      user.birdDay = birdDay || user.birdDay;
      user.website = website || user.website;
      user.gender = gender || user.gender;
      user.Address = Address || user.Address;

        await user.save();
      res.status(200).json({ message: "Cập nhật thành công", user });
    } catch (error) {
      console.error(" Error addInformation:", error);
      res.status(500).json({ message: "Lỗi server", error: error.message });
    }
  }
}

export default new Controller();
