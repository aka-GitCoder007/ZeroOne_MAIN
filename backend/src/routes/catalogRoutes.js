import express from 'express';
import {
    getPublicCatalog,
    getPublicCatalogBySlug,
    getAdminCatalog,
    createCatalogItem,
    updateCatalogItem,
    deleteCatalogItem
} from '../controllers/catalogController.js';
import { protectAdmin, authorizeRoles } from '../middleware/authMiddleware.js';
import { validateObjectIdParam } from '../middleware/validationMiddleware.js';

const router = express.Router();

// ADMIN ROUTES (Must be defined before public /:slug route to prevent route conflict)
router.get('/admin', protectAdmin, authorizeRoles('catalog_manager'), getAdminCatalog);
router.post('/', protectAdmin, authorizeRoles('catalog_manager'), createCatalogItem);
router.put('/:id', protectAdmin, authorizeRoles('catalog_manager'), validateObjectIdParam, updateCatalogItem);
router.delete('/:id', protectAdmin, authorizeRoles('catalog_manager'), validateObjectIdParam, deleteCatalogItem);

// PUBLIC ROUTES
router.get('/', getPublicCatalog);
router.get('/:slug', getPublicCatalogBySlug);

export default router;
