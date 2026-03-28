const controller = require("../controllers/complaint.controller");

module.exports = function(app) {
  app.use(function(req, res, next) {
    res.header(
      "Access-Control-Allow-Headers",
      "x-access-token, Origin, Content-Type, Accept"
    );
    next();
  });

  app.post("/api/complaints", controller.createComplaint);
  app.get("/api/complaints", controller.getComplaints);
  app.put("/api/complaints/:id", controller.updateComplaintStatus);
  app.post("/api/complaints/:id/feedback", controller.addFeedback);
};
