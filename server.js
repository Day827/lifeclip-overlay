const express = require("express");
const ffmpeg = require("fluent-ffmpeg");
const fs = require("fs");
const path = require("path");
const axios = require("axios");

const app = express();
app.use(express.json({ limit: "200mb" }));

app.post("/overlay", async (req, res) => {
  try {
    const { video_url, caption } = req.body;

    if (!video_url || !caption) {
      return res.status(400).json({ error: "video_url and caption required" });
    }

    const inputPath = "/tmp/input.mp4";
    const outputPath = "/tmp/output.mp4";

    const video = await axios.get(video_url, { responseType: "arraybuffer" });
    fs.writeFileSync(inputPath, video.data);

    ffmpeg(inputPath)
      .videoFilters({
        filter: "drawtext",
        options: {
          fontfile: "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
          text: caption,
          fontsize: 48,
          fontcolor: "white",
          x: "(w-text_w)/2",
          y: "50",
          borderw: 3
        }
      })
      .output(outputPath)
      .on("end", () => {
        const buffer = fs.readFileSync(outputPath);
        res.setHeader("Content-Type", "video/mp4");
        res.send(buffer);
      })
      .on("error", (err) => {
        console.error(err);
        res.status(500).json({ error: "FFmpeg failed", details: err.message });
      })
      .run();

  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Server error", details: e.message });
  }
});

app.get("/", (req, res) => {
  res.send("LifeClip Overlay API running");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Overlay API live on port ${PORT}`));
