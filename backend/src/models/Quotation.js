import mongoose from 'mongoose';

const quotationSchema = new mongoose.Schema(
  {
    requestId: {
      type: String,
      required: [true, 'Request ID is required'],
      unique: true,
      uppercase: true,
      trim: true,
      index: true
    },
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
      maxlength: [100, 'Full name must be at most 100 characters long']
    },
    companyName: {
      type: String,
      trim: true,
      maxlength: [100, 'Company name must be at most 100 characters long']
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      trim: true,
      lowercase: true,
      index: true
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true
    },
    services: {
      type: [String],
      required: [true, 'At least one service selection is required'],
      default: []
    },
    otherService: {
      type: String,
      trim: true,
      maxlength: [100, 'Other service details must be at most 100 characters long']
    },
    projectName: {
      type: String,
      required: [true, 'Project name is required'],
      trim: true,
      maxlength: [150, 'Project name must be at most 150 characters long']
    },
    description: {
      type: String,
      required: [true, 'Project description is required'],
      trim: true,
      maxlength: [1000, 'Description must be at most 1000 characters long']
    },
    hasExistingWebsite: {
      type: Boolean,
      default: false
    },
    websiteUrl: {
      type: String,
      trim: true
    },
    budget: {
      type: String,
      required: [true, 'Budget selection is required'],
      trim: true
    },
    timeline: {
      type: String,
      required: [true, 'Timeline selection is required'],
      trim: true
    },
    contactPreference: {
      type: [String],
      default: ['Email']
    },
    additionalInformation: {
      type: String,
      trim: true,
      maxlength: [500, 'Additional information must be at most 500 characters long']
    },
    status: {
      type: String,
      enum: {
        values: ['New', 'Contacted', 'Quoted', 'Converted', 'Closed'],
        message: 'Status must be New, Contacted, Quoted, Converted, or Closed'
      },
      default: 'New',
      index: true
    }
  },
  {
    timestamps: true
  }
);

quotationSchema.index({ createdAt: -1 });
quotationSchema.index({ status: 1, createdAt: -1 });

const Quotation = mongoose.models.Quotation || mongoose.model('Quotation', quotationSchema);
export default Quotation;
