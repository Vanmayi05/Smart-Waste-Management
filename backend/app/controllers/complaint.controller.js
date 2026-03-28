const db = require("../models");
const Complaint = db.complaint;

exports.createComplaint = async (req, res) => {
  try {
    const complaint = new Complaint({
      title: req.body.title,
      description: req.body.description,
      status: req.body.status || "Pending",
      image: req.body.image || "",
      lat: req.body.lat !== undefined ? req.body.lat : null,
      lng: req.body.lng !== undefined ? req.body.lng : null
    });

    const savedComplaint = await complaint.save();
    res.status(201).send(savedComplaint);
  } catch (err) {
    res.status(500).send({ message: err.message || "Some error occurred while creating the Complaint." });
  }
};

exports.getComplaints = async (req, res) => {
  try {
    const complaints = await Complaint.find().sort({ createdAt: -1 });
    res.status(200).send(complaints);
  } catch (err) {
    res.status(500).send({ message: err.message || "Some error occurred while retrieving complaints." });
  }
};

exports.updateComplaintStatus = async (req, res) => {
  try {
    const id = req.params.id;
    
    let updateData = { status: req.body.status };
    if (req.body.resolutionImage) updateData.resolutionImage = req.body.resolutionImage;
    if (req.body.resolutionLat !== undefined) updateData.resolutionLat = req.body.resolutionLat;
    if (req.body.resolutionLng !== undefined) updateData.resolutionLng = req.body.resolutionLng;

    const complaint = await Complaint.findByIdAndUpdate(
      id,
      updateData,
      { new: true, useFindAndModify: false }
    );
    
    if (!complaint) {
      return res.status(404).send({ message: `Cannot update Complaint with id=${id}. Maybe Complaint was not found!` });
    }
    
    res.status(200).send(complaint);
  } catch (err) {
    res.status(500).send({ message: err.message || "Error updating Complaint with id=" + req.params.id });
  }
};

exports.addFeedback = async (req, res) => {
  try {
    const id = req.params.id;
    const { rating, comment } = req.body;
    
    if(!rating) {
      return res.status(400).send({ message: "Rating is required" });
    }

    const existingComplaint = await Complaint.findById(id);
    if (!existingComplaint) {
      return res.status(404).send({ message: `Cannot update Complaint with id=${id}. Maybe Complaint was not found!` });
    }

    if (existingComplaint.feedback && existingComplaint.feedback.rating) {
      return res.status(400).send({ message: "Feedback has already been submitted for this complaint. Duplicate submissions are not allowed." });
    }

    existingComplaint.feedback = { rating, comment };
    const savedComplaint = await existingComplaint.save();
    
    res.status(200).send(savedComplaint);
  } catch (err) {
    res.status(500).send({ message: err.message || "Error adding feedback" });
  }
};
