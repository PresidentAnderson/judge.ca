import db from '../utils/database';
import { v4 as uuidv4 } from 'uuid';
import slugify from 'slugify';
import { marked } from 'marked';
import DOMPurify from 'isomorphic-dompurify';

interface BlogPost {
  id: string;
  slug: string;
  title: string;
  titleFr?: string;
  excerpt: string;
  excerptFr?: string;
  content: string;
  contentFr?: string;
  contentHtml?: string;
  contentHtmlFr?: string;
  authorId: string;
  authorType: 'attorney' | 'admin';
  authorName: string;
  authorTitle?: string;
  authorBio?: string;
  authorPhotoUrl?: string;
  coAuthors?: Array<{
    id: string;
    name: string;
    title?: string;
    photoUrl?: string;
  }>;
  categories: string[];
  tags: string[];
  practiceAreaId?: string;
  featuredImageUrl?: string;
  featuredImageAlt?: string;
  status: 'draft' | 'pending_review' | 'published' | 'archived';
  publishedAt?: Date;
  scheduledFor?: Date;
  viewCount: number;
  readTime: number; // in minutes
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string[];
  canonicalUrl?: string;
  isSticky: boolean;
  allowComments: boolean;
  requiresAuth: boolean;
  metadata?: any;
  createdAt: Date;
  updatedAt: Date;
}

interface BlogCategory {
  id: string;
  slug: string;
  nameEn: string;
  nameFr: string;
  descriptionEn?: string;
  descriptionFr?: string;
  parentId?: string;
  postCount: number;
  isActive: boolean;
  createdAt: Date;
}

interface BlogComment {
  id: string;
  postId: string;
  parentId?: string;
  authorId: string;
  authorType: 'user' | 'attorney' | 'guest';
  authorName: string;
  authorEmail?: string;
  content: string;
  status: 'pending' | 'approved' | 'spam' | 'deleted';
  isEdited: boolean;
  editedAt?: Date;
  likes: number;
  reports: number;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

interface BlogSubscriber {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  preferredLanguage: 'en' | 'fr';
  categories: string[];
  frequency: 'immediate' | 'daily' | 'weekly' | 'monthly';
  isActive: boolean;
  isVerified: boolean;
  verificationToken?: string;
  unsubscribeToken: string;
  lastEmailSent?: Date;
  createdAt: Date;
}

export class LegalBlogService {
  async createPost(
    authorId: string,
    authorType: 'attorney' | 'admin',
    post: {
      title: string;
      titleFr?: string;
      excerpt: string;
      excerptFr?: string;
      content: string;
      contentFr?: string;
      categories: string[];
      tags: string[];
      practiceAreaId?: string;
      featuredImageUrl?: string;
      featuredImageAlt?: string;
      seoTitle?: string;
      seoDescription?: string;
      seoKeywords?: string[];
      status?: 'draft' | 'pending_review' | 'published';
      scheduledFor?: Date;
      allowComments?: boolean;
      requiresAuth?: boolean;
    }
  ): Promise<BlogPost> {
    try {
      // Get author details
      const author = await this.getAuthorDetails(authorId, authorType);
      
      // Generate slug
      const baseSlug = slugify(post.title, { lower: true, strict: true });
      const slug = await this.generateUniqueSlug(baseSlug);

      // Calculate read time
      const wordCount = post.content.split(/\s+/).length;
      const readTime = Math.ceil(wordCount / 200); // Average 200 words per minute

      // Sanitize and convert markdown to HTML
      const contentHtml = DOMPurify.sanitize(marked(post.content));
      const contentHtmlFr = post.contentFr ? DOMPurify.sanitize(marked(post.contentFr)) : undefined;

      // Create post
      const postData = {
        id: uuidv4(),
        slug,
        title: post.title,
        title_fr: post.titleFr,
        excerpt: post.excerpt,
        excerpt_fr: post.excerptFr,
        content: post.content,
        content_fr: post.contentFr,
        content_html: contentHtml,
        content_html_fr: contentHtmlFr,
        author_id: authorId,
        author_type: authorType,
        author_name: author.name,
        author_title: author.title,
        author_bio: author.bio,
        author_photo_url: author.photoUrl,
        categories: JSON.stringify(post.categories),
        tags: JSON.stringify(post.tags),
        practice_area_id: post.practiceAreaId,
        featured_image_url: post.featuredImageUrl,
        featured_image_alt: post.featuredImageAlt,
        status: post.status || 'draft',
        published_at: post.status === 'published' ? new Date() : null,
        scheduled_for: post.scheduledFor,
        view_count: 0,
        read_time: readTime,
        seo_title: post.seoTitle || post.title,
        seo_description: post.seoDescription || post.excerpt,
        seo_keywords: JSON.stringify(post.seoKeywords || post.tags),
        is_sticky: false,
        allow_comments: post.allowComments !== false,
        requires_auth: post.requiresAuth || false,
        created_at: new Date(),
        updated_at: new Date()
      };

      const [savedPost] = await db('blog_posts')
        .insert(postData)
        .returning('*');

      // Update category post counts
      await this.updateCategoryPostCounts(post.categories);

      // Notify subscribers if published
      if (post.status === 'published') {
        await this.notifySubscribers(savedPost);
      }

      // Track analytics
      await this.trackBlogEvent('post_created', {
        postId: savedPost.id,
        authorId,
        status: post.status
      });

      return this.transformPost(savedPost);
    } catch (error) {
      console.error('Error creating blog post:', error);
      throw new Error('Failed to create blog post');
    }
  }

