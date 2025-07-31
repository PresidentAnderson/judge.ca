exports.up = function(knex) {
  return knex.schema.createTable('plugins', table => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('tenant_id').references('id').inTable('tenants').onDelete('CASCADE');
    table.string('name').notNullable();
    table.string('slug').notNullable();
    table.text('description');
    table.string('version').notNullable();
    table.string('author');
    table.string('author_email');
    table.string('author_website');
    table.string('plugin_url');
    table.string('documentation_url');
    table.string('support_url');
    table.jsonb('manifest');
    table.jsonb('config_schema');
    table.jsonb('config_values');
    table.string('category');
    table.text('icon_url');
    table.text('banner_url');
    table.text('screenshots');
    table.enum('status', ['draft', 'published', 'deprecated', 'suspended']).defaultTo('draft');
    table.boolean('is_active').defaultTo(false);
    table.boolean('is_premium').defaultTo(false);
    table.decimal('price', 10, 2);
    table.string('billing_cycle');
    table.jsonb('permissions');
    table.jsonb('webhook_endpoints');
    table.jsonb('api_endpoints');
    table.text('installation_notes');
    table.integer('downloads').defaultTo(0);
    table.decimal('rating', 3, 2);
    table.integer('rating_count').defaultTo(0);
    table.integer('sort_order').defaultTo(0);
    table.timestamps(true, true);
    
    table.unique(['tenant_id', 'slug']);
    table.index(['tenant_id', 'status']);
    table.index(['category']);
    table.index(['is_active']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('plugins');
};