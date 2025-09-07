import bcrypt from "bcrypt";
import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  name: String,
  nameUser: String,
  birdDay: String,
  gender: String,
  phone: { type: String, unique: true, required: true, sparse: true },
  email: { type: String, unique: true, required: true, sparse: true },
  password: { type: String, required: true },
  website: String,
  Address: String,
  careerGoals: String,
  education: String,
  About: String,
  workExperience: String,
  certificate: String,
  study: [
    {
      placeOfStudy: String,
      fieldOfStudy: String,
      studyTime: String,
    },
  ],
  skillsData: [
    {
      category: String,
      skills: [String],
    },
  ],
});

UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 6);
  next();
});

const User = mongoose.model("User", UserSchema);

export default User;
