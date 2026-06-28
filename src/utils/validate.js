const validUrl = require("valid-url");

exports.isValidUrl = (url) => {
  return validUrl.isUri(url);
};