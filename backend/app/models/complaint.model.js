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
    createdAt: { type: Date, default: Date.now }
  })
);

module.exports = Complaint;
