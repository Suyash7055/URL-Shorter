const express = require("express");
const mongoose = require("mongoose");
const routes = require("./routes/route");
const { mongoURI } = require("./config");

const app = express();

app.use(express.json());

mongoose.connect(mongoURI)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.log(err));

app.use("/", routes);

app.listen(3000, () => {
  console.log("Server running on port 3000");
});