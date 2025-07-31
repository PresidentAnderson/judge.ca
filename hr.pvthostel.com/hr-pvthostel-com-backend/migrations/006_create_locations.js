exports.up = function(knex) {
  return knex.schema.createTable('locations', table => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('tenant_id').references('id').inTable('tenants').onDelete('CASCADE');
    table.string('name').notNullable();
    table.string('address_line_1');
    table.string('address_line_2');
    table.string('city').notNullable();
    table.string('state_province');
    table.string('country').notNullable();
    table.string('postal_code');
    table.decimal('latitude', 10, 8);
    table.decimal('longitude', 11, 8);
    table.string('timezone');
    table.boolean('is_headquarters').defaultTo(false);
    table.boolean('is_active').defaultTo(true);
    table.timestamps(true, true);
    
    table.index(['tenant_id', 'is_active']);
    table.index(['country', 'city']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('locations');
};