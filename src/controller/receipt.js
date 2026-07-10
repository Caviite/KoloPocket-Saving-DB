// ─────────────────────────────────────────────────────────────────────────
// Receipt Controller - Handle receipt operations
// ─────────────────────────────────────────────────────────────────────────

const Receipt = require("../model/receipt");
const Contribution = require("../model/contribution");
const Commission = require("../model/commission");

// ── GET RECEIPT BY ID ────────────────────────────────────────────────────
exports.getReceipt = async (req, res) => {
  try {
    const { receiptId } = req.params;

    const receipt = await Receipt.findById(receiptId)
      .populate("contributorId", "name phone email address")
      .populate("alajoId", "name phone")
      .populate("groupId", "name cycleType");

    if (!receipt) {
      return res.status(404).json({
        success: false,
        message: "Receipt not found"
      });
    }

    // Format for display
    const formatted = receipt.formatForDisplay();

    res.status(200).json({
      success: true,
      receipt,
      formatted
    });

  } catch (error) {
    console.error("❌ Error fetching receipt:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching receipt",
      error: error.message
    });
  }
};

// ── GET ALL RECEIPTS FOR GROUP ───────────────────────────────────────────
exports.getGroupReceipts = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { status, cycle } = req.query;

    // Build filter
    let filter = { groupId };
    if (status) filter.status = status;
    if (cycle) filter.cycle = parseInt(cycle);

    const receipts = await Receipt.find(filter)
      .populate("contributorId", "name phone")
      .populate("alajoId", "name")
      .sort({ createdAt: -1 });

    // Calculate totals
    const totals = {
      count: receipts.length,
      totalCollected: receipts.reduce((sum, r) => sum + r.contributionAmount, 0),
      totalCommission: receipts.reduce((sum, r) => sum + r.commissionAmount, 0),
      totalForPayout: receipts.reduce((sum, r) => sum + r.amountForPayout, 0),
      completedCount: receipts.filter(r => r.status === "completed").length,
      verifiedCount: receipts.filter(r => r.status === "verified").length
    };

    res.status(200).json({
      success: true,
      totals,
      receipts
    });

  } catch (error) {
    console.error("❌ Error fetching group receipts:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching receipts",
      error: error.message
    });
  }
};

// ── GET CONTRIBUTOR'S RECEIPTS ───────────────────────────────────────────
exports.getContributorReceipts = async (req, res) => {
  try {
    const { groupId, contributorId } = req.params;

    const receipts = await Receipt.find({
      groupId,
      contributorId
    })
      .populate("groupId", "name")
      .sort({ createdAt: -1 });

    if (receipts.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No receipts found for this contributor"
      });
    }

    // Calculate stats
    const stats = {
      totalReceipts: receipts.length,
      totalPaid: receipts.reduce((sum, r) => sum + r.contributionAmount, 0),
      totalCommissionDeducted: receipts.reduce((sum, r) => sum + r.commissionAmount, 0),
      totalForPayout: receipts.reduce((sum, r) => sum + r.amountForPayout, 0),
      completedReceipts: receipts.filter(r => r.status === "completed").length
    };

    res.status(200).json({
      success: true,
      stats,
      receipts
    });

  } catch (error) {
    console.error("❌ Error fetching contributor receipts:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching receipts",
      error: error.message
    });
  }
};

// ── GET RECEIPT BY TRANSACTION REFERENCE ─────────────────────────────────
exports.getReceiptByReference = async (req, res) => {
  try {
    const { transactionRef } = req.params;

    const receipt = await Receipt.findOne({ transactionRef })
      .populate("contributorId", "name phone")
      .populate("alajoId", "name")
      .populate("groupId", "name");

    if (!receipt) {
      return res.status(404).json({
        success: false,
        message: "Receipt not found with this reference"
      });
    }

    res.status(200).json({
      success: true,
      receipt
    });

  } catch (error) {
    console.error("❌ Error fetching receipt by reference:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching receipt",
      error: error.message
    });
  }
};

