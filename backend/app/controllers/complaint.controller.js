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
    const complaint = await Complaint.findByIdAndUpdate(
      id,
      { status: req.body.status },
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
