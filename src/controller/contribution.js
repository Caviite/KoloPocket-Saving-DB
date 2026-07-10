// ─────────────────────────────────────────────────────────────────────────
// Contribution Controller - Handle all contribution operations
// ─────────────────────────────────────────────────────────────────────────

const Contribution = require("../model/contribution");
const Commission = require("../model/commission");
const Receipt = require("../model/receipt");

// ── RECORD CONTRIBUTION ──────────────────────────────────────────────────
exports.recordContribution = async (req, res) => {
  try {
    const {
      groupId,
      contributorId,
      alajoId,
      amount,
      cycle,
      cycleStartDate,
      cycleEndDate,
      paymentMethod,
      transactionRef,
      bankName,
      accountNumber,
      accountHolder,
      notes
    } = req.body;

    // Validate required fields
    if (!groupId || !contributorId || !alajoId || !amount || !cycle) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields"
      });
    }

    // Create contribution record
    const contribution = new Contribution({
      groupId,
      contributorId,
      alajoId,
      amount,
      cycle,
      cycleStartDate,
      cycleEndDate,
      paymentMethod,
      transactionRef,
      bankName,
      accountNumber,
      accountHolder,
      notes,
      status: "completed",
      isOnTime: true,
      daysLate: 0
    });

    await contribution.save();

    console.log("✅ Contribution recorded:", contribution._id);

    // Auto-generate receipt
    const receipt = await this.generateReceiptForContribution(contribution);

    res.status(201).json({
      success: true,
      message: "Contribution recorded successfully",
      contribution: contribution,
      receipt: receipt
    });

  } catch (error) {
    console.error("❌ Error recording contribution:", error);
    res.status(500).json({
      success: false,
      message: "Error recording contribution",
      error: error.message
    });
  }
};

// ── GET ALL CONTRIBUTIONS FOR A GROUP ─────────────────────────────────────
exports.getGroupContributions = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { cycle, status } = req.query;

    // Build filter
    let filter = { groupId };
    if (cycle) filter.cycle = parseInt(cycle);
    if (status) filter.status = status;

    // Get contributions
    const contributions = await Contribution.find(filter)
      .populate("contributorId", "name phone email")
      .populate("alajoId", "name")
      .sort({ paymentDate: -1 });

    // Calculate totals
    const totals = {
      count: contributions.length,
      totalAmount: contributions.reduce((sum, c) => sum + c.amount, 0),
      completedCount: contributions.filter(c => c.status === "completed").length,
      pendingCount: contributions.filter(c => c.status === "pending").length
    };

    res.status(200).json({
      success: true,
      totals,
      contributions
    });

  } catch (error) {
    console.error("❌ Error fetching contributions:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching contributions",
      error: error.message
    });
  }
};

// ── GET CONTRIBUTOR'S PAYMENTS ───────────────────────────────────────────
exports.getContributorPayments = async (req, res) => {
  try {
    const { groupId, contributorId } = req.params;

    const contributions = await Contribution.find({
      groupId,
      contributorId
    })
      .populate("groupId", "name cycleType")
      .sort({ cycle: -1 });

    // Calculate stats
    const stats = {
      totalPaid: contributions.reduce((sum, c) => sum + c.amount, 0),
      totalPayments: contributions.length,
      completedPayments: contributions.filter(c => c.status === "completed").length,
      pendingPayments: contributions.filter(c => c.status === "pending").length,
      latePayments: contributions.filter(c => !c.isOnTime).length
    };

    res.status(200).json({
      success: true,
      stats,
      contributions
    });

  } catch (error) {
    console.error("❌ Error fetching contributor payments:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching contributor payments",
      error: error.message
    });
  }
};

// ── UPDATE CONTRIBUTION STATUS ───────────────────────────────────────────
exports.updateContributionStatus = async (req, res) => {
  try {
    const { contributionId } = req.params;
    const { status, notes } = req.body;

    const contribution = await Contribution.findByIdAndUpdate(
      contributionId,
      {
        status,
        notes,
        updatedAt: new Date()
      },
      { new: true }
    );

    if (!contribution) {
      return res.status(404).json({
        success: false,
        message: "Contribution not found"
      });
    }

    console.log("✅ Contribution status updated:", status);

    res.status(200).json({
      success: true,
      message: "Contribution status updated",
      contribution
    });

  } catch (error) {
    console.error("❌ Error updating contribution:", error);
    res.status(500).json({
      success: false,
      message: "Error updating contribution",
      error: error.message
    });
  }
};

// ── GET CONTRIBUTIONS BY STATUS ──────────────────────────────────────────
exports.getContributionsByStatus = async (req, res) => {
  try {
    const { groupId, status } = req.params;

    const contributions = await Contribution.find({
      groupId,
      status
    })
      .populate("contributorId", "name phone")
      .sort({ paymentDate: -1 });

    res.status(200).json({
      success: true,
      count: contributions.length,
      contributions
    });

  } catch (error) {
    console.error("❌ Error fetching contributions by status:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching contributions",
      error: error.message
    });
  }
};

// ── GET CYCLE SUMMARY ────────────────────────────────────────────────────
exports.getCycleSummary = async (req, res) => {
  try {
    const { groupId, cycle } = req.params;

    const contributions = await Contribution.find({
      groupId,
      cycle
    }).populate("contributorId", "name phone");

    const summary = {
      cycle,
      totalContributors: contributions.length,
      totalCollected: contributions.reduce((sum, c) => sum + c.amount, 0),
      completed: contributions.filter(c => c.status === "completed").length,
      pending: contributions.filter(c => c.status === "pending").length,
      onTime: contributions.filter(c => c.isOnTime).length,
      late: contributions.filter(c => !c.isOnTime).length,
      contributors: contributions
    };

    res.status(200).json({
      success: true,
      summary
    });

  } catch (error) {
    console.error("❌ Error getting cycle summary:", error);
    res.status(500).json({
      success: false,
      message: "Error getting cycle summary",
      error: error.message
    });
  }
};

// ── HELPER: Generate Receipt for Contribution ──────────────────────────
exports.generateReceiptForContribution = async (contribution) => {
  try {
    // Get commission details
    const commission = await Commission.findOne({ groupId: contribution.groupId });
    
    const commissionPercentage = commission?.commissionPercentage || 10;
    const commissionAmount = (contribution.amount * commissionPercentage) / 100;
    const amountForPayout = contribution.amount - commissionAmount;

    // Create receipt
    const receipt = new Receipt({
      contributionId: contribution._id,
      groupId: contribution.groupId,
      contributorId: contribution.contributorId,
      alajoId: contribution.alajoId,
      contributionAmount: contribution.amount,
      cycle: contribution.cycle,
      cycleStartDate: contribution.cycleStartDate,
      cycleEndDate: contribution.cycleEndDate,
      commissionPercentage,
      commissionAmount,
      amountForPayout,
      paymentDate: contribution.paymentDate,
      paymentMethod: contribution.paymentMethod,
      transactionRef: contribution.transactionRef,
      status: "completed"
    });

    await receipt.save();

    // Update contribution with receipt ID
    contribution.receiptId = receipt._id;
    await contribution.save();

    console.log("✅ Receipt generated:", receipt.receiptNumber);

    return receipt;

  } catch (error) {
    console.error("❌ Error generating receipt:", error);
    throw error;
  }
};

module.exports = exports;