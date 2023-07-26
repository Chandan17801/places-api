const express = require("express");
const fileUpload = require("../middleware/file-upload");
const checkAuth = require("../middleware/check-auth");

const placeControllers = require("../controllers/places-controller");

const router = express.Router();

router.get("/user/:uid", placeControllers.getPlacesByUserId);

router.get("/:pid", placeControllers.getPlaceByPlaceId);

router.use(checkAuth);

router.post("/", fileUpload.single("image"), placeControllers.addNewPlace);

router.patch("/:pid", placeControllers.updatePlace);

router.delete("/:pid", placeControllers.deletePlace);

module.exports = router;
