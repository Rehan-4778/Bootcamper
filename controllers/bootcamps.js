const Bootcamp = require("../models/Bootcamp");
const ErrorResponse = require("../utils/errorResponse");
const geocoder = require("../utils/geocoder");
const asyncHandler = require("../middlewares/async");

// @description       Get all bootcamps
// @route             GET  api/v1/bootcamps
// @access            Public
exports.getBootcamps = asyncHandler(async (req, res, next) => {
  res.status(200).json(res.advancedResults);
});

// @description       Get single bootcamp
// @route             GET  api/v1/bootcamp/:id
// @access            Public
exports.getBootcamp = asyncHandler(async (req, res, next) => {
  const bootcamp = await Bootcamp.findById(req.params.id);
  // if bootcamp not exist with given id
  if (!bootcamp) {
    return next(
      new ErrorResponse(`Bootcamp not found with id of ${req.params.id}`, 404)
    );
  }

  res.status(200).json({ success: true, data: bootcamp });
});

// @description       Create new bootcamp
// @route             POST  api/v1/bootcamps
// @access            Private
exports.createBootcamp = asyncHandler(async (req, res, next) => {
  // add user to req.body
  req.body.user = req.user.id;

  // check for published bootcamp
  const publishedBootcamp = await Bootcamp.findOne({ user: req.user.id });

  // if user is not admin, they can only add one bootcamp
  if (publishedBootcamp && req.user.role !== "admin") {
    return next(
      new ErrorResponse(
        `The user with id ${req.user.id} has already published a bootcamp`,
        400
      )
    );
  }

  const bootcamp = await Bootcamp.create(req.body);
  res.status(201).json({ success: true, data: bootcamp });
});

// @description       Update bootcamp
// @route             PUT  api/v1/bootcamp/:id
// @access            Private
exports.updateBootcamp = asyncHandler(async (req, res, next) => {
  // find the bootcamp
  let bootcamp = await Bootcamp.findById(req.params.id);

  if (!bootcamp) {
    return next(
      new ErrorResponse(`Bootcamp not found with id of ${req.params.id}`, 404)
    );
  }

  // make sure user is bootcamp owner
  if (bootcamp.user.toString() !== req.user.id && req.user.role !== "admin") {
    return next(
      new ErrorResponse(
        `User ${req.params.id} is not authorized to update this bootcamp`,
        401
      )
    );
  }

  // update the bootcamp
  bootcamp = await Bootcamp.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({ success: true, data: bootcamp });
});

// @description       Delete bootcamp
// @route             DELETE  api/v1/bootcamp/:id
// @access            Private
exports.deleteBootcamp = asyncHandler(async (req, res, next) => {
  // also want to delete all courses associated with the bootcamp
  const bootcamp = await Bootcamp.findById(req.params.id);

  if (!bootcamp) {
    return next(
      new ErrorResponse(`Bootcamp not found with id of ${req.params.id}`, 404)
    );
  }

  // make sure user is bootcamp owner
  if (bootcamp.user.toString() !== req.user.id && req.user.role !== "admin") {
    return next(
      new ErrorResponse(
        `User ${req.params.id} is not authorized to delete this bootcamp`,
        401
      )
    );
  }

  // remove the bootcamp
  bootcamp.deleteOne();

  res.status(200).json({ success: true, data: {} });
});

exports.getBootcampsInRadius = asyncHandler(async (req, res, next) => {
  const { zipcode, distance } = req.params;
  // Get lat/lng from geocoder
  const loc = await geocoder.geocode(zipcode);
  const lat = loc[0].latitude;
  const lng = loc[0].longitude;
  // Calc radius using radians
  // Divide distance by radius of earth
  // Earth radius = 3,963 mi / 6,378 km
  const radius = distance / 3963;
  const bootcamps = await Bootcamp.find({
    location: { $geoWithin: { $centerSphere: [[lng, lat], radius] } },
  });
  res
    .status(200)
    .json({ success: true, count: bootcamps.length, data: bootcamps });
});

// @description       Upload photo for bootcamp
// @route             PUT  api/v1/bootcamp/:id/photo
// @access            Private

// using multer to upload photo
exports.bootcampPhotoUpload = asyncHandler(async (req, res, next) => {
  const bootcamp = await Bootcamp.findById(req.params.id);
  if (!bootcamp) {
    return next(
      new ErrorResponse(`Bootcamp not found with id of ${req.params.id}`, 404)
    );
  }

  // make sure user is bootcamp owner
  if (bootcamp.user.toString() !== req.user.id && req.user.role !== "admin") {
    return next(
      new ErrorResponse(
        `User ${req.params.id} is not authorized to update this bootcamp`,
        401
      )
    );
  }

  // check  if file is uploaded
  if (req.fileValidationError) {
    return res.status(400).json({ error: req.fileValidationError });
  }

  if (!req.file) {
    return next(new ErrorResponse(`Please upload a file`, 400));
  }

  // Save the filename to database
  await Bootcamp.findByIdAndUpdate(req.params.id, { photo: req.file.path });

  res.status(200).json({
    success: true,
    data: req.file.path,
  });
});