  async updatePost(
    postId: string,
    authorId: string,
    updates: Partial<BlogPost>
  ): Promise<BlogPost> {
    try {
      const post = await db('blog_posts')
        .where('id', postId)
        .first();

      if (!post) {
        throw new Error('Post not found');
      }

      // Check permissions
      if (post.author_id !== authorId && !(await this.isAdmin(authorId))) {
        throw new Error('Permission denied');
      }

      // Recalculate read time if content changed
      let readTime = post.read_time;
      if (updates.content) {
        const wordCount = updates.content.split(/\s+/).length;
        readTime = Math.ceil(wordCount / 200);
      }

      // Sanitize HTML if content changed
      let contentHtml = post.content_html;
      let contentHtmlFr = post.content_html_fr;
      if (updates.content) {
        contentHtml = DOMPurify.sanitize(marked(updates.content));
      }
      if (updates.contentFr) {
        contentHtmlFr = DOMPurify.sanitize(marked(updates.contentFr));
      }

      // Update slug if title changed
      let slug = post.slug;
      if (updates.title && updates.title !== post.title) {
        const baseSlug = slugify(updates.title, { lower: true, strict: true });
        slug = await this.generateUniqueSlug(baseSlug, postId);
      }

      // Handle status changes
      let publishedAt = post.published_at;
      if (updates.status === 'published' && post.status !== 'published') {
        publishedAt = new Date();
      }

      const updateData = {
        ...updates,
        slug,
        content_html: contentHtml,
        content_html_fr: contentHtmlFr,
        read_time: readTime,
        published_at: publishedAt,
        updated_at: new Date()
      };

      await db('blog_posts')
        .where('id', postId)
        .update(updateData);

      const updatedPost = await db('blog_posts')
        .where('id', postId)
        .first();

      // Notify subscribers if newly published
      if (updates.status === 'published' && post.status !== 'published') {
        await this.notifySubscribers(updatedPost);
      }

      // Track analytics
      await this.trackBlogEvent('post_updated', {
        postId,
        authorId,
        changes: Object.keys(updates)
      });

      return this.transformPost(updatedPost);
    } catch (error) {
      console.error('Error updating blog post:', error);
      throw new Error('Failed to update blog post');
    }
  }

  async deletePost(postId: string, authorId: string): Promise<void> {
    try {
      const post = await db('blog_posts')
        .where('id', postId)
        .first();

      if (!post) {
        throw new Error('Post not found');
      }

      // Check permissions
      if (post.author_id !== authorId && !(await this.isAdmin(authorId))) {
        throw new Error('Permission denied');
      }

      // Soft delete by setting status to archived
      await db('blog_posts')
        .where('id', postId)
        .update({
          status: 'archived',
          archived_at: new Date(),
          updated_at: new Date()
        });

      // Update category post counts
      const categories = JSON.parse(post.categories || '[]');
      await this.updateCategoryPostCounts(categories);

      // Track analytics
      await this.trackBlogEvent('post_deleted', {
        postId,
        authorId
      });
    } catch (error) {
      console.error('Error deleting blog post:', error);
      throw new Error('Failed to delete blog post');
    }
  }

