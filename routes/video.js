const express = require("express");
const fs = require("fs");
const router = express.Router();
const upload = require("../middleware/upload");
const myMiddleware = require("../middleware/middleware");
const path = require("path");

router.post("/upload", upload.single("video"), (req, res) => {
  if (!req.file) {
    return res.status(400).send("No file uploaded.");
  }
  res.status(200).json({ filePath: req.file.path });
});

router.get("/videos", myMiddleware, (req, res) => {
  const uploadPath = path.join(__dirname, "../uploads/");
  fs.readdir(uploadPath, (err, files) => {
    if (err) {
      return res.status(500).send("Unable to scan files.");
    }
    const videoFiles = files.filter((file) => /\.(mp4|mkv|avi)$/i.test(file));
    res.status(200).json(
      videoFiles.map((file) => ({
        filePath: `https://desolate-eyrie-13966-6cda0935eea4.herokuapp.com/uploads/${file}`,
      }))
    );
  });
});

module.exports = router;
