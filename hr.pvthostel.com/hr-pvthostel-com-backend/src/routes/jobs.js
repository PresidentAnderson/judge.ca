const express = require('express');
const router = express.Router();
const jobController = require('../controllers/jobController');
const { authenticate, authorize } = require('../middleware/auth');
const { validateJob } = require('../middleware/validation');

router.get('/', jobController.getJobs);
router.get('/search', jobController.searchJobs);
router.get('/categories', jobController.getJobCategories);
router.get('/:slug', jobController.getJobBySlug);

router.use(authenticate);

router.post('/', authorize(['hr_manager', 'admin']), validateJob, jobController.createJob);
router.put('/:id', authorize(['hr_manager', 'admin']), validateJob, jobController.updateJob);
router.delete('/:id', authorize(['hr_manager', 'admin']), jobController.deleteJob);
router.patch('/:id/status', authorize(['hr_manager', 'admin']), jobController.updateJobStatus);

module.exports = router;