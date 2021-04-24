require("dotenv").config()
const express = require("express");
require("./db/mongoose");

const app = express();
const port = process.env.PORT;

app.use(express.json());

app.use(require("./routers/user"));
app.use(require("./routers/task"));

app.listen(port, () => {
  console.log(`Server is up on ${port}`);
});