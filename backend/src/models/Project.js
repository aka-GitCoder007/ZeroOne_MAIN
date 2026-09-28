import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema(
  {
    customerName: {
      type: String,
      required: [true, 'Customer name is required'],
      trim: true,
      maxlength: [100, 'Customer name must be at most 100 characters long']
    },
    name: {
      type: String,
      required: [true, 'Project name is required'],
      trim: true,
      maxlength: [100, 'Project name must be at most 100 characters long']
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative']
    },
    image: {
      type: String,
      trim: true
    },
    websiteUrl: {
      type: String,
      trim: true
    },
    status: {
      type: String,
      enum: {
        values: ['Pending', 'Delivered'],
        message: 'Status must be either Pending or Delivered'
      },
      default: 'Pending',
      index: true
    },
    date: {
      type: Date,
      required: [true, 'Date is required'],
      index: true
    },
    showInWork: {
      type: Boolean,
      default: true,
      index: true
    },
    showInClientReviews: {
      type: Boolean,
      default: false,
      index: true
    },
    subtitle: {
      type: String,
      trim: true,
      maxlength: [200, 'Subtitle must be at most 200 characters long']
    },
    description: {
      type: String,
      trim: true,
      maxlength: [2000, 'Description must be at most 2000 characters long']
    },
    category: {
      type: String,
      trim: true,
      maxlength: [50, 'Category must be at most 50 characters long']
    },
    badge: {
      type: String,
      trim: true,
      maxlength: [40, 'Badge must be at most 40 characters long']
    },
    technologies: {
      type: [String],
      default: []
    },
    ctaText: {
      type: String,
      trim: true,
      maxlength: [50, 'CTA text must be at most 50 characters long']
    }
  },
  {
    timestamps: true
  }
);

// Compound index for efficient query filtering
projectSchema.index({ showInWork: 1, date: -1 });
projectSchema.index({ showInClientReviews: 1, date: -1 });

const Project = mongoose.models.Project || mongoose.model('Project', projectSchema);
export default Project;
