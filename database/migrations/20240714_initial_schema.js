exports.up = function(knex) {
  return knex.raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"')
    .then(() => {
      // Users table
      return knex.schema.createTable('users', table => {
        table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
        table.string('email', 255).unique().notNullable();
        table.string('password_hash', 255).notNullable();
        table.string('first_name', 100).notNullable();
        table.string('last_name', 100).notNullable();
        table.string('phone', 20);
        table.string('preferred_language', 2).defaultTo('fr').checkIn(['fr', 'en']);
        table.boolean('is_verified').defaultTo(false);
        table.timestamp('email_verified_at');
        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.timestamp('updated_at').defaultTo(knex.fn.now());
        table.timestamp('deleted_at');
      });
    })
    .then(() => {
      // Attorneys table
      return knex.schema.createTable('attorneys', table => {
        table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
        table.string('email', 255).unique().notNullable();
        table.string('password_hash', 255).notNullable();
        table.string('bar_number', 50).unique().notNullable();
        table.string('first_name', 100).notNullable();
        table.string('last_name', 100).notNullable();
        table.string('firm_name', 255);
        table.string('phone', 20).notNullable();
        table.string('address_line1', 255);
        table.string('address_line2', 255);
        table.string('city', 100);
        table.string('province', 2).defaultTo('QC');
        table.string('postal_code', 10);
        table.integer('years_experience').notNullable();
        table.decimal('hourly_rate_min', 10, 2);
        table.decimal('hourly_rate_max', 10, 2);
        table.boolean('fixed_fee_available').defaultTo(false);
        table.boolean('contingency_available').defaultTo(false);
        table.boolean('free_consultation').defaultTo(false);
        table.decimal('consultation_fee', 10, 2);
        table.jsonb('languages').defaultTo('["fr"]');
        table.text('bio_fr');
        table.text('bio_en');
        table.string('profile_photo_url', 500);
        table.boolean('is_verified').defaultTo(false);
        table.boolean('is_active').defaultTo(true);
        table.string('availability_status', 20).defaultTo('available').checkIn(['available', 'busy', 'unavailable']);
        table.decimal('rating_average', 3, 2).defaultTo(0);
        table.integer('rating_count').defaultTo(0);
        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.timestamp('updated_at').defaultTo(knex.fn.now());
        table.timestamp('deleted_at');
      });
    })
    .then(() => {
      // Practice Areas
      return knex.schema.createTable('practice_areas', table => {
        table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
        table.string('name_fr', 100).notNullable();
        table.string('name_en', 100).notNullable();
        table.text('description_fr');
        table.text('description_en');
        table.uuid('parent_id').references('id').inTable('practice_areas');
        table.timestamp('created_at').defaultTo(knex.fn.now());
      });
    })
    .then(() => {
      // Attorney Practice Areas
      return knex.schema.createTable('attorney_practice_areas', table => {
        table.uuid('attorney_id').references('id').inTable('attorneys').onDelete('CASCADE');
        table.uuid('practice_area_id').references('id').inTable('practice_areas').onDelete('CASCADE');
        table.boolean('is_primary').defaultTo(false);
        table.integer('years_experience');
        table.primary(['attorney_id', 'practice_area_id']);
      });
    })
    .then(() => {
      // Attorney Availability
      return knex.schema.createTable('attorney_availability', table => {
        table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
        table.uuid('attorney_id').references('id').inTable('attorneys').onDelete('CASCADE');
        table.integer('day_of_week').checkBetween([0, 6]);
        table.time('start_time').notNullable();
        table.time('end_time').notNullable();
        table.boolean('is_available').defaultTo(true);
        table.timestamp('created_at').defaultTo(knex.fn.now());
      });
    })
    .then(() => {
      // Match Requests
      return knex.schema.createTable('match_requests', table => {
        table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
        table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
        table.uuid('practice_area_id').references('id').inTable('practice_areas');
        table.text('case_description').notNullable();
        table.string('budget_type', 20).checkIn(['hourly', 'fixed', 'contingency', 'flexible']);
        table.decimal('budget_min', 10, 2);
        table.decimal('budget_max', 10, 2);
        table.string('urgency', 20).checkIn(['immediate', 'within_week', 'within_month', 'flexible']);
        table.string('preferred_language', 2).checkIn(['fr', 'en']);
        table.text('additional_requirements');
        table.string('status', 20).defaultTo('pending').checkIn(['pending', 'matched', 'cancelled', 'expired']);
        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.timestamp('updated_at').defaultTo(knex.fn.now());
      });
    })
    .then(() => {
      // Matches
      return knex.schema.createTable('matches', table => {
        table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
        table.uuid('match_request_id').references('id').inTable('match_requests').onDelete('CASCADE');
        table.uuid('attorney_id').references('id').inTable('attorneys').onDelete('CASCADE');
        table.decimal('match_score', 5, 2);
        table.string('status', 20).defaultTo('proposed').checkIn(['proposed', 'accepted', 'rejected', 'expired']);
        table.text('attorney_response');
        table.text('user_feedback');
        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.timestamp('updated_at').defaultTo(knex.fn.now());
      });
    })
    .then(() => {
      // Reviews
      return knex.schema.createTable('reviews', table => {
        table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
        table.uuid('attorney_id').references('id').inTable('attorneys').onDelete('CASCADE');
        table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
        table.uuid('match_id').references('id').inTable('matches');
        table.integer('rating').checkBetween([1, 5]);
        table.text('review_text');
        table.boolean('is_verified').defaultTo(false);
        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.timestamp('updated_at').defaultTo(knex.fn.now());
      });
    })
    .then(() => {
      // Attorney Credentials
      return knex.schema.createTable('attorney_credentials', table => {
        table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
        table.uuid('attorney_id').references('id').inTable('attorneys').onDelete('CASCADE');
        table.string('credential_type', 50);
        table.string('credential_name', 255);
        table.string('issuing_organization', 255);
        table.date('issue_date');
        table.date('expiry_date');
        table.string('verification_status', 20).defaultTo('pending').checkIn(['pending', 'verified', 'rejected']);
        table.timestamp('created_at').defaultTo(knex.fn.now());
      });
    })
    .then(() => {
      // Attorney Documents
      return knex.schema.createTable('attorney_documents', table => {
        table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
        table.uuid('attorney_id').references('id').inTable('attorneys').onDelete('CASCADE');
        table.string('document_type', 50);
        table.string('document_name', 255);
        table.string('file_url', 500);
        table.timestamp('uploaded_at').defaultTo(knex.fn.now());
      });
    })
    .then(() => {
      // Subscription Plans
      return knex.schema.createTable('subscription_plans', table => {
        table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
        table.string('name', 100).notNullable();
        table.text('description');
        table.decimal('price_monthly', 10, 2);
        table.decimal('price_yearly', 10, 2);
        table.jsonb('features');
        table.integer('max_monthly_matches');
        table.boolean('priority_listing').defaultTo(false);
        table.boolean('is_active').defaultTo(true);
        table.timestamp('created_at').defaultTo(knex.fn.now());
      });
    })
    .then(() => {
      // Attorney Subscriptions
      return knex.schema.createTable('attorney_subscriptions', table => {
        table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
        table.uuid('attorney_id').references('id').inTable('attorneys').onDelete('CASCADE');
        table.uuid('plan_id').references('id').inTable('subscription_plans');
        table.string('stripe_subscription_id', 255);
        table.string('status', 20).checkIn(['active', 'cancelled', 'past_due', 'trialing']);
        table.timestamp('current_period_start');
        table.timestamp('current_period_end');
        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.timestamp('updated_at').defaultTo(knex.fn.now());
      });
    })
    .then(() => {
      // Notifications
      return knex.schema.createTable('notifications', table => {
        table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
        table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
        table.uuid('attorney_id').references('id').inTable('attorneys').onDelete('CASCADE');
        table.string('type', 50).notNullable();
        table.string('title', 255).notNullable();
        table.text('message').notNullable();
        table.jsonb('data');
        table.boolean('is_read').defaultTo(false);
        table.timestamp('created_at').defaultTo(knex.fn.now());
      });
    })
    .then(() => {
      // Educational Content
      return knex.schema.createTable('educational_content', table => {
        table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
        table.string('title_fr', 255).notNullable();
        table.string('title_en', 255).notNullable();
        table.text('content_fr').notNullable();
        table.text('content_en').notNullable();
        table.string('category', 50);
        table.jsonb('tags');
        table.string('author', 255);
        table.boolean('is_published').defaultTo(false);
        table.integer('view_count').defaultTo(0);
        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.timestamp('updated_at').defaultTo(knex.fn.now());
      });
    })
    .then(() => {
      // FAQs
      return knex.schema.createTable('faqs', table => {
        table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
        table.text('question_fr').notNullable();
        table.text('question_en').notNullable();
        table.text('answer_fr').notNullable();
        table.text('answer_en').notNullable();
        table.string('category', 50);
        table.integer('order_index').defaultTo(0);
        table.boolean('is_active').defaultTo(true);
        table.timestamp('created_at').defaultTo(knex.fn.now());
      });
    })
    .then(() => {
      // Create indexes
      return Promise.all([
        knex.raw('CREATE INDEX idx_attorneys_bar_number ON attorneys(bar_number)'),
        knex.raw('CREATE INDEX idx_attorneys_is_active ON attorneys(is_active)'),
        knex.raw('CREATE INDEX idx_attorneys_availability_status ON attorneys(availability_status)'),
        knex.raw('CREATE INDEX idx_match_requests_user_id ON match_requests(user_id)'),
        knex.raw('CREATE INDEX idx_match_requests_status ON match_requests(status)'),
        knex.raw('CREATE INDEX idx_matches_attorney_id ON matches(attorney_id)'),
        knex.raw('CREATE INDEX idx_reviews_attorney_id ON reviews(attorney_id)'),
        knex.raw('CREATE INDEX idx_notifications_user_attorney ON notifications(user_id, attorney_id)')
      ]);
    })
    .then(() => {
      // Create update trigger function
      return knex.raw(`
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = CURRENT_TIMESTAMP;
            RETURN NEW;
        END;
        $$ language 'plpgsql';
      `);
    })
    .then(() => {
      // Apply updated_at triggers
      return Promise.all([
        knex.raw('CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()'),
        knex.raw('CREATE TRIGGER update_attorneys_updated_at BEFORE UPDATE ON attorneys FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()'),
        knex.raw('CREATE TRIGGER update_match_requests_updated_at BEFORE UPDATE ON match_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()'),
        knex.raw('CREATE TRIGGER update_matches_updated_at BEFORE UPDATE ON matches FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()'),
        knex.raw('CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON reviews FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()')
      ]);
    });
};