// ── VERIFY RECEIPT ───────────────────────────────────────────────────────
exports.verifyReceipt = async (req, res) => {
  try {
    const { receiptId } = req.params;
    const verifiedBy = req.user.id;

    const receipt = await Receipt.findById(receiptId);

    if (!receipt) {
      return res.status(404).json({
        success: false,
        message: "Receipt not found"
      });
    }

    // Verify the receipt
    await receipt.verify(verifiedBy);

    console.log("✅ Receipt verified:", receiptId);

    res.status(200).json({
      success: true,
      message: "Receipt verified successfully",
      receipt
    });

  } catch (error) {
    console.error("❌ Error verifying receipt:", error);
    res.status(500).json({
      success: false,
      message: "Error verifying receipt",
      error: error.message
    });
  }
};

// ── GET RECEIPTS BY CYCLE ────────────────────────────────────────────────
exports.getReceiptsByCycle = async (req, res) => {
  try {
    const { groupId, cycle } = req.params;

    const receipts = await Receipt.find({
      groupId,
      cycle
    })
      .populate("contributorId", "name phone")
      .sort({ createdAt: -1 });

    if (receipts.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No receipts found for this cycle"
      });
    }

    // Calculate cycle totals
    const cycleTotals = {
      cycle,
      totalReceipts: receipts.length,
      totalCollected: receipts.reduce((sum, r) => sum + r.contributionAmount, 0),
      totalCommission: receipts.reduce((sum, r) => sum + r.commissionAmount, 0),
      totalForPayout: receipts.reduce((sum, r) => sum + r.amountForPayout, 0)
    };

    res.status(200).json({
      success: true,
      cycleTotals,
      receipts
    });

  } catch (error) {
    console.error("❌ Error fetching cycle receipts:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching receipts",
      error: error.message
    });
  }
};

// ── GET RECEIPT SUMMARY ──────────────────────────────────────────────────
exports.getReceiptSummary = async (req, res) => {
  try {
    const { groupId } = req.params;

    const receipts = await Receipt.find({ groupId });

    if (receipts.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No receipts found for this group"
      });
    }

    const summary = {
      groupId,
      totalReceipts: receipts.length,
      totalCollected: receipts.reduce((sum, r) => sum + r.contributionAmount, 0),
      totalCommissionEarned: receipts.reduce((sum, r) => sum + r.commissionAmount, 0),
      totalForPayout: receipts.reduce((sum, r) => sum + r.amountForPayout, 0),
      completedReceipts: receipts.filter(r => r.status === "completed").length,
      verifiedReceipts: receipts.filter(r => r.status === "verified").length,
      pendingReceipts: receipts.filter(r => r.status === "pending").length,
      averageCommissionPercentage: (
        receipts.reduce((sum, r) => sum + r.commissionPercentage, 0) / receipts.length
      ).toFixed(2)
    };

    res.status(200).json({
      success: true,
      summary
    });

  } catch (error) {
    console.error("❌ Error getting receipt summary:", error);
    res.status(500).json({
      success: false,
      message: "Error getting receipt summary",
      error: error.message
    });
  }
};

// ── EXPORT RECEIPTS AS PDF/CSV ───────────────────────────────────────────
exports.exportReceiptsReport = async (req, res) => {
  try {
    const { groupId, format } = req.params; // format: pdf or csv

    const receipts = await Receipt.find({ groupId })
      .populate("contributorId", "name phone")
      .sort({ createdAt: -1 });

    if (receipts.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No receipts to export"
      });
    }

    // For now, just return as JSON
    // In production, you'd use libraries like pdfkit or csv-writer
    const report = {
      exportDate: new Date(),
      groupId,
      totalReceipts: receipts.length,
      data: receipts.map(r => ({
        receiptNumber: r.receiptNumber,
        contributor: r.contributorId?.name,
        amount: r.contributionAmount,
        commission: r.commissionAmount,
        payout: r.amountForPayout,
        status: r.status,
        date: r.createdAt
      }))
    };

    res.status(200).json({
      success: true,
      report
    });

  } catch (error) {
    console.error("❌ Error exporting receipts:", error);
    res.status(500).json({
      success: false,
      message: "Error exporting receipts",
      error: error.message
    });
  }
};

module.exports = exports;