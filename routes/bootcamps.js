const express = require("express");
const upload = require("../middlewares/ImageUpload");
const {
  getBootcamps,
  getBootcamp,
  createBootcamp,
  updateBootcamp,
  deleteBootcamp,
  getBootcampsInRadius,
  bootcampPhotoUpload,
} = require("../controllers/bootcamps");
const router = express.Router();

// Middleware
const { protect, authorize } = require("../middlewares/auth");

const Bootcamp = require("../models/Bootcamp");
const advancedResults = require("../middlewares/advancedResults");

// Include other resource routers
const courseRouter = require("./courses");
// Re-route into other resource routers
router.use("/:bootcampId/courses", courseRouter);

// Bootcamp routes
router
  .route("/")
  .get(advancedResults(Bootcamp, "courses"), getBootcamps)
  .post(protect, authorize("publisher", "admin"), createBootcamp);

router
  .route("/:id")
  .get(getBootcamp)
  .put(protect, authorize("publisher", "admin"), updateBootcamp)
  .delete(protect, authorize("publisher", "admin"), deleteBootcamp);

router.route("/radius/:zipcode/:distance").get(getBootcampsInRadius);
router
  .route("/:id/photo")
  .put(
    protect,
    authorize("publisher", "admin"),
    upload.single("file"),
    bootcampPhotoUpload
  );

module.exports = router;
