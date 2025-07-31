const PluginModel = require('../models/Plugin');
const logger = require('../utils/logger');
const axios = require('axios');
const crypto = require('crypto');

class PluginManager {
  constructor() {
    this.loadedPlugins = new Map();
    this.hooks = new Map();
    this.apiRoutes = new Map();
  }

  // Plugin lifecycle management
  async installPlugin(tenantId, pluginData) {
    try {
      // Validate plugin manifest
      this.validateManifest(pluginData.manifest);
      
      // Check for conflicts
      await this.checkConflicts(tenantId, pluginData);
      
      // Install plugin
      const plugin = await PluginModel.create({
        ...pluginData,
        tenant_id: tenantId,
        status: 'published',
        is_active: false
      });

      logger.info(`Plugin installed: ${plugin.slug} for tenant ${tenantId}`);
      return plugin;
    } catch (error) {
      logger.error('Plugin installation failed:', error);
      throw new Error(`Plugin installation failed: ${error.message}`);
    }
  }

  async activatePlugin(tenantId, pluginId) {
    try {
      const plugin = await PluginModel.findById(pluginId, tenantId);
      if (!plugin) {
        throw new Error('Plugin not found');
      }

      // Load plugin into memory
      await this.loadPlugin(plugin);
      
      // Activate in database
      await PluginModel.update(pluginId, tenantId, { is_active: true });
      
      // Register plugin hooks and routes
      this.registerPluginHooks(plugin);
      this.registerPluginRoutes(plugin);

      logger.info(`Plugin activated: ${plugin.slug} for tenant ${tenantId}`);
      return true;
    } catch (error) {
      logger.error('Plugin activation failed:', error);
      throw new Error(`Plugin activation failed: ${error.message}`);
    }
  }

  async deactivatePlugin(tenantId, pluginId) {
    try {
      const plugin = await PluginModel.findById(pluginId, tenantId);
      if (!plugin) {
        throw new Error('Plugin not found');
      }

      // Unregister hooks and routes
      this.unregisterPluginHooks(plugin);
      this.unregisterPluginRoutes(plugin);
      
      // Remove from memory
      this.loadedPlugins.delete(`${tenantId}:${plugin.slug}`);
      
      // Deactivate in database
      await PluginModel.update(pluginId, tenantId, { is_active: false });

      logger.info(`Plugin deactivated: ${plugin.slug} for tenant ${tenantId}`);
      return true;
    } catch (error) {
      logger.error('Plugin deactivation failed:', error);
      throw new Error(`Plugin deactivation failed: ${error.message}`);
    }
  }

  async uninstallPlugin(tenantId, pluginId) {
    try {
      // Deactivate first
      await this.deactivatePlugin(tenantId, pluginId);
      
      // Remove from database
      await PluginModel.delete(pluginId, tenantId);

      logger.info(`Plugin uninstalled: ${pluginId} for tenant ${tenantId}`);
      return true;
    } catch (error) {
      logger.error('Plugin uninstall failed:', error);
      throw new Error(`Plugin uninstall failed: ${error.message}`);
    }
  }

  // Plugin execution and hooks
  async executeHook(hookName, tenantId, data = {}) {
    const hooks = this.hooks.get(hookName) || [];
    const results = [];

    for (const hook of hooks) {
      if (hook.tenantId === tenantId || hook.global) {
        try {
          const result = await this.callPluginHook(hook, data);
          results.push(result);
        } catch (error) {
          logger.error(`Hook execution failed: ${hookName}`, error);
        }
      }
    }

    return results;
  }

  async callPluginHook(hook, data) {
    try {
      if (hook.type === 'url') {
        const response = await axios.post(hook.endpoint, {
          ...data,
          hook: hook.name,
          timestamp: Date.now(),
          signature: this.generateSignature(data, hook.secret)
        }, {
          timeout: 10000,
          headers: {
            'Content-Type': 'application/json',
            'X-Plugin-Hook': hook.name,
            'X-Tenant-ID': hook.tenantId
          }
        });
        return response.data;
      } else if (hook.type === 'function') {
        return await hook.handler(data);
      }
    } catch (error) {
      logger.error(`Plugin hook call failed: ${hook.name}`, error);
      throw error;
    }
  }

  // Plugin validation and security
  validateManifest(manifest) {
    const requiredFields = ['name', 'version', 'description', 'permissions'];
    
    for (const field of requiredFields) {
      if (!manifest[field]) {
        throw new Error(`Missing required manifest field: ${field}`);
      }
    }

    // Validate version format
    if (!/^\d+\.\d+\.\d+$/.test(manifest.version)) {
      throw new Error('Invalid version format. Use semantic versioning (e.g., 1.0.0)');
    }

    // Validate permissions
    if (!Array.isArray(manifest.permissions)) {
      throw new Error('Permissions must be an array');
    }

    const validPermissions = [
      'read:jobs', 'write:jobs',
      'read:applications', 'write:applications',
      'read:users', 'write:users',
      'read:analytics', 'write:analytics',
      'admin:settings'
    ];

    for (const permission of manifest.permissions) {
      if (!validPermissions.includes(permission)) {
        throw new Error(`Invalid permission: ${permission}`);
      }
    }
  }

  async checkConflicts(tenantId, pluginData) {
    const existingPlugin = await PluginModel.findBySlug(pluginData.slug, tenantId);
    if (existingPlugin) {
      throw new Error(`Plugin with slug '${pluginData.slug}' already exists`);
    }

    // Check for API endpoint conflicts
    if (pluginData.manifest.api_endpoints) {
      const activePlugins = await PluginModel.findActivePlugins(tenantId);
      for (const plugin of activePlugins) {
        if (plugin.manifest?.api_endpoints) {
          const conflicts = this.findEndpointConflicts(
            pluginData.manifest.api_endpoints,
            plugin.manifest.api_endpoints
          );
          if (conflicts.length > 0) {
            throw new Error(`API endpoint conflicts with plugin '${plugin.name}': ${conflicts.join(', ')}`);
          }
        }
      }
    }
  }

