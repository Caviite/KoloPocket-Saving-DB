const mongoose = require("mongoose");

const groupSchema = new mongoose.Schema(
  {
    // ── Basic Info ──────────────────────────────────────────────────────────
    name: {
      type: String,
      required: [true, "Group name is required"],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: null,
    },

    // ── Cycle Information ───────────────────────────────────────────────────
    cycleType: {
      type: String,
      enum: ["daily", "weekly", "monthly"],
      required: [true, "Cycle type is required"],
    },
    amount: {
      type: Number,
      required: [true, "Amount per cycle is required"],
      min: [1, "Amount must be at least ₦1"],
    },
    commissionAmount: {
      type: Number,
      default: 0
    },
    cycleDuration: {
      type: Number,
      required: [true, "Cycle duration is required"],
      min: [1, "Duration must be at least 1"],
      // e.g., 30 for 30 days, 4 for 4 weeks, 12 for 12 months
    },
    startDate: {
      type: Date,
      required: [true, "Start date is required"],
    },
    endDate: {
      type: Date,
      required: [true, "End date is required"],
      // Calculated from startDate + cycleDuration
    },

    // ── Progress Tracking ───────────────────────────────────────────────────
    totalCollected: {
      type: Number,
      default: 0,
      // Total money collected so far in this group
    },
    currentCycleProgress: {
      type: Number,
      default: 1
    },

    // ── Relationships ───────────────────────────────────────────────────────
    alajo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AuthPage",
      required: [true, "Alajo (creator) is required"],
    },
    contributors: [
      {
        name: {
          type: String,
          required: [true, "Contributor name is required"],
          trim: true
        },
        phone: {
          type: String,
          required: [true, "Contributor phone number is required"],
          trim: true
        },
        address: {
          type: String,
          trim: true,
          default: null
        }
      },
    ],

    // ── Status ──────────────────────────────────────────────────────────────
    status: {
      type: String,
      enum: ["active", "completed", "paused"],
      default: "active",
    },

    // ── Timestamps ──────────────────────────────────────────────────────────
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// ── Index for faster queries ────────────────────────────────────────────────
groupSchema.index({ alajo: 1 }); // Find all groups by an Alajo
groupSchema.index({ status: 1 }); // Find groups by status

module.exports = mongoose.model("Group", groupSchema);