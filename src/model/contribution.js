// ─────────────────────────────────────────────────────────────────────────
// Contribution Model - Track all contributions per cycle
// ─────────────────────────────────────────────────────────────────────────

const mongoose = require('mongoose');

const contributionSchema = new mongoose.Schema(
  {
    // IDs
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Group',
      required: true,
      index: true
    },
    contributorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AuthPage',
      required: true,
      index: true
    },
    alajoId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AuthPage',
      required: true,
      index: true
    },

    // Contribution Details
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    cycle: {
      type: Number,
      required: true,
      default: 1
    },
    cycleStartDate: {
      type: Date,
      required: true
    },
    cycleEndDate: {
      type: Date,
      required: true
    },

    // Payment Details
    paymentDate: {
      type: Date,
      default: Date.now,
      index: true
    },
    paymentMethod: {
      type: String,
      enum: ['cash', 'bank_transfer', 'mobile_money', 'card'],
      required: true
    },
    transactionRef: {
      type: String,
      unique: true,
      sparse: true
    },

    // Status
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'reversed'],
      default: 'pending',
      index: true
    },
    isOnTime: {
      type: Boolean,
      default: true
    },
    daysLate: {
      type: Number,
      default: 0
    },

    // Bank Details (for verification)
    bankName: String,
    accountNumber: String,
    accountHolder: String,

    // Notes
    notes: String,
    receiptId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Receipt',
      sparse: true
    },

    createdAt: {
      type: Date,
      default: Date.now,
      index: true
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

// Indexes for efficient queries
contributionSchema.index({ groupId: 1, cycle: 1 });
contributionSchema.index({ groupId: 1, contributorId: 1 });
contributionSchema.index({ alajoId: 1, paymentDate: -1 });
contributionSchema.index({ status: 1, paymentDate: -1 });

// Virtual for display
contributionSchema.virtual('displayStatus').get(function() {
  if (this.status === 'completed') return 'Completed';
  if (this.status === 'pending') return 'Pending';
  if (this.status === 'failed') return 'Failed';
  return 'Reversed';
});

module.exports = mongoose.model('Contribution', contributionSchema, 'contributions');