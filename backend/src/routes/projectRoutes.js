import express from 'express';
import { getProjects, getProjectById, createProject, updateProject, deleteProject } from '../controllers/projectController.js';
import { protectAdmin } from '../middleware/authMiddleware.js';
import { validateProjectPayload, validateObjectIdParam } from '../middleware/validationMiddleware.js';

const router = express.Router();

router.get('/', getProjects);
router.get('/:id', validateObjectIdParam, getProjectById);
router.post('/', protectAdmin, validateProjectPayload, createProject);
router.put('/:id', protectAdmin, validateObjectIdParam, validateProjectPayload, updateProject);
router.delete('/:id', protectAdmin, validateObjectIdParam, deleteProject);

export default router;
