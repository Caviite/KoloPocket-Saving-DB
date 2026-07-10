const express = require("express");
const router = express.Router();
const commissionController = require("../controller/commission"); // Adjust path
const  authenticate  = require("../middleware/token");

// Base route: /api/commissions
router.get("/myearnings", authenticate, commissionController.getAlajoCommissions);

// Group specific configurations
router.route("/group/:groupId")
  .post(authenticate, commissionController.setCommission)
  .get(authenticate, commissionController.getGroupCommission)
  .put(authenticate, commissionController.updateCommissionStats);

router.post("/group/:groupId/calculate", authenticate, commissionController.calculateCommissionForAmount);
router.get("/group/:groupId/cycle/:cycle", authenticate, commissionController.getCommissionByOrCycle);

module.exports = router;