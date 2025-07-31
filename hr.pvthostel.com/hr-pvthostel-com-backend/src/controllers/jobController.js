const knex = require('../config/database');
const logger = require('../utils/logger');

class JobController {
  async getJobs(req, res) {
    try {
      const { 
        page = 1, 
        limit = 20, 
        category, 
        location, 
        remote, 
        employment_type,
        experience_level,
        tenant_id 
      } = req.query;

      const offset = (page - 1) * limit;
      
      let query = knex('jobs')
        .select([
          'jobs.*',
          'job_categories.name as category_name',
          'users.first_name as created_by_name',
          'users.last_name as created_by_last_name'
        ])
        .leftJoin('job_categories', 'jobs.category_id', 'job_categories.id')
        .leftJoin('users', 'jobs.created_by', 'users.id')
        .where('jobs.status', 'published')
        .orderBy('jobs.created_at', 'desc');

      if (tenant_id) {
        query = query.where('jobs.tenant_id', tenant_id);
      }

      if (category) {
        query = query.where('job_categories.slug', category);
      }

      if (location) {
        query = query.whereRaw("jobs.location->>'city' ILIKE ?", [`%${location}%`]);
      }

      if (remote === 'true') {
        query = query.where('jobs.is_remote', true);
      }

      if (employment_type) {
        query = query.where('jobs.employment_type', employment_type);
      }

      if (experience_level) {
        query = query.where('jobs.experience_level', experience_level);
      }

      const [jobs, totalCount] = await Promise.all([
        query.clone().limit(limit).offset(offset),
        query.clone().count('* as count').first()
      ]);

      res.json({
        jobs,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: parseInt(totalCount.count),
          pages: Math.ceil(totalCount.count / limit)
        }
      });
    } catch (error) {
      logger.error('Error fetching jobs:', error);
      res.status(500).json({ error: 'Failed to fetch jobs' });
    }
  }

  async searchJobs(req, res) {
    try {
      const { q, tenant_id } = req.query;
      
      if (!q) {
        return res.status(400).json({ error: 'Search query is required' });
      }

      let query = knex('jobs')
        .select([
          'jobs.*',
          'job_categories.name as category_name'
        ])
        .leftJoin('job_categories', 'jobs.category_id', 'job_categories.id')
        .where('jobs.status', 'published')
        .where(function() {
          this.whereRaw('jobs.title ILIKE ?', [`%${q}%`])
              .orWhereRaw('jobs.description ILIKE ?', [`%${q}%`])
              .orWhereRaw('jobs.requirements ILIKE ?', [`%${q}%`]);
        })
        .orderBy('jobs.created_at', 'desc');

      if (tenant_id) {
        query = query.where('jobs.tenant_id', tenant_id);
      }

      const jobs = await query.limit(50);

      res.json({ jobs });
    } catch (error) {
      logger.error('Error searching jobs:', error);
      res.status(500).json({ error: 'Failed to search jobs' });
    }
  }

  async getJobBySlug(req, res) {
    try {
      const { slug } = req.params;
      const { tenant_id } = req.query;

      let query = knex('jobs')
        .select([
          'jobs.*',
          'job_categories.name as category_name',
          'job_categories.slug as category_slug',
          'users.first_name as created_by_name',
          'users.last_name as created_by_last_name'
        ])
        .leftJoin('job_categories', 'jobs.category_id', 'job_categories.id')
        .leftJoin('users', 'jobs.created_by', 'users.id')
        .where('jobs.slug', slug)
        .where('jobs.status', 'published')
        .first();

      if (tenant_id) {
        query = query.where('jobs.tenant_id', tenant_id);
      }

      const job = await query;

      if (!job) {
        return res.status(404).json({ error: 'Job not found' });
      }

      res.json({ job });
    } catch (error) {
      logger.error('Error fetching job:', error);
      res.status(500).json({ error: 'Failed to fetch job' });
    }
  }

  async getJobCategories(req, res) {
    try {
      const categories = await knex('job_categories')
        .select('*')
        .where('is_active', true)
        .orderBy('sort_order')
        .orderBy('name');

      res.json({ categories });
    } catch (error) {
      logger.error('Error fetching job categories:', error);
      res.status(500).json({ error: 'Failed to fetch job categories' });
    }
  }

  async createJob(req, res) {
    try {
      const jobData = {
        ...req.body,
        tenant_id: req.user.tenant_id,
        created_by: req.user.id,
        slug: req.body.title.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-')
      };

      const [job] = await knex('jobs').insert(jobData).returning('*');

      logger.info(`Job created: ${job.id} by user ${req.user.id}`);
      res.status(201).json({ job });
    } catch (error) {
      logger.error('Error creating job:', error);
      res.status(500).json({ error: 'Failed to create job' });
    }
  }

  async updateJob(req, res) {
    try {
      const { id } = req.params;
      const updateData = {
        ...req.body,
        updated_at: new Date()
      };

      if (req.body.title) {
        updateData.slug = req.body.title.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
      }

      const [job] = await knex('jobs')
        .where({ id, tenant_id: req.user.tenant_id })
        .update(updateData)
        .returning('*');

      if (!job) {
        return res.status(404).json({ error: 'Job not found' });
      }

      logger.info(`Job updated: ${job.id} by user ${req.user.id}`);
      res.json({ job });
    } catch (error) {
      logger.error('Error updating job:', error);
      res.status(500).json({ error: 'Failed to update job' });
    }
  }

  async deleteJob(req, res) {
    try {
      const { id } = req.params;

      const deleted = await knex('jobs')
        .where({ id, tenant_id: req.user.tenant_id })
        .del();

      if (!deleted) {
        return res.status(404).json({ error: 'Job not found' });
      }

      logger.info(`Job deleted: ${id} by user ${req.user.id}`);
      res.json({ message: 'Job deleted successfully' });
    } catch (error) {
      logger.error('Error deleting job:', error);
      res.status(500).json({ error: 'Failed to delete job' });
    }
  }

  async updateJobStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const [job] = await knex('jobs')
        .where({ id, tenant_id: req.user.tenant_id })
        .update({ status, updated_at: new Date() })
        .returning('*');

      if (!job) {
        return res.status(404).json({ error: 'Job not found' });
      }

      logger.info(`Job status updated: ${job.id} to ${status} by user ${req.user.id}`);
      res.json({ job });
    } catch (error) {
      logger.error('Error updating job status:', error);
      res.status(500).json({ error: 'Failed to update job status' });
    }
  }
}

module.exports = new JobController();