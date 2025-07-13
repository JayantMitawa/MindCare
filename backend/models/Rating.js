// backend/models/Rating.js

const mongoose = require("mongoose");

const RatingSchema = new mongoose.Schema({
  Country:        { type: String, required: true },
  Year:           { type: String, required: true },
  Rating:         { type: Number, required: true },
  Age:            { type: String },
  Gender:         { type: String },
  Occupation:     { type: String },
  family_history: { type: String }
}, { collection: "ratings" });

module.exports = mongoose.model("Rating", RatingSchema);
