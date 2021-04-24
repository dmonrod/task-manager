const express = require("express");
const multer = require("multer");
const sharp = require("sharp");
const User = require("../models/user");
const UserRouter = express.Router();
const auth = require("../middleware/auth");
const account = require("../emails/account");

const avatarUpload = multer({
  limits: {
    fileSize: 1000000
  },
  fileFilter(req, file, cb) {
    if(!file.originalname.match(/\.(png|jpg|jpeg)/)) {
      return cb(new Error("Please upload a doc"));
    }
    return cb(undefined, true);
  }
});

UserRouter.post("/users", async (req, res) => {
  const body = req.body;
  const user = new User(body);
  try {
    await user.save();
    const token = await user.generateAuthToken();
    account.sendWelcomeEmail(user.email, user.name);
    return res.status(201).send({ user, token });
  } catch (e) {
    return res.status(400).send(e);
  }
});

UserRouter.post("/users/login", async(req, res) => {
  try {
    const user = await User.findByCredentials(req.body.email, req.body.password);
    const token = await user.generateAuthToken();
    return res.send({ user, token });
  } catch (e) {
    return res.status(400).send();
  } 
});

UserRouter.post("/users/logout", auth, async(req, res) => {
  try {
    req.user.tokens = req.user.tokens.filter(token => token.token !== req.token);
    await req.user.save();
    return res.send();
  } catch (e) {
    return res.status(500).send();
  }
});

UserRouter.post("/users/logout/all", auth, async(req, res) => {
  try {
    req.user.tokens = [];
    await req.user.save();
    return res.send();
  } catch (e) {
    return res.status(500).send();
  }
});

UserRouter.get("/users/me", auth, async (req, res) => {
  return res.send(req.user);
});

UserRouter.patch("/users/me", auth, async (req, res) => {
  const updateFields = Object.keys(req.body);
  const allowedUpdates = ["name", "email", "password", "age"];
  const isValidOperation = updateFields.every((update) => allowedUpdates.includes(update));
  if(!isValidOperation) return res.status(400).send({error: "Invalid update"});

  try {
    const singleUser = req.user;
    updateFields.forEach((field) => {
      singleUser[field] = req.body[field];
    });
    await singleUser.save();
    return res.send(singleUser);
  } catch (e) {
    return res.status(400).send(e);
  }
});

UserRouter.delete("/users/me", auth, async (req, res) => {
  try {
    await req.user.remove();
    account.sendCancellationEmail(req.user.email, req.user.name);
    
    return res.send(req.user);
  } catch (e) {
    return res.status(500).send();
  }
});

UserRouter.post("/users/me/avatar", [auth, avatarUpload.single("avatar")], async (req, res) => {
  const buffer = await sharp(req.file.buffer).resize({ width: 250, height: 250 }).png().toBuffer();
  req.user.avatar = buffer;
  await req.user.save();
  res.send();
}, (error, req, res, next) => {
  res.status(400).send({ error: error.message });
});

UserRouter.delete("/users/me/avatar", auth, async (req, res) => {
  req.user.avatar = undefined;
  await req.user.save();
  res.send();
});

UserRouter.get("/users/:id/avatar", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if(!user || !user.avatar) {
      throw new Error();
    }

    res.set("Content-Type", "image/png");
    res.send(user.avatar);
  } catch (e) {
    return res.status(404). send();
  }
  res.send();
});

module.exports = UserRouter;