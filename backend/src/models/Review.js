import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: [true, 'Project reference ID is required'],
      index: true
    },
    text: {
      type: String,
      required: [true, 'Review text is required'],
      trim: true,
      maxlength: [500, 'Review text must be at most 500 characters long']
    },
    author: {
      type: String,
      trim: true,
      default: 'Guest User',
      maxlength: [50, 'Author name must be at most 50 characters long']
    },
    stars: {
      type: Number,
      required: [true, 'Stars rating is required'],
      min: [1, 'Stars rating must be at least 1'],
      max: [5, 'Stars rating must be at most 5']
    },
    isApproved: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

reviewSchema.index({ projectId: 1, createdAt: -1 });

const Review = mongoose.models.Review || mongoose.model('Review', reviewSchema);
export default Review;