exports.down = function(knex) {
  // Drop triggers first
  return Promise.all([
    knex.raw('DROP TRIGGER IF EXISTS update_users_updated_at ON users'),
    knex.raw('DROP TRIGGER IF EXISTS update_attorneys_updated_at ON attorneys'),
    knex.raw('DROP TRIGGER IF EXISTS update_match_requests_updated_at ON match_requests'),
    knex.raw('DROP TRIGGER IF EXISTS update_matches_updated_at ON matches'),
    knex.raw('DROP TRIGGER IF EXISTS update_reviews_updated_at ON reviews')
  ])
  .then(() => knex.raw('DROP FUNCTION IF EXISTS update_updated_at_column()'))
  .then(() => knex.schema.dropTableIfExists('faqs'))
  .then(() => knex.schema.dropTableIfExists('educational_content'))
  .then(() => knex.schema.dropTableIfExists('notifications'))
  .then(() => knex.schema.dropTableIfExists('attorney_subscriptions'))
  .then(() => knex.schema.dropTableIfExists('subscription_plans'))
  .then(() => knex.schema.dropTableIfExists('attorney_documents'))
  .then(() => knex.schema.dropTableIfExists('attorney_credentials'))
  .then(() => knex.schema.dropTableIfExists('reviews'))
  .then(() => knex.schema.dropTableIfExists('matches'))
  .then(() => knex.schema.dropTableIfExists('match_requests'))
  .then(() => knex.schema.dropTableIfExists('attorney_availability'))
  .then(() => knex.schema.dropTableIfExists('attorney_practice_areas'))
  .then(() => knex.schema.dropTableIfExists('practice_areas'))
  .then(() => knex.schema.dropTableIfExists('attorneys'))
  .then(() => knex.schema.dropTableIfExists('users'));
};