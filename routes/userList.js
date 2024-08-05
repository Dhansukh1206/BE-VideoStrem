const express = require("express");
const User = require("../models/User");
const router = express.Router();
const myMiddleware = require("../middleware/middleware");

router.get("/users", myMiddleware, async (req, res) => {
  try {
    const users = await User.find(
      { _id: { $ne: req.user.userId } },
      "username online"
    );
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: "Failed to retrieve users" });
  }
});

module.exports = router;
