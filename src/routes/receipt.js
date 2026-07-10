const express = require("express");
const router = express.Router();
const receiptController = require("../controller/receipt"); // Adjust path if needed
const  authenticate  = require("../middleware/token"); // Your JWT protector

// Base route: /api/receipts

// Group specific analytical records
router.get("/group/:groupId", authenticate, receiptController.getGroupReceipts);
router.get("/group/:groupId/summary", authenticate, receiptController.getReceiptSummary);
router.get("/group/:groupId/cycle/:cycle", authenticate, receiptController.getReceiptsByCycle);
router.get("/group/:groupId/export/:format", authenticate, receiptController.exportReceiptsReport);

// Contributor specific history tracking
router.get("/group/:groupId/contributor/:contributorId", authenticate, receiptController.getContributorReceipts);

// Individual receipt interactions
router.get("/:receiptId", authenticate, receiptController.getReceipt);
router.get("/ref/:transactionRef", authenticate, receiptController.getReceiptByReference);

// Admin / Alajo manual verification action
router.put("/:receiptId/verify", authenticate, receiptController.verifyReceipt);

module.exports = router;