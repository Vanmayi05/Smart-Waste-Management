const mongoose = require("mongoose");

const Complaint = mongoose.model(
  "Complaint",
  new mongoose.Schema({
    title: String,
    description: String,
    status: { type: String, default: "Pending" },
    image: String,
    lat: Number,
    lng: Number,
    resolutionImage: String,
    resolutionLat: Number,
    resolutionLng: Number,
    feedback: {
      rating: Number,
      comment: String
    },
    createdAt: { type: Date, default: Date.now }
  })
);

module.exports = Complaint;
