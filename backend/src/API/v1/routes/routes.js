import express from "express";
import User from "../models/models.js";

const router = express.Router();

import UserController from "../Controller/Controller.js";

function Router(app) {
  app.post("/api/auth/register", UserController.register);
  app.post("/api/auth/login", UserController.login);
  app.put("/api/auth/addInformation", UserController.addInformation);

  // GET: /api/users
  app.get("/", async (req, res) => {
    try {
      const users = await User.find();
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: " Lỗi server", error: error.message });
    }
  });
}

export default Router;