  async getPost(
    slug: string,
    incrementViews = true,
    language: 'en' | 'fr' = 'en'
  ): Promise<BlogPost | null> {
    try {
      const post = await db('blog_posts')
        .where('slug', slug)
        .where('status', 'published')
        .first();

      if (!post) {
        return null;
      }

      // Increment view count
      if (incrementViews) {
        await db('blog_posts')
          .where('id', post.id)
          .increment('view_count', 1);
        
        post.view_count += 1;
      }

      // Get related posts
      const relatedPosts = await this.getRelatedPosts(post.id, post.categories, post.tags);

      const transformedPost = this.transformPost(post);
      transformedPost.relatedPosts = relatedPosts;

      return transformedPost;
    } catch (error) {
      console.error('Error getting blog post:', error);
      throw new Error('Failed to get blog post');
    }
  }

  async getPosts(
    filters: {
      status?: string;
      authorId?: string;
      category?: string;
      tag?: string;
      practiceAreaId?: string;
      search?: string;
      language?: 'en' | 'fr';
    } = {},
    page = 1,
    limit = 10,
    orderBy = 'published_at',
    order: 'asc' | 'desc' = 'desc'
  ): Promise<{ posts: BlogPost[]; total: number; pages: number }> {
    try {
      let query = db('blog_posts');

      // Apply filters
      if (filters.status) {
        query = query.where('status', filters.status);
      } else {
        query = query.where('status', 'published');
      }

      if (filters.authorId) {
        query = query.where('author_id', filters.authorId);
      }

      if (filters.category) {
        query = query.whereRaw('? = ANY(categories::text[])', [filters.category]);
      }

      if (filters.tag) {
        query = query.whereRaw('? = ANY(tags::text[])', [filters.tag]);
      }

      if (filters.practiceAreaId) {
        query = query.where('practice_area_id', filters.practiceAreaId);
      }

      if (filters.search) {
        const searchTerm = `%${filters.search}%`;
        query = query.where(function() {
          this.where('title', 'ilike', searchTerm)
            .orWhere('excerpt', 'ilike', searchTerm)
            .orWhere('content', 'ilike', searchTerm);
          
          if (filters.language === 'fr') {
            this.orWhere('title_fr', 'ilike', searchTerm)
              .orWhere('excerpt_fr', 'ilike', searchTerm)
              .orWhere('content_fr', 'ilike', searchTerm);
          }
        });
      }

      // Get total count
      const totalResult = await query.clone().count('* as count').first();
      const total = parseInt(totalResult?.count || '0');
      const pages = Math.ceil(total / limit);

      // Apply pagination and ordering
      const offset = (page - 1) * limit;
      const posts = await query
        .orderBy(orderBy, order)
        .limit(limit)
        .offset(offset);

      return {
        posts: posts.map(post => this.transformPost(post)),
        total,
        pages
      };
    } catch (error) {
      console.error('Error getting blog posts:', error);
      throw new Error('Failed to get blog posts');
    }
  }

  async getPopularPosts(
    limit = 5,
    timeframe?: 'week' | 'month' | 'year'
  ): Promise<BlogPost[]> {
    try {
      let query = db('blog_posts')
        .where('status', 'published')
        .orderBy('view_count', 'desc')
        .limit(limit);

      if (timeframe) {
        const startDate = this.getTimeframeStartDate(timeframe);
        query = query.where('published_at', '>=', startDate);
      }

      const posts = await query;

      return posts.map(post => this.transformPost(post));
    } catch (error) {
      console.error('Error getting popular posts:', error);
      throw new Error('Failed to get popular posts');
    }
  }

  async createCategory(
    category: {
      nameEn: string;
      nameFr: string;
      descriptionEn?: string;
      descriptionFr?: string;
      parentId?: string;
    }
  ): Promise<BlogCategory> {
    try {
      const slug = slugify(category.nameEn, { lower: true, strict: true });

      const categoryData = {
        id: uuidv4(),
        slug,
        name_en: category.nameEn,
        name_fr: category.nameFr,
        description_en: category.descriptionEn,
        description_fr: category.descriptionFr,
        parent_id: category.parentId,
        post_count: 0,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      };

      const [savedCategory] = await db('blog_categories')
        .insert(categoryData)
        .returning('*');

      return this.transformCategory(savedCategory);
    } catch (error) {
      console.error('Error creating category:', error);
      throw new Error('Failed to create category');
    }
  }

