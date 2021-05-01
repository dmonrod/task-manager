const request = require("supertest");
const jwt = require("jsonwebtoken");
const app = require("../src/app");
const User = require("../src/models/user");
const mongoose = require("mongoose");

const user1Id = new mongoose.Types.ObjectId();
const user1 = {
  _id: user1Id,
  name: "Test User 1",
  email: "test1@mail.com",
  password: "Pass123$",
  tokens: [{
    token: jwt.sign({_id: user1Id }, process.env.JWT_SECRET)
  }]
};

beforeEach(async () => {  
  await User.deleteMany();
  await new User(user1).save();
});

test("Should sign up a new user", async() => {
  const userRequest = {
    name: "John Egbert",
    email: "johne@mail.com",
    password: "Pass123$"
  };

  const response = await request(app).post("/users").send(userRequest).expect(201);
  const body = response.body;

  // asset db changes
  const newUser = await User.findById(body.user._id);
  expect(newUser).not.toBeNull();
  expect(newUser.password).not.toBe(userRequest.password);

  // assert response
  expect(body).toMatchObject({ user: { name: userRequest.name, email: userRequest.email }, token: newUser.tokens[0].token });
});

test("Should log in existing user", async() => {
  const response = await request(app).post("/users/login").send({
    email: user1.email,
    password: user1.password
  }).expect(200);
  const body = response.body;

  const loggedInUser = await User.findById(user1Id);
  expect(body.token).toBe(loggedInUser.tokens[1].token);

});

test("Should not log in non-existing user", async() => {
  await request(app).post("/users/login").send({
    email: user1.email+"fake",
    password: user1.password
  }).expect(400);
});

test("Should get profile for user", async() => {
  await request(app)
    .get("/users/me")
    .set("Authorization", `Bearer ${user1.tokens[0].token}`)
    .send()
    .expect(200);
});

test("Should not get profile for unauthenticated user", async() => {
  await request(app)
    .get("/users/me")
    .send()
    .expect(401);
});

test("Should delete profile for user", async() => {
  await request(app)
    .delete("/users/me")
    .set("Authorization", `Bearer ${user1.tokens[0].token}`)
    .send()
    .expect(200);

  const deletedUser = await User.findById(user1Id);
  expect(deletedUser).toBeNull();
});

test("Should not delete profile for unauthenticated user", async() => {
  await request(app)
    .delete("/users/me")
    .send()
    .expect(401);
});

test("Should upload avatar image for user", async() => {
  await request(app)
    .post("/users/me/avatar")
    .set("Authorization", `Bearer ${user1.tokens[0].token}`)
    .attach("avatar", "tests/fixtures/profile-pic.jpg")
    .expect(200);

  const user = await User.findById(user1Id);
  expect(user.avatar).toEqual(expect.any(Buffer));
});

test("Should update user", async() => {
  const newName = "New Test User Name";
  await request(app).patch("/users/me")
    .set("Authorization", `Bearer ${user1.tokens[0].token}`)
    .send({
      name: newName,
    })
    .expect(200);

  const loggedInUser = await User.findById(user1Id);
  expect(loggedInUser.name).toBe(newName);
});

test("Should not update invalid user field", async() => {
  await request(app).patch("/users/me")
    .set("Authorization", `Bearer ${user1.tokens[0].token}`)
    .send({
      phoneNumber: "####",
    })
    .expect(400);
});
