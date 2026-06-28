const UrlModel = require("../models/urlModel");
const { nanoid } = require("nanoid");
const { isValidUrl } = require("../utils/validate");
const redisClient = require("../utils/redisClient");
const { baseUrl } = require("../config");


// POST /url/shorten
exports.createShortUrl = async (req, res) => {
  try {
    const { longUrl } = req.body;

    if (!longUrl || !isValidUrl(longUrl)) {
      return res.status(400).send({
        status: false,
        message: "Invalid URL"
      });
    }

    // Check if already exists
    let url = await UrlModel.findOne({ longUrl });
    if (url) {
      return res.status(200).send({
        status: true,
        data: url
      });
    }

    // Create new
    const urlCode = nanoid(6).toLowerCase();
    const shortUrl = `${baseUrl}/${urlCode}`;

    url = await UrlModel.create({
      longUrl,
      shortUrl,
      urlCode
    });

    // Cache for 24 hrs (86400 sec)
    await redisClient.set(urlCode, longUrl, { EX: 86400 });

    return res.status(201).send({
      status: true,
      data: url
    });

  } catch (err) {
    return res.status(500).send({
      status: false,
      message: err.message
    });
  }
};


// GET /:urlCode
exports.getUrl = async (req, res) => {
  try {
    const { urlCode } = req.params;

    if (!urlCode) {
      return res.status(400).send({
        status: false,
        message: "Invalid request"
      });
    }

    // 🔥 Check Redis first
    const cachedUrl = await redisClient.get(urlCode);

    if (cachedUrl) {
      return res.redirect(302, cachedUrl);
    }

    // DB fallback
    const url = await UrlModel.findOne({ urlCode });

    if (!url) {
      return res.status(404).send({
        status: false,
        message: "URL not found"
      });
    }

    // Cache again
    await redisClient.set(urlCode, url.longUrl, { EX: 86400 });

    return res.redirect(302, url.longUrl);

  } catch (err) {
    return res.status(500).send({
      status: false,
      message: err.message
    });
  }
};