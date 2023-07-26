const express = require("express");

const userControllers = require("../controllers/users-controllers");
const fileUpload = require("../middleware/file-upload");

const router = express.Router();

router.get("/", userControllers.listOfAllUsers);

router.post("/signup", fileUpload.single("image"), userControllers.signupUser);

router.post("/login", userControllers.loginUser);

module.exports = router;
