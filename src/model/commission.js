// ─────────────────────────────────────────────────────────────────────────
// Commission Model - Track commission settings and earnings
// ─────────────────────────────────────────────────────────────────────────

const mongoose = require('mongoose');

const commissionSchema = new mongoose.Schema(
  {
    // IDs
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Group',
      required: true,
      unique: true,
      index: true
    },
    alajoId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AuthPage',
      required: true,
      index: true
    },

    // Commission Settings
    commissionAmount: {
      type: Number,
      required: true,
      default: 10
    },

    // Earnings Tracking
    totalCollected: {
      type: Number,
      default: 0,
      min: 0
    },
    totalCommissionEarned: {
      type: Number,
      default: 0,
      min: 0
    },
    totalPayoutsDistributed: {
      type: Number,
      default: 0,
      min: 0
    },

    // Breakdown by Cycle
    cycleBreakdown: [
      {
        cycle: Number,
        cycleStartDate: Date,
        cycleEndDate: Date,
        collected: Number,
        commissionEarned: Number,
        payoutDistributed: Number,
        contributors: Number,
        createdAt: Date
      }
    ],

    // Status
    isActive: {
      type: Boolean,
      default: true,
      index: true
    },

    // Dates
    createdAt: {
      type: Date,
      default: Date.now
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

// Calculate available for payout
commissionSchema.virtual('availableForPayout').get(function() {
  return this.totalCollected - this.totalCommissionEarned;
});

// Virtual for commission breakdown
commissionSchema.virtual('commissionBreakdown').get(function() {
  return {
    percentage: this.commissionPercentage,
    totalEarned: this.totalCommissionEarned,
    totalCollected: this.totalCollected,
    availableForPayout: this.availableForPayout
  };
});

// Method to calculate commission for amount
commissionSchema.methods.calculateCommission = function(amount) {
  return (amount * this.commissionPercentage) / 100;
};

// Method to get current cycle breakdown
commissionSchema.methods.getCurrentCycleBreakdown = function() {
  if (this.cycleBreakdown.length === 0) return null;
  return this.cycleBreakdown[this.cycleBreakdown.length - 1];
};

module.exports = mongoose.model('Commission', commissionSchema, 'commissions');