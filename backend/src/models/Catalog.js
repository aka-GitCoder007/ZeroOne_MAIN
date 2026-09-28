import mongoose from 'mongoose';

const catalogSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Catalog item title is required'],
      trim: true,
      maxlength: [120, 'Title must be at most 120 characters long']
    },
    slug: {
      type: String,
      required: [true, 'Slug is required'],
      unique: true,
      trim: true
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true
    },
    shortDescription: {
      type: String,
      required: [true, 'Short description is required'],
      maxlength: [250, 'Short description must be at most 250 characters long']
    },
    description: {
      type: String,
      maxlength: [3000, 'Description must be at most 3000 characters long']
    },
    thumbnail: {
      type: String,
      required: [true, 'Thumbnail image is required']
    },
    images: {
      type: [String],
      default: []
    },
    demoUrl: {
      type: String,
      trim: true
    },
    technologies: {
      type: [String],
      default: []
    },
    startingPrice: {
      type: Number,
      min: [0, 'Starting price cannot be negative']
    },
    badge: {
      type: String,
      trim: true,
      maxlength: [40, 'Badge must be at most 40 characters long']
    },
    featured: {
      type: Boolean,
      default: false
    },
    published: {
      type: Boolean,
      default: false
    },
    displayOrder: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

// Useful indexes for querying and sorting
catalogSchema.index({ published: 1 });
catalogSchema.index({ featured: 1 });
catalogSchema.index({ category: 1 });
catalogSchema.index({ displayOrder: 1 });
catalogSchema.index({ published: 1, category: 1, displayOrder: 1 });
catalogSchema.index({ published: 1, featured: 1, displayOrder: 1 });

const Catalog = mongoose.models.Catalog || mongoose.model('Catalog', catalogSchema);
export default Catalog;
