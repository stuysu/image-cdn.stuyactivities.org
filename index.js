const express = require("express");
const app = express();
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const axios = require("axios");
const urlJoin = require("url-join");
const minio = require("minio");

const client = new minio.Client({
  endPoint: process.env.MINIO_ENDPOINT,
  port: process.env.MINIO_PORT,
  useSSL: process.env.MINIO_USE_SSL,
  accessKey: process.env.MINIO_ACCESS_KEY,
  secretKey: process.env.MINIO_SECRET_KEY,
});

const images = {};
function downloadImage(url, filename) {
  return new Promise(async (resolve) => {
    // axios image download with response type "stream"
    const response = await axios({
      method: "GET",
      url: url,
      responseType: "stream",
    });

    client.putObject(
      "stuyactivities",
      filename,
      response.data,
      response.headers,
      (er) => {
        if (er) {
          console.log(er);
          throw er;
        }
        resolve();
      }
    );
  });
}

const objectSet = new Set();

const stream = client.listObjects("stuyactivities", "", true);

stream.on("data", (obj) => objectSet.add(obj.name));

app.use(async (req, res) => {
  if (req.path.startsWith("/")) {
    req.path = req.path.replace("/", "");
  }
  let p = req.path.replace("/", "");

  const info = path.parse(p);

  if (!info.ext) {
    p += ".png";
  }

  if (!objectSet.has(p)) {
    const cloudinaryUrl = urlJoin(
      "https://res.cloudinary.com/stuyactivities/",
      p
    );

    await downloadImage(cloudinaryUrl, p);
  }

  const now = new Date();
  const round = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  client.presignedUrl(
    "GET",
    "stuyactivities",
    p,
    60 * 60 * 24 * 7,
    round,
    (er, url) => res.redirect(url)
  );
});

const port = Number(process.env.PORT) || 3002;

app.listen(port, () => {
  console.log("Listening on port ", port);
});
