const express = require("express");
const router = express.Router();
const payoutController = require("../controller/payout");
const authenticate = require("../middleware/token"); // Ensure path points to your middleware file

// Base URL context path mapped in server entry: /api/payouts
router.post("/send", authenticate, payoutController.triggerPayout);
router.get("/history", authenticate, payoutController.getPayoutHistory);

module.exports = router;