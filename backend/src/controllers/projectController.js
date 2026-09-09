import Project from '../models/Project.js';

/**
 * @route   GET /api/v1/projects
 * @desc    Get projects list with optional section query (?section=work or ?section=reviews)
 * @access  Public
 */
export const getProjects = async (req, res, next) => {
    try {
        const { section, status } = req.query;
        const query = {};

        if (section === 'work') {
            query.showInWork = true;
        } else if (section === 'reviews') {
            query.showInClientReviews = true;
        }

        if (status) {
            query.status = status;
        }

        const projects = await Project.find(query).sort({ date: -1, createdAt: -1 });

        res.status(200).json({
            success: true,
            message: 'Projects fetched successfully',
            count: projects.length,
            data: projects
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @route   GET /api/v1/projects/:id
 * @desc    Get single project by ID
 * @access  Public
 */
export const getProjectById = async (req, res, next) => {
    try {
        const project = await Project.findById(req.params.id);
        if (!project) {
            return res.status(404).json({
                success: false,
                message: 'Project not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Project details fetched successfully',
            data: project
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @route   POST /api/v1/projects
 * @desc    Create a new project
 * @access  Private (Admin)
 */
export const createProject = async (req, res, next) => {
    try {
        const { customerName, name, price, image, websiteUrl, status, date, showInWork, showInClientReviews } = req.body;

        const project = await Project.create({
            customerName,
            name,
            price,
            image,
            websiteUrl,
            status,
            date: date || new Date(),
            showInWork: showInWork !== undefined ? showInWork : true,
            showInClientReviews: showInClientReviews !== undefined ? showInClientReviews : false
        });

        res.status(201).json({
            success: true,
            message: 'Project created successfully',
            data: project
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @route   PUT /api/v1/projects/:id
 * @desc    Update project by ID
 * @access  Private (Admin)
 */
export const updateProject = async (req, res, next) => {
    try {
        const project = await Project.findByIdAndUpdate(
            req.params.id,
            req.body,
            { returnDocument: 'after', runValidators: true }
        );

        if (!project) {
            return res.status(404).json({
                success: false,
                message: 'Project not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Project updated successfully',
            data: project
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @route   DELETE /api/v1/projects/:id
 * @desc    Delete project by ID
 * @access  Private (Admin)
 */
export const deleteProject = async (req, res, next) => {
    try {
        const project = await Project.findByIdAndDelete(req.params.id);
        if (!project) {
            return res.status(404).json({
                success: false,
                message: 'Project not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Project deleted successfully'
        });
    } catch (error) {
        next(error);
    }
};

export default {
    getProjects,
    getProjectById,
    createProject,
    updateProject,
    deleteProject
};
