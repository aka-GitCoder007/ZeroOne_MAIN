import Catalog from '../models/Catalog.js';

/**
 * @route   GET /api/v1/catalog
 * @desc    Get published catalog items with optional filtering (?category=Gym&featured=true)
 * @access  Public
 */
export const getPublicCatalog = async (req, res, next) => {
    try {
        const { category, featured } = req.query;
        const query = { published: true };

        if (category) {
            query.category = String(category).trim();
        }

        if (featured !== undefined) {
            query.featured = featured === 'true';
        }

        const items = await Catalog.find(query).sort({ displayOrder: 1, createdAt: -1 });

        res.status(200).json({
            success: true,
            message: 'Catalog items fetched successfully',
            count: items.length,
            data: items
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @route   GET /api/v1/catalog/:slug
 * @desc    Get single published catalog item by slug
 * @access  Public
 */
export const getPublicCatalogBySlug = async (req, res, next) => {
    try {
        const { slug } = req.params;

        const item = await Catalog.findOne({ slug: slug.trim(), published: true });

        if (!item) {
            return res.status(404).json({
                success: false,
                message: 'Catalog item not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Catalog item fetched successfully',
            data: item
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @route   GET /api/v1/catalog/admin
 * @desc    Get all catalog items (published & unpublished) for admin
 * @access  Private (Admin)
 */
export const getAdminCatalog = async (req, res, next) => {
    try {
        const items = await Catalog.find({}).sort({ displayOrder: 1, createdAt: -1 });

        res.status(200).json({
            success: true,
            message: 'Catalog items fetched successfully',
            count: items.length,
            data: items
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @route   POST /api/v1/catalog
 * @desc    Create a new catalog item
 * @access  Private (Admin)
 */
export const createCatalogItem = async (req, res, next) => {
    try {
        const {
            title,
            slug,
            category,
            shortDescription,
            description,
            thumbnail,
            images,
            demoUrl,
            technologies,
            startingPrice,
            badge,
            featured,
            published,
            displayOrder
        } = req.body;

        // Manual validation for required fields
        if (!title || typeof title !== 'string' || !title.trim()) {
            return res.status(400).json({ success: false, message: 'Title is required' });
        }
        if (!slug || typeof slug !== 'string' || !slug.trim()) {
            return res.status(400).json({ success: false, message: 'Slug is required' });
        }
        if (!category || typeof category !== 'string' || !category.trim()) {
            return res.status(400).json({ success: false, message: 'Category is required' });
        }
        if (!shortDescription || typeof shortDescription !== 'string' || !shortDescription.trim()) {
            return res.status(400).json({ success: false, message: 'Short description is required' });
        }
        if (!thumbnail || typeof thumbnail !== 'string' || !thumbnail.trim()) {
            return res.status(400).json({ success: false, message: 'Thumbnail is required' });
        }
        if (startingPrice !== undefined && startingPrice !== null && (typeof startingPrice !== 'number' || startingPrice < 0)) {
            return res.status(400).json({ success: false, message: 'Starting price cannot be negative' });
        }

        const trimmedSlug = slug.trim();

        // Check for duplicate slug
        const existingItem = await Catalog.findOne({ slug: trimmedSlug });
        if (existingItem) {
            return res.status(409).json({
                success: false,
                message: 'Catalog slug already exists'
            });
        }

        const item = await Catalog.create({
            title: title.trim(),
            slug: trimmedSlug,
            category: category.trim(),
            shortDescription: shortDescription.trim(),
            description: description ? description.trim() : undefined,
            thumbnail: thumbnail.trim(),
            images: Array.isArray(images) ? images : [],
            demoUrl: demoUrl ? demoUrl.trim() : undefined,
            technologies: Array.isArray(technologies) ? technologies : [],
            startingPrice: startingPrice !== undefined ? startingPrice : undefined,
            badge: badge ? badge.trim() : undefined,
            featured: Boolean(featured),
            published: Boolean(published),
            displayOrder: displayOrder !== undefined ? Number(displayOrder) : 0
        });

        res.status(201).json({
            success: true,
            message: 'Catalog item created successfully',
            data: item
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: 'Catalog slug already exists'
            });
        }
        next(error);
    }
};

/**
 * @route   PUT /api/v1/catalog/:id
 * @desc    Update catalog item by ID
 * @access  Private (Admin)
 */
export const updateCatalogItem = async (req, res, next) => {
    try {
        const { id } = req.params;

        // Prevent mutation of internal fields
        const updateData = { ...req.body };
        delete updateData._id;
        delete updateData.createdAt;
        delete updateData.updatedAt;

        if (updateData.startingPrice !== undefined && updateData.startingPrice !== null && (typeof updateData.startingPrice !== 'number' || updateData.startingPrice < 0)) {
            return res.status(400).json({ success: false, message: 'Starting price cannot be negative' });
        }

        if (updateData.slug) {
            updateData.slug = updateData.slug.trim();
            const duplicateSlug = await Catalog.findOne({ slug: updateData.slug, _id: { $ne: id } });
            if (duplicateSlug) {
                return res.status(409).json({
                    success: false,
                    message: 'Catalog slug already exists'
                });
            }
        }

        const item = await Catalog.findByIdAndUpdate(
            id,
            updateData,
            { returnDocument: 'after', runValidators: true }
        );

        if (!item) {
            return res.status(404).json({
                success: false,
                message: 'Catalog item not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Catalog item updated successfully',
            data: item
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: 'Catalog slug already exists'
            });
        }
        next(error);
    }
};

/**
 * @route   DELETE /api/v1/catalog/:id
 * @desc    Delete catalog item by ID
 * @access  Private (Admin)
 */
export const deleteCatalogItem = async (req, res, next) => {
    try {
        const { id } = req.params;

        const item = await Catalog.findByIdAndDelete(id);

        if (!item) {
            return res.status(404).json({
                success: false,
                message: 'Catalog item not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Catalog item deleted successfully'
        });
    } catch (error) {
        next(error);
    }
};

export default {
    getPublicCatalog,
    getPublicCatalogBySlug,
    getAdminCatalog,
    createCatalogItem,
    updateCatalogItem,
    deleteCatalogItem
};
