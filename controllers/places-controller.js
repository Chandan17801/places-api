const fs = require("fs");
const mongoose = require("mongoose");
const Place = require("../models/places");
const User = require("../models/users");

const getPlacesByUserId = async (req, res, next) => {
  const userId = req.params.uid;

  let user;
  try {
    user = await User.findById(userId).populate("places");
  } catch (err) {
    const error = new Error("Could not find users for the provided userid");
    error.code = 404;
    return next(error);
  }

  if (!user || user.places.length === 0) {
    const error = new Error("Could not find places for the provided userid");
    error.code = 404;
    return next(error);
  } else
    res.json({
      places: user.places.map((place) => place.toObject({ getters: true })),
    });
};

const getPlaceByPlaceId = async (req, res, next) => {
  const placeId = req.params.pid;

  let place;
  try {
    place = await Place.findById(placeId);
  } catch (err) {
    const error = new Error("Could not find place for the provided id");
    error.code = 404;
    return next(error);
  }

  if (!place) {
    const error = new Error("Could not find place for the provided id");
    error.code = 404;
    next(error);
  } else res.json({ place: place.toObject({ getters: true }) });
};

const addNewPlace = async (req, res, next) => {
  const { title, description, address } = req.body;
  const creator = req.userData.userId;
  const createdPlace = new Place({
    title,
    description,
    address,
    image: req.file.path,
    location: {
      lat: 40.7484405,
      lng: -73.9878584,
    },
    creator,
  });

  let user;
  try {
    user = await User.findById(creator);
  } catch (err) {
    const error = new Error("Could not find user for provided Id");
    error.code = 404;
    return next(error);
  }

  if (!user) {
    const error = new Error("Could not find user for provided Id");
    error.code = 404;
    return next(error);
  }

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await createdPlace.save({ session: sess });
    user.places.push(createdPlace);
    await user.save({ session: sess });
    await sess.commitTransaction();
  } catch (err) {
    const error = new Error(err);
    error.code = 404;
    return next(error);
  }

  res.status(201).json({ place: createdPlace });
};

const updatePlace = async (req, res, next) => {
  const placeId = req.params.pid;
  const { title, description } = req.body;

  let place;
  try {
    place = await Place.findById(placeId);
  } catch (err) {
    const error = new Error("Could not find this place");
    error.code = 404;
    return next(error);
  }

  if (place.creator.toString() !== req.userData.userId) {
    const error = new Error("You are not allowed to edit this place");
    error.code = 403;
    return next(error);
  }

  place.title = title;
  place.description = description;

  try {
    await place.save();
  } catch (err) {
    const error = new Error("Could not update this place");
    error.code = 404;
    return next(error);
  }

  res.status(200).json({ place: place.toObject({ getters: true }) });
};

const deletePlace = async (req, res, next) => {
  const placeId = req.params.pid;

  let place;
  try {
    place = await Place.findById(placeId).populate("creator");
  } catch (err) {
    const error = new Error("Could not find place for this provided id");
    error.code = 404;
    return next(error);
  }

  if (!place) {
    const error = new Error("Could not find place for this id");
    error.code = 404;
    return next(error);
  }

  if (place.creator.id !== req.userData.userId) {
    const error = new Error("You are not allowed to delete this place");
    error.code = 403;
    return next(error);
  }

  const placeImagePath = place.image;

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await place.deleteOne({ session: sess });
    await place.creator.places.pull(place);
    await place.creator.save({ session: sess });
    await sess.commitTransaction();
  } catch (err) {
    const error = new Error("Could not delete place for this provided id");
    error.code = 404;
    return next(error);
  }

  fs.unlink(placeImagePath, (err) => {
    console.log(err);
  });

  res.status(200).json({ message: "Deleted Successfully" });
};

exports.getPlacesByUserId = getPlacesByUserId;
exports.getPlaceByPlaceId = getPlaceByPlaceId;
exports.addNewPlace = addNewPlace;
exports.updatePlace = updatePlace;
exports.deletePlace = deletePlace;
