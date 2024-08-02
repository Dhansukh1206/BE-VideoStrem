const express = require("express");
const fs = require("fs");
const router = express.Router();
const upload = require("../middleware/upload");
const path = require("path");

router.post("/upload", upload.single("video"), (req, res) => {
  if (!req.file) {
    return res.status(400).send("No file uploaded.");
  }
  res.status(200).json({ filePath: req.file.path });
});

router.get("/", (req, res) => {
  const uploadPath = path.join(__dirname, "../uploads/");
  fs.readdir(uploadPath, (err, files) => {
    if (err) {
      return res.status(500).send("Unable to scan files.");
    }
    const videoFiles = files.filter((file) => /\.(mp4|mkv|avi)$/i.test(file));
    res.status(200).json(
      videoFiles.map((file) => ({
        filePath: `http://localhost:8080/uploads/${file}`,
      }))
    );
  });
});

module.exports = router;
