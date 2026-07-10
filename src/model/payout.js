const mongoose = require("mongoose");
const { Schema } = mongoose;

const PayoutSchema = new Schema(
  {
    groupId: {
      type: Schema.Types.ObjectId,
      ref: "Group", // Links to your main Ajo Group model
      required: true,
    },
    alajoId: {
      type: Schema.Types.ObjectId,
      ref: "AuthPage", // Links to your Alajo manager user account
      required: true,
    },
    // Reference to the sub-document ID inside the group's contributors array
    contributorId: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    contributorName: {
      type: String,
      required: true, // Saved inline so history reading doesn't require complex population
    },
    cycleNumber: {
      type: Number,
      required: true, // Tracks which rotation cycle this payout belongs to (e.g., Cycle 1, Cycle 2)
    },
    totalCollectedAmount: {
      type: Number,
      required: true, // Expected full collection amount (e.g., ₦100,000)
    },
    commissionDeducted: {
      type: Number,
      required: true, // The flat commission amount set during group creation (e.g., ₦1,000)
    },
    netAmountPaid: {
      type: Number,
      required: true, // The actual cash out handed over (totalCollectedAmount - commissionDeducted)
    },
    payoutDate: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ["completed", "failed"],
      default: "completed",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Payout", PayoutSchema);