  async getCategories(includeEmpty = false): Promise<BlogCategory[]> {
    try {
      let query = db('blog_categories')
        .where('is_active', true)
        .orderBy('name_en');

      if (!includeEmpty) {
        query = query.where('post_count', '>', 0);
      }

      const categories = await query;

      return categories.map(cat => this.transformCategory(cat));
    } catch (error) {
      console.error('Error getting categories:', error);
      throw new Error('Failed to get categories');
    }
  }

  async createComment(
    postId: string,
    comment: {
      authorId: string;
      authorType: 'user' | 'attorney' | 'guest';
      authorName: string;
      authorEmail?: string;
      content: string;
      parentId?: string;
    }
  ): Promise<BlogComment> {
    try {
      const post = await db('blog_posts')
        .where('id', postId)
        .where('status', 'published')
        .where('allow_comments', true)
        .first();

      if (!post) {
        throw new Error('Post not found or comments disabled');
      }

      // Check if parent comment exists
      if (comment.parentId) {
        const parentComment = await db('blog_comments')
          .where('id', comment.parentId)
          .where('post_id', postId)
          .first();

        if (!parentComment) {
          throw new Error('Parent comment not found');
        }
      }

      // Auto-approve comments from verified attorneys
      const autoApprove = comment.authorType === 'attorney' && 
                         await this.isVerifiedAttorney(comment.authorId);

      const commentData = {
        id: uuidv4(),
        post_id: postId,
        parent_id: comment.parentId,
        author_id: comment.authorId,
        author_type: comment.authorType,
        author_name: comment.authorName,
        author_email: comment.authorEmail,
        content: DOMPurify.sanitize(comment.content),
        status: autoApprove ? 'approved' : 'pending',
        is_edited: false,
        likes: 0,
        reports: 0,
        ip_address: 'hidden', // In production, capture from request
        user_agent: 'hidden', // In production, capture from request
        created_at: new Date(),
        updated_at: new Date()
      };

      const [savedComment] = await db('blog_comments')
        .insert(commentData)
        .returning('*');

      // Send notification to post author
      await this.notifyPostAuthor(post, savedComment);

      // Send notification to parent comment author if reply
      if (comment.parentId) {
        await this.notifyCommentReply(comment.parentId, savedComment);
      }

      return this.transformComment(savedComment);
    } catch (error) {
      console.error('Error creating comment:', error);
      throw new Error('Failed to create comment');
    }
  }

  async getComments(
    postId: string,
    status = 'approved',
    page = 1,
    limit = 20
  ): Promise<{ comments: BlogComment[]; total: number }> {
    try {
      const offset = (page - 1) * limit;

      const query = db('blog_comments')
        .where('post_id', postId)
        .where('status', status)
        .whereNull('parent_id'); // Top-level comments only

      const total = await query.clone().count('* as count').first();

      const comments = await query
        .orderBy('created_at', 'desc')
        .limit(limit)
        .offset(offset);

      // Get replies for each comment
      const commentsWithReplies = await Promise.all(
        comments.map(async (comment) => {
          const replies = await db('blog_comments')
            .where('parent_id', comment.id)
            .where('status', status)
            .orderBy('created_at', 'asc');

          return {
            ...this.transformComment(comment),
            replies: replies.map(reply => this.transformComment(reply))
          };
        })
      );

      return {
        comments: commentsWithReplies,
        total: parseInt(total?.count || '0')
      };
    } catch (error) {
      console.error('Error getting comments:', error);
      throw new Error('Failed to get comments');
    }
  }

  async moderateComment(
    commentId: string,
    moderatorId: string,
    action: 'approve' | 'spam' | 'delete'
  ): Promise<void> {
    try {
      // Check moderator permissions
      if (!(await this.isModerator(moderatorId))) {
        throw new Error('Permission denied');
      }

      const status = action === 'delete' ? 'deleted' : action === 'approve' ? 'approved' : 'spam';

      await db('blog_comments')
        .where('id', commentId)
        .update({
          status,
          moderated_by: moderatorId,
          moderated_at: new Date(),
          updated_at: new Date()
        });

      // Track moderation action
      await this.trackBlogEvent('comment_moderated', {
        commentId,
        moderatorId,
        action
      });
    } catch (error) {
      console.error('Error moderating comment:', error);
      throw new Error('Failed to moderate comment');
    }
  }

