const express = require("express");
const Task = require("../models/task");
const TaskRouter = express.Router();
const auth = require("../middleware/auth");

TaskRouter.use(auth);

TaskRouter.get("/tasks", async (req, res) => {
  try {
    const match = {};
    const sort = {};
    if(req.query.completed) {
      match.completed = req.query.completed === "true"; 
    }
    if(req.query.sortBy) {
      const sortParts = req.query.sortBy.split(":");
      sort[sortParts[0]] = sortParts[1] === "desc" ? -1 : 1;
    }
    await req.user.populate({
      path: "tasks",
      match,
      options: {
        limit: parseInt(req.query.limit),
        skip: parseInt(req.query.skip),
        sort
      }
    }).execPopulate();
    return res.send(req.user.tasks);
  } catch (e) {
    return res.status(500).send();
  }
});

TaskRouter.get("/tasks/:id", async (req, res) => {
  const id = req.params.id;
  try {
    const singleTask = await Task.findOne({_id: id, owner: req.user._id});
    if(!singleTask) return res.status(404).send();
    return res.send(singleTask);
  } catch (e) {
    return res.status(500).send();
  }
});

TaskRouter.post("/tasks", async (req, res) => {
  const task = new Task({
    ...req.body,
    owner: req.user._id
  });
  try {
    await task.save();
  } catch (e) {
    return res.status(400).send(e);
  }
  return res.status(201).send(task);
});

TaskRouter.patch("/tasks/:id", async (req, res) => {
  const updateFields = Object.keys(req.body);
  const allowedUpdates = ["description", "completed"];
  const isValidOperation = updateFields.every((update) => allowedUpdates.includes(update));
  if(!isValidOperation) return res.status(400).send({error: "Invalid update"});

  const id = req.params.id;
  try {
    const singleTask = await Task.findOne({_id: id, owner: req.user._id});
    if(!singleTask) return res.status(404).send();
    updateFields.forEach((field) => {
      singleTask[field] = req.body[field];
    });
    await singleTask.save();
    return res.send(singleTask);
  } catch (e) {
    return res.status(400).send(e);
  }
});

TaskRouter.delete("/tasks/:id", async (req, res) => {
  const id = req.params.id;
  try {
    const singleTask = await Task.findOne({_id: id, owner: req.user._id});
    if(!singleTask) return res.status(404).send();
    singleTask.delete();
    return res.send(singleTask);
  } catch (e) {
    return res.status(500).send();
  }
});

module.exports = TaskRouter;