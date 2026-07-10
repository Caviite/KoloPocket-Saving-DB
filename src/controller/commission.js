// ─────────────────────────────────────────────────────────────────────────
// Commission Controller - Handle commission operations (Flat Naira Amount)
// ─────────────────────────────────────────────────────────────────────────

const Commission = require("../model/commission");
const Contribution = require("../model/contribution");
const Payout = require("../model/payout"); // 💡 ADDED: Import Payout model to track actual distributions

// ── SET COMMISSION AMOUNT ────────────────────────────────────────────────
exports.setCommission = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { commissionAmount } = req.body; 
    const alajoId = req.user.id;

    if (commissionAmount < 0) {
      return res.status(400).json({
        success: false,
        message: "Commission amount cannot be negative"
      });
    }

    let commission = await Commission.findOne({ groupId });

    if (commission) {
      commission.commissionAmount = Number(commissionAmount);
      commission.updatedAt = new Date();
      await commission.save();
      console.log("✅ Commission updated to flat amount: ₦" + commissionAmount);
    } else {
      commission = new Commission({
        groupId,
        alajoId,
        commissionAmount: Number(commissionAmount),
        isActive: true
      });
      await commission.save();
      console.log("✅ Commission created with flat amount: ₦" + commissionAmount);
    }

    res.status(200).json({
      success: true,
      message: "Commission amount set successfully",
      commission
    });

  } catch (error) {
    console.error("❌ Error setting commission:", error);
    res.status(500).json({
      success: false,
      message: "Error setting commission",
      error: error.message
    });
  }
};

// ── GET ALAJO'S COMMISSIONS ──────────────────────────────────────────────
exports.getAlajoCommissions = async (req, res) => {
  try {
    const alajoId = req.user.id;

    const commissions = await Commission.find({ alajoId })
      .populate("groupId", "name cycleType amount");

    const totalEarnings = commissions.reduce((sum, c) => sum + (c.totalCommissionEarned || 0), 0);

    res.status(200).json({
      success: true,
      totalEarnings,
      count: commissions.length,
      commissions
    });

  } catch (error) {
    console.error("❌ Error fetching Alajo commissions:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching commissions",
      error: error.message
    });
  }
};

// ── GET GROUP COMMISSION ─────────────────────────────────────────────────
exports.getGroupCommission = async (req, res) => {
  try {
    const { groupId } = req.params;

    const commission = await Commission.findOne({ groupId })
      .populate("groupId", "name cycleType amount")
      .populate("alajoId", "name email");

    if (!commission) {
      return res.status(404).json({
        success: false,
        message: "Commission schema context not found for this group"
      });
    }

    const contributions = await Contribution.find({ groupId });

    const stats = {
      totalContributions: contributions.length,
      totalAmount: contributions.reduce((sum, c) => sum + c.amount, 0),
      completedAmount: contributions
        .filter(c => c.status === "completed")
        .reduce((sum, c) => sum + c.amount, 0),
      pendingAmount: contributions
        .filter(c => c.status === "pending")
        .reduce((sum, c) => sum + c.amount, 0)
    };

    res.status(200).json({
      success: true,
      commission,
      stats
    });

  } catch (error) {
    console.error("❌ Error fetching group commission:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching group commission",
      error: error.message
    });
  }
};

// ── UPDATE COMMISSION STATS (FIXED FOR ALAJO ACCURACY) ───────────────────
exports.updateCommissionStats = async (req, res) => {
  try {
    const { groupId } = req.params;

    // 1. Fetch all completed contributions to know total inflow
    const contributions = await Contribution.find({
      groupId,
      status: "completed"
    });

    const commission = await Commission.findOne({ groupId });
    if (!commission) {
      return res.status(404).json({
        success: false,
        message: "Commission profile reference missing"
      });
    }

    // 2. Fetch all completed payouts distributed for this group
    const payouts = await Payout.find({
      groupId,
      status: "completed"
    });

    const totalCollected = contributions.reduce((sum, c) => sum + c.amount, 0);
    
    // 💡 FIXED LOGIC: Total commission earned is the sum of commissions explicitly 
    // deducted from each distributed payout record.
    const totalCommissionEarned = payouts.reduce((sum, p) => sum + (p.commissionDeducted || 0), 0);
    
    // Total payouts distributed is the sum of net amounts sent out to members
    const totalPayoutsDistributed = payouts.reduce((sum, p) => sum + (p.netAmountPaid || 0), 0);

    // Persist accurate accounting updates to database
    commission.totalCollected = totalCollected;
    commission.totalCommissionEarned = totalCommissionEarned;
    commission.totalPayoutsDistributed = totalPayoutsDistributed;
    await commission.save();

    console.log("✅ Commission processing metrics synchronized accurately using payout history");

    // Check if res is a mock object (from background sync calling) or a real Express response object
    if (res && typeof res.status === "function") {
      return res.status(200).json({
        success: true,
        message: "Commission stats updated",
        commission
      });
    }
    return commission;

  } catch (error) {
    console.error("❌ Error updating commission stats:", error);
    if (res && typeof res.status === "function") {
      return res.status(500).json({
        success: false,
        message: "Error updating commission stats",
        error: error.message
      });
    }
    throw error;
  }
};

// ── CALCULATE COMMISSION FOR AMOUNT ──────────────────────────────────────
exports.calculateCommissionForAmount = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid input amount parameter passed"
      });
    }

    const commission = await Commission.findOne({ groupId });

    if (!commission) {
      return res.status(404).json({
        success: false,
        message: "Commission profile setup not found"
      });
    }

    const commissionAmount = commission.commissionAmount || 0;
    const amountForPayout = amount - commissionAmount;

    res.status(200).json({
      success: true,
      originalAmount: amount,
      commissionAmount,
      amountForPayout
    });

  } catch (error) {
    console.error("❌ Error calculating commission deductions:", error);
    res.status(500).json({
      success: false,
      message: "Error calculating commission",
      error: error.message
    });
  }
};

// ── GET COMMISSION BREAKDOWN BY CYCLE ────────────────────────────────────
exports.getCommissionByOrCycle = async (req, res) => {
  try {
    const { groupId, cycle } = req.params;

    const commission = await Commission.findOne({ groupId });

    if (!commission) {
      return res.status(404).json({
        success: false,
        message: "Commission tracking summary container missing"
      });
    }

    const cycleBreakdown = commission.cycleBreakdown?.find(c => c.cycle === parseInt(cycle));

    if (!cycleBreakdown) {
      return res.status(404).json({
        success: false,
        message: "No history record logged for this cycle parameter"
      });
    }

    res.status(200).json({
      success: true,
      breakdown: cycleBreakdown
    });

  } catch (error) {
    console.error("❌ Error getting cycle breakdown ledger:", error);
    res.status(500).json({
      success: false,
      message: "Error getting cycle breakdown",
      error: error.message
    });
  }
};

module.exports = exports;