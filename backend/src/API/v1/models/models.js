import bcrypt from "bcrypt";
import mongoose from "mongoose";

// Nếu bạn muốn tự tăng userId thì cần Counter model
const CounterSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  seq: { type: Number, default: 0 },
});
const Counter = mongoose.model("Counter", CounterSchema);

const UserSchema = new mongoose.Schema(
  {
    // _id: { type: Number },
    userId: { type: Number, unique: true },
    name: String,
    avatar: String,
    nameUser: String,
    birthDay: { type: Date },
    gender: String,
    phone: { type: String, unique: true, required: true },
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    website: String,
    address: String,
    desireInWork: String,

    // save file
    attachments: [
      {
        filename: String,
        path: String,
        mimetype: String,
      },
    ],

    careerGoal: String,
    jobPosition: String,
    education: String,
    about: String,

    workExperiences: [
      {
        company: String,
        position: String,
        startDate: String,
        endDate: String,
        description: String,
        achievements: String,
      },
    ],

    certificate: [
      {
        name: String,
        organization: String,
        issueDate: String,
        expiryDate: String,
        file: {
          filename: String,
          url: String,
          mimetype: String,
          size: Number,
        },
      },
    ],

    study: [
      {
        school: { type: String },
        degree: String,
        fieldOfStudy: String,
        startDate: String,
        endDate: String,
        description: String,
        subjects: [String],
        achievements: [String],
      },
    ],

    skills: [
      {
        type: { type: String, default: "hard" }, // hard | soft
        name: { type: String },
        partials: [
          {
            name: { type: String },
          },
        ],
      },
    ],
    // ====== OTP để reset password ======
    resetPasswordOTP: {
      code: String,
      expiresAt: Date,
      verified: { type: Boolean, default: false },
    },
    tokenVersion: { type: Number, default: 0 },
  },
  {
    timestamps: true,
    // _id: false,
    toJSON: {
      transform(doc, ret) {
        if (ret.birthDay) {
          const date = new Date(ret.birthDay);
          const day = String(date.getDate()).padStart(2, "0");
          const month = String(date.getMonth() + 1).padStart(2, "0");
          const year = date.getFullYear();
          ret.birthDay = `${day}/${month}/${year}`;
        }
        return ret;
      },
    },
  }
);

UserSchema.pre("save", async function (next) {
  // Tự tăng userId
 
  if (this.isNew && !this.userId) {
    console.log("⚠️ [PRE-SAVE] Tạo userId mới vì isNew = true");
    const counter = await Counter.findOneAndUpdate(
      { name: "userId" },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );
    this.userId = counter.seq;
  }

  // Hash password
  if (this.isModified("password")) {
    console.log("🔑 [PRE-SAVE] Hash lại mật khẩu...");
    this.password = await bcrypt.hash(this.password, 6);
  }

  next();
});

const User = mongoose.model("User", UserSchema);

export default User;
