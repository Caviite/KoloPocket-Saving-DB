const express = require("express");
const router = express.Router();
const contributionController = require("../controller/contribution"); // Adjust path
const authenticate = require("../middleware/token");
console.log("🔍 Testing authenticate middleware:", typeof authenticate);
console.log("🔍 Testing controller method:", typeof contributionController.recordContribution);

// Base route: /api/contributions
router.post("/record", authenticate, contributionController.recordContribution);
router.get("/group/:groupId", authenticate, contributionController.getGroupContributions);
router.get("/group/:groupId/contributor/:contributorId", authenticate, contributionController.getContributorPayments);
router.get("/group/:groupId/status/:status", authenticate, contributionController.getContributionsByStatus);
router.get("/group/:groupId/cycle/:cycle", authenticate, contributionController.getCycleSummary);

// Update status of a specific entry
router.put("/:contributionId/status", authenticate, contributionController.updateContributionStatus);

module.exports = router;