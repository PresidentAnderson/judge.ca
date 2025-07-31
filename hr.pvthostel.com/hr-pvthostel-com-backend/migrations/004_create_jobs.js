exports.up = function(knex) {
  return knex.schema.createTable('jobs', table => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('tenant_id').references('id').inTable('tenants').onDelete('CASCADE');
    table.uuid('category_id').references('id').inTable('job_categories');
    table.uuid('created_by').references('id').inTable('users');
    table.string('title').notNullable();
    table.string('slug').notNullable();
    table.text('description').notNullable();
    table.text('requirements');
    table.text('benefits');
    table.jsonb('salary_range');
    table.string('employment_type').notNullable(); // full-time, part-time, contract, remote
    table.string('experience_level'); // entry, mid, senior, executive
    table.jsonb('location');
    table.boolean('is_remote').defaultTo(false);
    table.boolean('is_hybrid').defaultTo(false);
    table.integer('positions_available').defaultTo(1);
    table.enum('status', ['draft', 'published', 'closed', 'archived']).defaultTo('draft');
    table.date('application_deadline');
    table.jsonb('required_skills');
    table.jsonb('preferred_skills');
    table.string('department');
    table.string('reporting_manager');
    table.boolean('urgent_hiring').defaultTo(false);
    table.timestamps(true, true);
    
    table.unique(['tenant_id', 'slug']);
    table.index(['tenant_id', 'status']);
    table.index(['category_id']);
    table.index(['is_remote']);
    table.index(['employment_type']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('jobs');
};