const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/users");

const listOfAllUsers = async (req, res, next) => {
  let users;
  try {
    users = await User.find({}, "-password");
  } catch (err) {
    const error = new Error("Something went wrong...");
    error.code = 422;
    next(error);
    return;
  }
  res
    .status(201)
    .json({ users: users.map((user) => user.toObject({ getters: true })) });
};

const signupUser = async (req, res, next) => {
  const { name, email, password } = req.body;

  let identifyUser;
  try {
    identifyUser = await User.findOne({ email: email });
  } catch (err) {
    const error = new Error("Signup failed");
    error.code = 422;
    next(error);
    return;
  }

  if (identifyUser) {
    const error = new Error("Email is already registered");
    error.code = 422;
    next(error);
    return;
  }

  let hashPassword;
  try {
    hashPassword = await bcrypt.hash(password, 12);
  } catch (err) {
    const error = new Error("Could not create User, please try again");
    error.code = 500;
    next(error);
    return;
  }

  const newUser = new User({
    name,
    email,
    password: hashPassword,
    image: req.file.path,
    places: [],
  });

  try {
    await newUser.save();
  } catch (e) {
    const error = new Error(e);
    error.code = 404;
    return next(error);
  }

  let token;
  try {
    token = jwt.sign(
      { userId: newUser.id, email: newUser.email },
      "supersecret_not_to_be_shared",
      { expiresIn: "1h" }
    );
  } catch (err) {
    const error = new Error("Could not create User, please try again");
    error.code = 500;
    next(error);
    return;
  }

  res
    .status(201)
    .json({ userId: newUser.id, email: newUser.email, token: token });
};

const loginUser = async (req, res, next) => {
  const { email, password } = req.body;

  let identifyUser;
  try {
    identifyUser = await User.findOne({ email: email });
  } catch (err) {
    const error = new Error("Login Failed");
    error.code = 422;
    return next(error);
  }

  if (!identifyUser) {
    const error = new Error("Please enter valid email and password");
    error.code = 404;
    return next(error);
  }

  let isValidPassword = false;
  try {
    isValidPassword = await bcrypt.compare(password, identifyUser.password);
  } catch (err) {
    const error = new Error("Something went wrong");
    error.code = 401;
    return next(error);
  }

  if (!isValidPassword) {
    const error = new Error("Please enter valid email and password");
    error.code = 404;
    return next(error);
  }

  let token;
  try {
    token = jwt.sign(
      { userId: identifyUser.id, email: identifyUser.email },
      "supersecret_not_to_be_shared",
      { expiresIn: "1h" }
    );
  } catch (err) {
    const error = new Error("Could not login User, please try again");
    error.code = 500;
    next(error);
    return;
  }

  res.status(200).json({
    userId: identifyUser.id,
    email: identifyUser.email,
    token,
  });
};

exports.listOfAllUsers = listOfAllUsers;
exports.signupUser = signupUser;
exports.loginUser = loginUser;