  findEndpointConflicts(endpoints1, endpoints2) {
    const conflicts = [];
    const routes1 = endpoints1.map(e => `${e.method}:${e.path}`);
    const routes2 = endpoints2.map(e => `${e.method}:${e.path}`);
    
    for (const route of routes1) {
      if (routes2.includes(route)) {
        conflicts.push(route);
      }
    }
    
    return conflicts;
  }

  // Plugin registration and management
  async loadPlugin(plugin) {
    try {
      const pluginKey = `${plugin.tenant_id}:${plugin.slug}`;
      
      // Load plugin configuration
      const pluginInstance = {
        id: plugin.id,
        slug: plugin.slug,
        name: plugin.name,
        version: plugin.version,
        tenantId: plugin.tenant_id,
        manifest: plugin.manifest,
        config: plugin.config_values || {},
        hooks: plugin.manifest.hooks || [],
        apiEndpoints: plugin.manifest.api_endpoints || [],
        permissions: plugin.permissions || []
      };

      this.loadedPlugins.set(pluginKey, pluginInstance);
      return pluginInstance;
    } catch (error) {
      logger.error(`Failed to load plugin: ${plugin.slug}`, error);
      throw error;
    }
  }

  registerPluginHooks(plugin) {
    if (!plugin.manifest.hooks) return;

    for (const hook of plugin.manifest.hooks) {
      const hookName = hook.name;
      if (!this.hooks.has(hookName)) {
        this.hooks.set(hookName, []);
      }

      this.hooks.get(hookName).push({
        name: hookName,
        pluginId: plugin.id,
        tenantId: plugin.tenant_id,
        type: hook.type || 'url',
        endpoint: hook.endpoint,
        handler: hook.handler,
        secret: this.generateHookSecret(plugin),
        priority: hook.priority || 10
      });
    }
  }

  unregisterPluginHooks(plugin) {
    for (const [hookName, hooks] of this.hooks.entries()) {
      const filteredHooks = hooks.filter(h => h.pluginId !== plugin.id);
      if (filteredHooks.length === 0) {
        this.hooks.delete(hookName);
      } else {
        this.hooks.set(hookName, filteredHooks);
      }
    }
  }

  registerPluginRoutes(plugin) {
    if (!plugin.manifest.api_endpoints) return;

    for (const endpoint of plugin.manifest.api_endpoints) {
      const routeKey = `${endpoint.method}:${endpoint.path}`;
      this.apiRoutes.set(routeKey, {
        pluginId: plugin.id,
        tenantId: plugin.tenant_id,
        ...endpoint
      });
    }
  }

  unregisterPluginRoutes(plugin) {
    if (!plugin.manifest.api_endpoints) return;

    for (const endpoint of plugin.manifest.api_endpoints) {
      const routeKey = `${endpoint.method}:${endpoint.path}`;
      this.apiRoutes.delete(routeKey);
    }
  }

  // Utility methods
  generateHookSecret(plugin) {
    return crypto
      .createHash('sha256')
      .update(`${plugin.id}:${plugin.tenant_id}:${Date.now()}`)
      .digest('hex');
  }

  generateSignature(data, secret) {
    return crypto
      .createHmac('sha256', secret)
      .update(JSON.stringify(data))
      .digest('hex');
  }

  verifySignature(data, signature, secret) {
    const expectedSignature = this.generateSignature(data, secret);
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
  }

  // Plugin discovery and marketplace
  async getAvailablePlugins(tenantId, category = null) {
    const filters = { status: 'published' };
    if (category) filters.category = category;
    
    return await PluginModel.findAll(tenantId, filters);
  }

  async searchPlugins(tenantId, query, category = null) {
    let queryBuilder = knex('plugins')
      .where('tenant_id', tenantId)
      .where('status', 'published')
      .where(function() {
        this.whereRaw('name ILIKE ?', [`%${query}%`])
            .orWhereRaw('description ILIKE ?', [`%${query}%`]);
      });

    if (category) {
      queryBuilder = queryBuilder.where('category', category);
    }

    return await queryBuilder.orderBy('rating', 'desc').orderBy('downloads', 'desc');
  }

  async getPluginCategories() {
    const categories = await knex('plugins')
      .distinct('category')
      .whereNotNull('category')
      .where('status', 'published');
    
    return categories.map(c => c.category);
  }

  // Plugin analytics and monitoring
  async trackPluginUsage(tenantId, pluginId, action, metadata = {}) {
    try {
      await knex('plugin_usage_logs').insert({
        tenant_id: tenantId,
        plugin_id: pluginId,
        action,
        metadata: JSON.stringify(metadata),
        created_at: new Date()
      });
    } catch (error) {
      logger.error('Failed to track plugin usage:', error);
    }
  }

  async getPluginAnalytics(tenantId, pluginId, dateRange = 30) {
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - (dateRange * 24 * 60 * 60 * 1000));

    return await knex('plugin_usage_logs')
      .select(
        knex.raw('DATE(created_at) as date'),
        knex.raw('COUNT(*) as usage_count'),
        'action'
      )
      .where('tenant_id', tenantId)
      .where('plugin_id', pluginId)
      .whereBetween('created_at', [startDate, endDate])
      .groupBy('date', 'action')
      .orderBy('date');
  }
}

module.exports = new PluginManager();