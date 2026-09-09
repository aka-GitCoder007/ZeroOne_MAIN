import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema(
  {
    orderId: {
      type: String,
      required: [true, 'Order ID is required'],
      unique: true,
      trim: true,
      index: true
    },
    paymentId: {
      type: String,
      trim: true,
      index: true
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [1, 'Amount must be at least 1']
    },
    currency: {
      type: String,
      default: 'INR'
    },
    status: {
      type: String,
      enum: {
        values: ['Created', 'Paid', 'Failed'],
        message: 'Status must be Created, Paid, or Failed'
      },
      default: 'Created',
      index: true
    }
  },
  {
    timestamps: true
  }
);

paymentSchema.index({ createdAt: -1 });

const Payment = mongoose.models.Payment || mongoose.model('Payment', paymentSchema);
export default Payment;
