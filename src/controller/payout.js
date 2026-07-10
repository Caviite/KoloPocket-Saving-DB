const mongoose = require("mongoose");
const Payout = require("../model/payout");
const Group = require("../model/creategroup");
const Commission = require("../model/commission");
const commissionController = require("./commission");

// ── PROCESS NEW DISTRIBUTION PAYOUT ─────────────────────────────────────────
exports.triggerPayout = async (req, res) => {
  console.log("🚀 Payout settlement sequence initiated");
  
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const alajoId = req.user.id;
    const { groupId, contributorId } = req.body;

    const group = await Group.findById(groupId).session(session);
    if (!group) {
      await session.abortTransaction();
      return res.status(404).json({ success: false, message: "Ajo Group not found" });
    }

    if (group.alajo.toString() !== alajoId) {
      await session.abortTransaction();
      return res.status(403).json({ success: false, message: "Unauthorized action on this group" });
    }

    const targetContributor = group.contributors.find(
      (c) => c._id.toString() === contributorId.toString()
    );
    if (!targetContributor) {
      await session.abortTransaction();
      return res.status(404).json({ success: false, message: "Contributor profile not found in this group" });
    }

    const commissionSetup = await Commission.findOne({ groupId }).session(session);
    const flatCommissionFee = commissionSetup ? (commissionSetup.commissionAmount || 0) : 0;

    const poolAmountCollected = Number(group.amount) * group.contributors.length;
    const netPayoutAmount = poolAmountCollected - flatCommissionFee;

    if (netPayoutAmount < 0) {
      await session.abortTransaction();
      return res.status(400).json({ success: false, message: "Commission fee exceeds total collected pool amount" });
    }

    const newPayoutRecord = await Payout.create(
      [
        {
          groupId,
          alajoId,
          contributorId,
          contributorName: targetContributor.name,
          cycleNumber: group.currentCycleProgress || 1,
          totalCollectedAmount: poolAmountCollected,
          commissionDeducted: flatCommissionFee,
          netAmountPaid: netPayoutAmount,
          status: "completed",
        },
      ],
      { session }
    );

    group.currentCycleProgress = (group.currentCycleProgress || 1) + 1;
    await group.save({ session });

    await session.commitTransaction();
    session.endSession();
    console.log("✅ Main transactional ledger records committed successfully");

    // ── SYNC THE PIPELINE EFFECTIVELY ──
    try {
      req.params.groupId = groupId;
      // We pass a mock response object to prevent headers from clashing
      const mockRes = {
        status: () => ({ json: () => {} })
      };
      await commissionController.updateCommissionStats(req, mockRes);
      console.log("⚡ Commission dashboard totals synced in background safely");
    } catch (syncErr) {
      console.warn("⚠️ Transaction succeeded, but background dashboard statistics sync lagged:", syncErr.message);
    }

    return res.status(201).json({
      success: true,
      message: "Payout processed successfully and commission logged!",
      payout: newPayoutRecord[0],
    });

  } catch (error) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    session.endSession();
    console.error("❌ Payout settlement script crashed:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error executing payout routing script",
      error: error.message,
    });
  }
};

// ── FETCH CURRENT ALAJO PAYOUT AUDIT LOGS ────────────────────────────────────
exports.getPayoutHistory = async (req, res) => {
  try {
    const alajoId = req.user.id;
    const history = await Payout.find({ alajoId })
      .populate("groupId", "name cycleType amount")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: history.length,
      history,
    });
  } catch (error) {
    console.error("❌ Error loading payout history maps:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};