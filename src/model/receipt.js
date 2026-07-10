// ─────────────────────────────────────────────────────────────────────────
// Receipt Model - Auto-generated receipts for contributions
// ─────────────────────────────────────────────────────────────────────────

const mongoose = require('mongoose');

const receiptSchema = new mongoose.Schema(
  {
    // Receipt Details
    receiptNumber: {
      type: String,
      unique: true,
      receiptNumber: true,
      index: true
    },

    // IDs
    contributionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Contribution',
      required: true,
      unique: true,
      index: true
    },
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

    // Transaction Details
    contributionAmount: {
      type: Number,
      required: true,
      min: 0
    },
    cycle: {
      type: Number,
      required: true
    },
    cycleStartDate: Date,
    cycleEndDate: Date,

    // Commission Breakdown
    commissionPercentage: Number,
    commissionAmount: {
      type: Number,
      default: 0
    },
    amountForPayout: {
      type: Number,
      default: 0
    },

    // Payment Details
    paymentDate: {
      type: Date,
      required: true
    },
    paymentMethod: {
      type: String,
      enum: ['cash', 'bank_transfer', 'mobile_money', 'card']
    },
    transactionRef: String,

    // Status
    status: {
      type: String,
      enum: ['pending', 'completed', 'verified', 'cancelled'],
      default: 'pending',
      index: true
    },
    isOnTime: {
      type: Boolean,
      default: true
    },

    // Receipt Info
    description: String,
    notes: String,
    generatedAt: {
      type: Date,
      default: Date.now
    },
    verifiedAt: Date,
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AuthPage'
    },

    // Digital Signature/Hash (for verification)
    receiptHash: String,

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

// Index for efficient queries
receiptSchema.index({ groupId: 1, createdAt: -1 });
receiptSchema.index({ contributorId: 1, createdAt: -1 });
receiptSchema.index({ alajoId: 1, createdAt: -1 });
receiptSchema.index({ status: 1, createdAt: -1 });

// Generate receipt number before save
receiptSchema.pre('save', async function() {
  if (this.isNew && !this.receiptNumber) {
    const count = await mongoose.model('Receipt').countDocuments();
    this.receiptNumber = `RCP-${Date.now()}-${count + 1}`;
  }
  
});

// Method to format receipt for display
receiptSchema.methods.formatForDisplay = function() {
  return {
    receiptNumber: this.receiptNumber,
    contributorAmount: `₦${this.contributionAmount.toLocaleString('en-NG')}`,
    commissionEarned: `₦${this.commissionAmount.toLocaleString('en-NG')}`,
    payoutAmount: `₦${this.amountForPayout.toLocaleString('en-NG')}`,
    cycle: this.cycle,
    date: this.paymentDate.toLocaleDateString('en-NG'),
    status: this.status,
    transactionRef: this.transactionRef
  };
};

// Method to verify receipt
receiptSchema.methods.verify = function(verifiedBy) {
  this.status = 'verified';
  this.verifiedAt = new Date();
  this.verifiedBy = verifiedBy;
  return this.save();
};

module.exports = mongoose.model('Receipt', receiptSchema, 'receipts');