  async subscribeToNewsletter(
    subscription: {
      email: string;
      firstName?: string;
      lastName?: string;
      preferredLanguage?: 'en' | 'fr';
      categories?: string[];
      frequency?: 'immediate' | 'daily' | 'weekly' | 'monthly';
    }
  ): Promise<{ message: string; requiresVerification: boolean }> {
    try {
      // Check if already subscribed
      const existing = await db('blog_subscribers')
        .where('email', subscription.email)
        .first();

      if (existing) {
        if (existing.is_verified) {
          // Update preferences
          await db('blog_subscribers')
            .where('id', existing.id)
            .update({
              first_name: subscription.firstName || existing.first_name,
              last_name: subscription.lastName || existing.last_name,
              preferred_language: subscription.preferredLanguage || existing.preferred_language,
              categories: JSON.stringify(subscription.categories || JSON.parse(existing.categories)),
              frequency: subscription.frequency || existing.frequency,
              updated_at: new Date()
            });

          return {
            message: 'Subscription preferences updated',
            requiresVerification: false
          };
        } else {
          // Resend verification
          await this.sendVerificationEmail(existing);
          return {
            message: 'Verification email resent',
            requiresVerification: true
          };
        }
      }

      // Create new subscription
      const verificationToken = crypto.randomBytes(32).toString('hex');
      const unsubscribeToken = crypto.randomBytes(32).toString('hex');

      const subscriberData = {
        id: uuidv4(),
        email: subscription.email,
        first_name: subscription.firstName,
        last_name: subscription.lastName,
        preferred_language: subscription.preferredLanguage || 'en',
        categories: JSON.stringify(subscription.categories || []),
        frequency: subscription.frequency || 'weekly',
        is_active: true,
        is_verified: false,
        verification_token: verificationToken,
        unsubscribe_token: unsubscribeToken,
        created_at: new Date(),
        updated_at: new Date()
      };

      const [subscriber] = await db('blog_subscribers')
        .insert(subscriberData)
        .returning('*');

      // Send verification email
      await this.sendVerificationEmail(subscriber);

      return {
        message: 'Please check your email to verify your subscription',
        requiresVerification: true
      };
    } catch (error) {
      console.error('Error subscribing to newsletter:', error);
      throw new Error('Failed to subscribe to newsletter');
    }
  }

  async verifySubscription(token: string): Promise<boolean> {
    try {
      const subscriber = await db('blog_subscribers')
        .where('verification_token', token)
        .where('is_verified', false)
        .first();

      if (!subscriber) {
        return false;
      }

      await db('blog_subscribers')
        .where('id', subscriber.id)
        .update({
          is_verified: true,
          verification_token: null,
          verified_at: new Date(),
          updated_at: new Date()
        });

      // Send welcome email
      await this.sendWelcomeEmail(subscriber);

      return true;
    } catch (error) {
      console.error('Error verifying subscription:', error);
      return false;
    }
  }

  async unsubscribe(token: string): Promise<boolean> {
    try {
      const subscriber = await db('blog_subscribers')
        .where('unsubscribe_token', token)
        .first();

      if (!subscriber) {
        return false;
      }

      await db('blog_subscribers')
        .where('id', subscriber.id)
        .update({
          is_active: false,
          unsubscribed_at: new Date(),
          updated_at: new Date()
        });

      return true;
    } catch (error) {
      console.error('Error unsubscribing:', error);
      return false;
    }
  }

