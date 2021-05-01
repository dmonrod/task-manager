require("dotenv").config()
const express = require("express");
require("./db/mongoose");

const app = express();

app.use(express.json());

app.use(require("./routers/user"));
app.use(require("./routers/task"));

module.exports = app;