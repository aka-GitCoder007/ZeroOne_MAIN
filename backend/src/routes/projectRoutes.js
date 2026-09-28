import express from 'express';
import { getProjects, getProjectById, createProject, updateProject, deleteProject } from '../controllers/projectController.js';
import { protectAdmin, authorizeRoles } from '../middleware/authMiddleware.js';
import { validateProjectPayload, validateObjectIdParam } from '../middleware/validationMiddleware.js';

const router = express.Router();

router.get('/', getProjects);
router.get('/:id', validateObjectIdParam, getProjectById);
router.post('/', protectAdmin, authorizeRoles('innovation_manager'), validateProjectPayload, createProject);
router.put('/:id', protectAdmin, authorizeRoles('innovation_manager'), validateObjectIdParam, validateProjectPayload, updateProject);
router.delete('/:id', protectAdmin, authorizeRoles('innovation_manager'), validateObjectIdParam, deleteProject);

export default router;
