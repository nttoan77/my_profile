import bcrypt from "bcrypt";
import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    name: String,
    avatar:  {type: String} ,
    nameUser: String,
    birdDay: String,
    gender: String,
    phone: { type: String, unique: true, required: true, sparse: true },
    email: { type: String, unique: true, required: true, sparse: true },
    password: { type: String, required: true },
    website: String,
    Address: String,
    // save file
    attachments: [
      {
        filename: String,
        path: String,
        mimetype: String,
      },
    ],
    //
    createdAt: { type: Date, default: Date.now },
    //
    careerGoal: String,
    jobPosition: String,
    education: String,
    About: String,
    // Work Experience
    workExperiences: [
      {
        company: { type: String },
        position: { type: String },
        startDate: { type: Date },
        endDate: { type: Date },
        description: { type: String },
        achievements: { type: String },
      },
    ],
    // certificate
    certificate: [
      {
        name: String,
        organization: String,
        issueDate: Date,
        expiryDate: Date,
      },
    ],
    //  study
    study: [
      {
        placeOfStudy: String,
        fieldOfStudy: String,
        studyTime: String,
        startDate: Date,
        endDate: Date,
      },
    ],
    skillsData: [
      {
        category: String,
        skills: [String],
      },
    ],
  },
  {
    timestamps: true,
  }
);

UserSchema.pre("save", async function (next) {
  if (this.isNew) {
    const counter = await Counter.findOneAndUpdate(
      { name: "_id" },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );
    this.userId = counter.seq;
  }

  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 6);
  next();
});

const User = mongoose.model("User", UserSchema);

export default User;
