exports.up = function(knex) {
  return knex.schema.createTable('applications', table => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('job_id').references('id').inTable('jobs').onDelete('CASCADE');
    table.uuid('applicant_id').references('id').inTable('users').onDelete('CASCADE');
    table.uuid('tenant_id').references('id').inTable('tenants').onDelete('CASCADE');
    table.text('cover_letter');
    table.string('resume_filename');
    table.string('resume_url');
    table.jsonb('parsed_resume_data');
    table.decimal('match_score', 5, 2);
    table.jsonb('match_analysis');
    table.enum('status', ['pending', 'screening', 'interviewing', 'offered', 'hired', 'rejected']).defaultTo('pending');
    table.text('notes');
    table.jsonb('interview_stages');
    table.uuid('assigned_recruiter').references('id').inTable('users');
    table.timestamp('submitted_at').defaultTo(knex.fn.now());
    table.timestamp('last_action_at').defaultTo(knex.fn.now());
    table.timestamps(true, true);
    
    table.unique(['job_id', 'applicant_id']);
    table.index(['tenant_id', 'status']);
    table.index(['assigned_recruiter']);
    table.index(['match_score']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('applications');
};