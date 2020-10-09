const express = require("express");
const app = express();
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const axios = require("axios");
const urlJoin = require("url-join");

async function downloadImage(url, filename) {
  // axios image download with response type "stream"
  const response = await axios({
    method: "GET",
    url: url,
    responseType: "stream",
  });

  response.data.pipe(fs.createWriteStream(filename));

  return new Promise((resolve, reject) => {
    response.data.on("end", () => {
      resolve();
    });

    response.data.on("error", () => {
      reject();
    });
  });
}

app.use(async (req, res) => {
  const hash = crypto.createHash("sha256").update(req.path).digest("hex");

  const info = path.parse(req.path);

  const filename = path.resolve(__dirname, "image", hash + info.ext);

  try {
    await fs.promises.stat(filename);
    res.set('Cache-control', 'public, max-age=604800')
    return res.sendFile(filename);
  } catch (e) {}

  try {
    const cloudinaryUrl = urlJoin(
      "https://res.cloudinary.com/stuyactivities/",
      req.path
    );

    await downloadImage(cloudinaryUrl, filename);
    res.set('Cache-control', 'public, max-age=604800')
    return res.sendFile(filename);
  } catch (e) {}

  res.status(404).send("That image could not be found");
});

const port = Number(process.env.PORT) || 3002;

app.listen(port, () => {
  console.log("Listening on port ", port);
});
