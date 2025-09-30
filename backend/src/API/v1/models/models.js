import bcrypt from "bcrypt";
import mongoose from "mongoose";

// Nếu bạn muốn tự tăng userId thì cần Counter model
const CounterSchema = new mongoose.Schema({
  name: { type: String, required: true },
  seq: { type: Number, default: 0 },
});
const Counter = mongoose.model("Counter", CounterSchema);

const UserSchema = new mongoose.Schema(
  {
    userId: { type: Number, unique: true }, 
    name: String,
    avatar: String,
    nameUser: String,
    birthDay: {type: Date}, 
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
          path: String,
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
        type: { type: String, default: 'hard' },  // hard | soft
        name: { type: String, },
        partials: [
          {
            name: { type: String },
            level: { type: String },
          },
        ],
      },
    ],
    
  },
  { timestamps: true }
);

UserSchema.pre("save", async function (next) {
  // Tự tăng userId
  if (this.isNew) {
    const counter = await Counter.findOneAndUpdate(
      { name: "userId" },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );
    this.userId = counter.seq;
  }

  // Hash password
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 10); 
  }

  next();
});

const User = mongoose.model("User", UserSchema);

export default User;