  async sendNewsletter(
    postIds: string[],
    testMode = false,
    testEmail?: string
  ): Promise<{ sent: number; failed: number }> {
    try {
      // Get posts
      const posts = await db('blog_posts')
        .whereIn('id', postIds)
        .where('status', 'published');

      if (posts.length === 0) {
        throw new Error('No valid posts found');
      }

      // Get subscribers
      let subscribers = [];
      if (testMode && testEmail) {
        subscribers = [{ email: testEmail, preferred_language: 'en' }];
      } else {
        subscribers = await db('blog_subscribers')
          .where('is_active', true)
          .where('is_verified', true)
          .where(function() {
            this.where('frequency', 'immediate')
              .orWhere(function() {
                this.where('frequency', 'daily')
                  .where('last_email_sent', '<', new Date(Date.now() - 24 * 60 * 60 * 1000));
              })
              .orWhere(function() {
                this.where('frequency', 'weekly')
                  .where('last_email_sent', '<', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));
              })
              .orWhere(function() {
                this.where('frequency', 'monthly')
                  .where('last_email_sent', '<', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
              });
          });
      }

      let sent = 0;
      let failed = 0;

      // Send emails in batches
      const batchSize = 50;
      for (let i = 0; i < subscribers.length; i += batchSize) {
        const batch = subscribers.slice(i, i + batchSize);
        
        await Promise.all(
          batch.map(async (subscriber) => {
            try {
              await this.sendNewsletterEmail(subscriber, posts);
              sent++;

              if (!testMode) {
                await db('blog_subscribers')
                  .where('id', subscriber.id)
                  .update({
                    last_email_sent: new Date(),
                    updated_at: new Date()
                  });
              }
            } catch (error) {
              console.error(`Failed to send to ${subscriber.email}:`, error);
              failed++;
            }
          })
        );
      }

      return { sent, failed };
    } catch (error) {
      console.error('Error sending newsletter:', error);
      throw new Error('Failed to send newsletter');
    }
  }

  private async generateUniqueSlug(baseSlug: string, excludeId?: string): Promise<string> {
    let slug = baseSlug;
    let counter = 1;

    while (true) {
      const query = db('blog_posts').where('slug', slug);
      if (excludeId) {
        query.whereNot('id', excludeId);
      }

      const existing = await query.first();
      if (!existing) {
        return slug;
      }

      slug = `${baseSlug}-${counter}`;
      counter++;
    }
  }

  private async getAuthorDetails(authorId: string, authorType: string): Promise<any> {
    if (authorType === 'attorney') {
      const attorney = await db('attorneys')
        .where('id', authorId)
        .first();

      return {
        name: attorney ? `Me ${attorney.first_name} ${attorney.last_name}` : 'Unknown Attorney',
        title: attorney?.firm_name,
        bio: attorney?.bio_fr || attorney?.bio_en,
        photoUrl: attorney?.profile_photo_url
      };
    } else {
      const admin = await db('admins')
        .where('id', authorId)
        .first();

      return {
        name: admin ? `${admin.first_name} ${admin.last_name}` : 'Admin',
        title: admin?.title || 'Administrator',
        bio: admin?.bio,
        photoUrl: admin?.photo_url
      };
    }
  }

  private async updateCategoryPostCounts(categories: string[]): Promise<void> {
    for (const categorySlug of categories) {
      const count = await db('blog_posts')
        .where('status', 'published')
        .whereRaw('? = ANY(categories::text[])', [categorySlug])
        .count('* as count')
        .first();

      await db('blog_categories')
        .where('slug', categorySlug)
        .update({
          post_count: parseInt(count?.count || '0'),
          updated_at: new Date()
        });
    }
  }

  private async getRelatedPosts(
    postId: string,
    categories: string,
    tags: string,
    limit = 3
  ): Promise<BlogPost[]> {
    const categoriesArray = JSON.parse(categories || '[]');
    const tagsArray = JSON.parse(tags || '[]');

    const posts = await db('blog_posts')
      .where('status', 'published')
      .whereNot('id', postId)
      .where(function() {
        if (categoriesArray.length > 0) {
          this.whereRaw('categories::jsonb ?| array[?]', [categoriesArray]);
        }
        if (tagsArray.length > 0) {
          this.orWhereRaw('tags::jsonb ?| array[?]', [tagsArray]);
        }
      })
      .orderBy('published_at', 'desc')
      .limit(limit);

    return posts.map(post => this.transformPost(post));
  }

  private getTimeframeStartDate(timeframe: 'week' | 'month' | 'year'): Date {
    const now = new Date();
    switch (timeframe) {
      case 'week':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case 'month':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      case 'year':
        return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
    }
  }

  private async isAdmin(userId: string): Promise<boolean> {
    const admin = await db('admins')
      .where('id', userId)
      .where('is_active', true)
      .first();
    return !!admin;
  }

  private async isModerator(userId: string): Promise<boolean> {
    // Check if user is admin or has moderator role
    const admin = await db('admins')
      .where('id', userId)
      .where('is_active', true)
      .whereIn('role', ['admin', 'moderator'])
      .first();
    return !!admin;
  }

