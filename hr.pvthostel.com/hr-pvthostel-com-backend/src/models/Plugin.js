const knex = require('../config/database');

class PluginModel {
  static tableName = 'plugins';

  static async findAll(tenantId, filters = {}) {
    let query = knex(this.tableName)
      .where('tenant_id', tenantId)
      .orderBy('created_at', 'desc');

    if (filters.category) {
      query = query.where('category', filters.category);
    }

    if (filters.status) {
      query = query.where('status', filters.status);
    }

    if (filters.is_active !== undefined) {
      query = query.where('is_active', filters.is_active);
    }

    return await query;
  }

  static async findById(id, tenantId) {
    return await knex(this.tableName)
      .where({ id, tenant_id: tenantId })
      .first();
  }

  static async create(data) {
    const [plugin] = await knex(this.tableName)
      .insert(data)
      .returning('*');
    return plugin;
  }

  static async update(id, tenantId, data) {
    const [plugin] = await knex(this.tableName)
      .where({ id, tenant_id: tenantId })
      .update({ ...data, updated_at: new Date() })
      .returning('*');
    return plugin;
  }

  static async delete(id, tenantId) {
    return await knex(this.tableName)
      .where({ id, tenant_id: tenantId })
      .del();
  }

  static async findBySlug(slug, tenantId) {
    return await knex(this.tableName)
      .where({ slug, tenant_id: tenantId })
      .first();
  }

  static async findActivePlugins(tenantId) {
    return await knex(this.tableName)
      .where({ tenant_id: tenantId, is_active: true, status: 'published' })
      .orderBy('sort_order');
  }
}

module.exports = PluginModel;