  private async isVerifiedAttorney(attorneyId: string): Promise<boolean> {
    const attorney = await db('attorneys')
      .where('id', attorneyId)
      .where('is_verified', true)
      .first();
    return !!attorney;
  }

  private async notifySubscribers(post: any): Promise<void> {
    // Mock implementation - in production, queue newsletter send
    console.log(`Notifying subscribers about new post: ${post.title}`);
  }

  private async notifyPostAuthor(post: any, comment: any): Promise<void> {
    // Mock implementation - in production, send email/push notification
    console.log(`Notifying post author about new comment on: ${post.title}`);
  }

  private async notifyCommentReply(parentCommentId: string, reply: any): Promise<void> {
    // Mock implementation - in production, send email/push notification
    console.log(`Notifying about reply to comment: ${parentCommentId}`);
  }

  private async sendVerificationEmail(subscriber: any): Promise<void> {
    // Mock implementation - in production, use email service
    const verificationUrl = `${process.env.BASE_URL}/blog/verify?token=${subscriber.verification_token}`;
    console.log(`Sending verification email to ${subscriber.email}: ${verificationUrl}`);
  }

  private async sendWelcomeEmail(subscriber: any): Promise<void> {
    // Mock implementation - in production, use email service
    console.log(`Sending welcome email to ${subscriber.email}`);
  }

  private async sendNewsletterEmail(subscriber: any, posts: any[]): Promise<void> {
    // Mock implementation - in production, use email service
    console.log(`Sending newsletter to ${subscriber.email} with ${posts.length} posts`);
  }

  private async trackBlogEvent(eventType: string, data: any): Promise<void> {
    try {
      await db('blog_analytics').insert({
        id: uuidv4(),
        event_type: eventType,
        event_data: JSON.stringify(data),
        created_at: new Date()
      });
    } catch (error) {
      console.error('Error tracking blog event:', error);
    }
  }

  private transformPost(post: any): BlogPost {
    return {
      id: post.id,
      slug: post.slug,
      title: post.title,
      titleFr: post.title_fr,
      excerpt: post.excerpt,
      excerptFr: post.excerpt_fr,
      content: post.content,
      contentFr: post.content_fr,
      contentHtml: post.content_html,
      contentHtmlFr: post.content_html_fr,
      authorId: post.author_id,
      authorType: post.author_type,
      authorName: post.author_name,
      authorTitle: post.author_title,
      authorBio: post.author_bio,
      authorPhotoUrl: post.author_photo_url,
      coAuthors: post.co_authors ? JSON.parse(post.co_authors) : undefined,
      categories: JSON.parse(post.categories || '[]'),
      tags: JSON.parse(post.tags || '[]'),
      practiceAreaId: post.practice_area_id,
      featuredImageUrl: post.featured_image_url,
      featuredImageAlt: post.featured_image_alt,
      status: post.status,
      publishedAt: post.published_at,
      scheduledFor: post.scheduled_for,
      viewCount: post.view_count,
      readTime: post.read_time,
      seoTitle: post.seo_title,
      seoDescription: post.seo_description,
      seoKeywords: post.seo_keywords ? JSON.parse(post.seo_keywords) : undefined,
      canonicalUrl: post.canonical_url,
      isSticky: post.is_sticky,
      allowComments: post.allow_comments,
      requiresAuth: post.requires_auth,
      metadata: post.metadata ? JSON.parse(post.metadata) : undefined,
      createdAt: post.created_at,
      updatedAt: post.updated_at
    };
  }

  private transformCategory(category: any): BlogCategory {
    return {
      id: category.id,
      slug: category.slug,
      nameEn: category.name_en,
      nameFr: category.name_fr,
      descriptionEn: category.description_en,
      descriptionFr: category.description_fr,
      parentId: category.parent_id,
      postCount: category.post_count,
      isActive: category.is_active,
      createdAt: category.created_at
    };
  }

  private transformComment(comment: any): BlogComment {
    return {
      id: comment.id,
      postId: comment.post_id,
      parentId: comment.parent_id,
      authorId: comment.author_id,
      authorType: comment.author_type,
      authorName: comment.author_name,
      authorEmail: comment.author_email,
      content: comment.content,
      status: comment.status,
      isEdited: comment.is_edited,
      editedAt: comment.edited_at,
      likes: comment.likes,
      reports: comment.reports,
      ipAddress: comment.ip_address,
      userAgent: comment.user_agent,
      createdAt: comment.created_at
    };
  }
}

// Database schema additions needed:
/*
CREATE TABLE blog_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug VARCHAR(255) UNIQUE NOT NULL,
  title VARCHAR(255) NOT NULL,
  title_fr VARCHAR(255),
  excerpt TEXT NOT NULL,
  excerpt_fr TEXT,
  content TEXT NOT NULL,
  content_fr TEXT,
  content_html TEXT,
  content_html_fr TEXT,
  author_id UUID NOT NULL,
  author_type VARCHAR(20) NOT NULL CHECK (author_type IN ('attorney', 'admin')),
  author_name VARCHAR(255) NOT NULL,
  author_title VARCHAR(255),
  author_bio TEXT,
  author_photo_url VARCHAR(500),
  co_authors JSONB,
  categories JSONB DEFAULT '[]',
  tags JSONB DEFAULT '[]',
  practice_area_id UUID REFERENCES practice_areas(id),
  featured_image_url VARCHAR(500),
  featured_image_alt VARCHAR(255),
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'pending_review', 'published', 'archived')),
  published_at TIMESTAMP,
  scheduled_for TIMESTAMP,
  archived_at TIMESTAMP,
  view_count INTEGER DEFAULT 0,
  read_time INTEGER DEFAULT 0,
  seo_title VARCHAR(255),
  seo_description TEXT,
  seo_keywords JSONB,
  canonical_url VARCHAR(500),
  is_sticky BOOLEAN DEFAULT FALSE,
  allow_comments BOOLEAN DEFAULT TRUE,
  requires_auth BOOLEAN DEFAULT FALSE,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE blog_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug VARCHAR(255) UNIQUE NOT NULL,
  name_en VARCHAR(255) NOT NULL,
  name_fr VARCHAR(255) NOT NULL,
  description_en TEXT,
  description_fr TEXT,
  parent_id UUID REFERENCES blog_categories(id),
  post_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE blog_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID REFERENCES blog_posts(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES blog_comments(id),
  author_id UUID NOT NULL,
  author_type VARCHAR(20) NOT NULL CHECK (author_type IN ('user', 'attorney', 'guest')),
  author_name VARCHAR(255) NOT NULL,
  author_email VARCHAR(255),
  content TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'spam', 'deleted')),
  is_edited BOOLEAN DEFAULT FALSE,
  edited_at TIMESTAMP,
  likes INTEGER DEFAULT 0,
  reports INTEGER DEFAULT 0,
  moderated_by UUID,
  moderated_at TIMESTAMP,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE blog_subscribers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  preferred_language VARCHAR(2) DEFAULT 'en' CHECK (preferred_language IN ('en', 'fr')),
  categories JSONB DEFAULT '[]',
  frequency VARCHAR(20) DEFAULT 'weekly' CHECK (frequency IN ('immediate', 'daily', 'weekly', 'monthly')),
  is_active BOOLEAN DEFAULT TRUE,
  is_verified BOOLEAN DEFAULT FALSE,
  verification_token VARCHAR(255),
  unsubscribe_token VARCHAR(255) UNIQUE NOT NULL,
  verified_at TIMESTAMP,
  unsubscribed_at TIMESTAMP,
  last_email_sent TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE blog_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_type VARCHAR(50) NOT NULL,
  event_data JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX idx_blog_posts_status ON blog_posts(status);
CREATE INDEX idx_blog_posts_author ON blog_posts(author_id, author_type);
CREATE INDEX idx_blog_posts_published ON blog_posts(published_at);
CREATE INDEX idx_blog_posts_categories ON blog_posts USING gin(categories);
CREATE INDEX idx_blog_posts_tags ON blog_posts USING gin(tags);
CREATE INDEX idx_blog_posts_search ON blog_posts USING gin(to_tsvector('english', title || ' ' || excerpt || ' ' || content));
CREATE INDEX idx_blog_comments_post ON blog_comments(post_id);
CREATE INDEX idx_blog_comments_status ON blog_comments(status);
CREATE INDEX idx_blog_subscribers_email ON blog_subscribers(email);
CREATE INDEX idx_blog_subscribers_active ON blog_subscribers(is_active, is_verified);
*/