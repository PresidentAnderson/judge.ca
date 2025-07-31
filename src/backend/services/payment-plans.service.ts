import db from '../utils/database';
import { v4 as uuidv4 } from 'uuid';
import Stripe from 'stripe';

interface PaymentPlan {
  id: string;
  name: string;
  description: string;
  type: 'fixed' | 'installment' | 'subscription' | 'deferred';
  amount: number;
  currency: 'CAD' | 'USD';
  interval?: 'monthly' | 'weekly' | 'biweekly';
  installmentCount?: number;
  downPayment?: number;
  downPaymentPercentage?: number;
  deferralPeriodDays?: number;
  interestRate?: number;
  lateFeeAmount?: number;
  lateFeePercentage?: number;
  gracePeriodDays?: number;
  isActive: boolean;
  eligibilityCriteria?: {
    minCaseValue?: number;
    maxCaseValue?: number;
    allowedPracticeAreas?: string[];
    clientTypes?: string[];
    creditCheckRequired?: boolean;
  };
  terms: string;
  createdAt: Date;
  updatedAt: Date;
}

interface PaymentPlanEnrollment {
  id: string;
  planId: string;
  userId: string;
  userType: 'user' | 'attorney';
  consultationId?: string;
  matchId?: string;
  status: 'pending' | 'active' | 'completed' | 'defaulted' | 'cancelled';
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  downPaymentAmount?: number;
  downPaymentPaid: boolean;
  installmentAmount: number;
  nextPaymentDate?: Date;
  nextPaymentAmount?: number;
  startDate: Date;
  endDate?: Date;
  completedDate?: Date;
  defaultedDate?: Date;
  cancelledDate?: Date;
  paymentMethod?: {
    type: 'card' | 'bank_account';
    last4: string;
    brand?: string;
  };
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  stripePaymentIntentId?: string;
  metadata?: any;
  createdAt: Date;
  updatedAt: Date;
}

interface PaymentSchedule {
  id: string;
  enrollmentId: string;
  sequenceNumber: number;
  dueDate: Date;
  amount: number;
  status: 'scheduled' | 'pending' | 'processing' | 'paid' | 'failed' | 'waived';
  paidDate?: Date;
  paidAmount?: number;
  failureReason?: string;
  retryCount: number;
  nextRetryDate?: Date;
  isLate: boolean;
  lateFeeApplied?: number;
  remindersSent: number;
  lastReminderSent?: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface PaymentTransaction {
  id: string;
  enrollmentId: string;
  scheduleId?: string;
  type: 'payment' | 'refund' | 'fee' | 'adjustment';
  amount: number;
  currency: 'CAD' | 'USD';
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  paymentMethod: string;
  stripePaymentIntentId?: string;
  stripeChargeId?: string;
  stripeRefundId?: string;
  failureCode?: string;
  failureMessage?: string;
  processedAt?: Date;
  description?: string;
  metadata?: any;
  createdAt: Date;
}

export class PaymentPlansService {
  private stripe: Stripe;

  constructor() {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2023-10-16'
    });
  }

  async createPaymentPlan(
    plan: {
      name: string;
      description: string;
      type: 'fixed' | 'installment' | 'subscription' | 'deferred';
      amount: number;
      currency?: 'CAD' | 'USD';
      interval?: 'monthly' | 'weekly' | 'biweekly';
      installmentCount?: number;
      downPaymentPercentage?: number;
      deferralPeriodDays?: number;
      interestRate?: number;
      lateFeePercentage?: number;
      gracePeriodDays?: number;
      eligibilityCriteria?: any;
      terms: string;
    }
  ): Promise<PaymentPlan> {
    try {
      // Validate plan configuration
      this.validatePlanConfiguration(plan);

      // Calculate down payment amount if percentage is provided
      const downPaymentAmount = plan.downPaymentPercentage 
        ? Math.round(plan.amount * plan.downPaymentPercentage / 100)
        : undefined;

      const planData = {
        id: uuidv4(),
        name: plan.name,
        description: plan.description,
        type: plan.type,
        amount: plan.amount,
        currency: plan.currency || 'CAD',
        interval: plan.interval,
        installment_count: plan.installmentCount,
        down_payment: downPaymentAmount,
        down_payment_percentage: plan.downPaymentPercentage,
        deferral_period_days: plan.deferralPeriodDays,
        interest_rate: plan.interestRate,
        late_fee_percentage: plan.lateFeePercentage,
        grace_period_days: plan.gracePeriodDays || 3,
        is_active: true,
        eligibility_criteria: JSON.stringify(plan.eligibilityCriteria || {}),
        terms: plan.terms,
        created_at: new Date(),
        updated_at: new Date()
      };

      const [savedPlan] = await db('payment_plans')
        .insert(planData)
        .returning('*');

      // Create Stripe product/price if subscription
      if (plan.type === 'subscription') {
        await this.createStripeSubscriptionPlan(savedPlan);
      }

      return this.transformPaymentPlan(savedPlan);
    } catch (error) {
      console.error('Error creating payment plan:', error);
      throw new Error('Failed to create payment plan');
    }
  }

  async enrollInPaymentPlan(
    userId: string,
    userType: 'user' | 'attorney',
    planId: string,
    enrollment: {
      totalAmount: number;
      consultationId?: string;
      matchId?: string;
      paymentMethodId?: string;
      startDate?: Date;
    }
  ): Promise<PaymentPlanEnrollment> {
    try {
      // Get plan details
      const plan = await db('payment_plans')
        .where('id', planId)
        .where('is_active', true)
        .first();

      if (!plan) {
        throw new Error('Payment plan not found');
      }

      // Check eligibility
      await this.checkEligibility(userId, userType, plan, enrollment.totalAmount);

      // Create or get Stripe customer
      const stripeCustomer = await this.getOrCreateStripeCustomer(userId, userType);

      // Attach payment method if provided
      if (enrollment.paymentMethodId) {
        await this.stripe.paymentMethods.attach(enrollment.paymentMethodId, {
          customer: stripeCustomer.id
        });

        await this.stripe.customers.update(stripeCustomer.id, {
          invoice_settings: {
            default_payment_method: enrollment.paymentMethodId
          }
        });
      }

      // Calculate payment schedule
      const schedule = this.calculatePaymentSchedule(
        plan,
        enrollment.totalAmount,
        enrollment.startDate || new Date()
      );

      // Create enrollment record
      const enrollmentData = {
        id: uuidv4(),
        plan_id: planId,
        user_id: userId,
        user_type: userType,
        consultation_id: enrollment.consultationId,
        match_id: enrollment.matchId,
        status: 'pending',
        total_amount: enrollment.totalAmount,
        paid_amount: 0,
        remaining_amount: enrollment.totalAmount,
        down_payment_amount: schedule.downPayment,
        down_payment_paid: false,
        installment_amount: schedule.installmentAmount,
        next_payment_date: schedule.firstPaymentDate,
        next_payment_amount: schedule.downPayment || schedule.installmentAmount,
        start_date: enrollment.startDate || new Date(),
        stripe_customer_id: stripeCustomer.id,
        created_at: new Date(),
        updated_at: new Date()
      };

      const [savedEnrollment] = await db('payment_plan_enrollments')
        .insert(enrollmentData)
        .returning('*');

      // Create payment schedule records
      await this.createPaymentScheduleRecords(savedEnrollment.id, schedule);

      // Process down payment if required
      if (schedule.downPayment > 0) {
        await this.processDownPayment(savedEnrollment.id, schedule.downPayment);
      } else {
        // Activate enrollment if no down payment required
        await this.activateEnrollment(savedEnrollment.id);
      }

      // Set up recurring payments
      if (plan.type === 'subscription') {
        await this.setupStripeSubscription(savedEnrollment, plan);
      }

      return this.transformEnrollment(savedEnrollment);
    } catch (error) {
      console.error('Error enrolling in payment plan:', error);
      throw new Error('Failed to enroll in payment plan');
    }
  }

  async processScheduledPayment(scheduleId: string): Promise<PaymentTransaction> {
    try {
      const schedule = await db('payment_schedules')
        .where('id', scheduleId)
        .first();

      if (!schedule || schedule.status !== 'pending') {
        throw new Error('Invalid payment schedule');
      }

      const enrollment = await db('payment_plan_enrollments')
        .where('id', schedule.enrollment_id)
        .first();

      if (!enrollment || enrollment.status !== 'active') {
        throw new Error('Enrollment not active');
      }

      // Update schedule status
      await db('payment_schedules')
        .where('id', scheduleId)
        .update({ 
          status: 'processing',
          updated_at: new Date()
        });

      // Process payment with Stripe
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(schedule.amount * 100), // Convert to cents
        currency: 'cad',
        customer: enrollment.stripe_customer_id,
        payment_method: enrollment.payment_method_id,
        off_session: true,
        confirm: true,
        description: `Payment plan installment #${schedule.sequence_number}`,
        metadata: {
          enrollment_id: enrollment.id,
          schedule_id: schedule.id,
          user_id: enrollment.user_id,
          user_type: enrollment.user_type
        }
      });

      // Create transaction record
      const transaction = {
        id: uuidv4(),
        enrollment_id: enrollment.id,
        schedule_id: schedule.id,
        type: 'payment',
        amount: schedule.amount,
        currency: 'CAD',
        status: paymentIntent.status === 'succeeded' ? 'completed' : 'failed',
        payment_method: 'card',
        stripe_payment_intent_id: paymentIntent.id,
        stripe_charge_id: paymentIntent.charges.data[0]?.id,
        processed_at: new Date(),
        created_at: new Date()
      };

      const [savedTransaction] = await db('payment_transactions')
        .insert(transaction)
        .returning('*');

      if (paymentIntent.status === 'succeeded') {
        // Update schedule
        await db('payment_schedules')
          .where('id', scheduleId)
          .update({
            status: 'paid',
            paid_date: new Date(),
            paid_amount: schedule.amount,
            updated_at: new Date()
          });

        // Update enrollment
        await db('payment_plan_enrollments')
          .where('id', enrollment.id)
          .increment('paid_amount', schedule.amount)
          .decrement('remaining_amount', schedule.amount)
          .update({
            updated_at: new Date()
          });

        // Check if plan is completed
        await this.checkEnrollmentCompletion(enrollment.id);

        // Send payment confirmation
        await this.sendPaymentNotification(enrollment.id, 'success', schedule.amount);
      } else {
        // Handle payment failure
        await this.handlePaymentFailure(scheduleId, paymentIntent);
      }

      return this.transformTransaction(savedTransaction);
    } catch (error) {
      console.error('Error processing scheduled payment:', error);
      
      // Update schedule status to failed
      await db('payment_schedules')
        .where('id', scheduleId)
        .update({
          status: 'failed',
          failure_reason: error.message,
          retry_count: db.raw('retry_count + 1'),
          next_retry_date: new Date(Date.now() + 24 * 60 * 60 * 1000), // Retry tomorrow
          updated_at: new Date()
        });

      throw new Error('Failed to process payment');
    }
  }

  async updatePaymentMethod(
    enrollmentId: string,
    userId: string,
    paymentMethodId: string
  ): Promise<void> {
    try {
      const enrollment = await db('payment_plan_enrollments')
        .where('id', enrollmentId)
        .where('user_id', userId)
        .first();

      if (!enrollment) {
        throw new Error('Enrollment not found');
      }

      // Attach new payment method to Stripe customer
      await this.stripe.paymentMethods.attach(paymentMethodId, {
        customer: enrollment.stripe_customer_id
      });

      // Set as default payment method
      await this.stripe.customers.update(enrollment.stripe_customer_id, {
        invoice_settings: {
          default_payment_method: paymentMethodId
        }
      });

      // Get payment method details
      const paymentMethod = await this.stripe.paymentMethods.retrieve(paymentMethodId);

      // Update enrollment
      await db('payment_plan_enrollments')
        .where('id', enrollmentId)
        .update({
          payment_method: JSON.stringify({
            type: paymentMethod.type,
            last4: paymentMethod.card?.last4,
            brand: paymentMethod.card?.brand
          }),
          updated_at: new Date()
        });

      // Update Stripe subscription if applicable
      if (enrollment.stripe_subscription_id) {
        await this.stripe.subscriptions.update(enrollment.stripe_subscription_id, {
          default_payment_method: paymentMethodId
        });
      }
    } catch (error) {
      console.error('Error updating payment method:', error);
      throw new Error('Failed to update payment method');
    }
  }

  async pausePaymentPlan(
    enrollmentId: string,
    userId: string,
    reason?: string,
    resumeDate?: Date
  ): Promise<void> {
    try {
      const enrollment = await db('payment_plan_enrollments')
        .where('id', enrollmentId)
        .where('user_id', userId)
        .where('status', 'active')
        .first();

      if (!enrollment) {
        throw new Error('Active enrollment not found');
      }

      // Update enrollment status
      await db('payment_plan_enrollments')
        .where('id', enrollmentId)
        .update({
          status: 'paused',
          pause_reason: reason,
          pause_date: new Date(),
          resume_date: resumeDate,
          updated_at: new Date()
        });

      // Pause Stripe subscription if applicable
      if (enrollment.stripe_subscription_id) {
        await this.stripe.subscriptions.update(enrollment.stripe_subscription_id, {
          pause_collection: {
            behavior: 'void'
          }
        });
      }

      // Reschedule upcoming payments
      await this.reschedulePendingPayments(enrollmentId, resumeDate);

      // Send notification
      await this.sendPaymentNotification(enrollmentId, 'paused');
    } catch (error) {
      console.error('Error pausing payment plan:', error);
      throw new Error('Failed to pause payment plan');
    }
  }

  async resumePaymentPlan(enrollmentId: string, userId: string): Promise<void> {
    try {
      const enrollment = await db('payment_plan_enrollments')
        .where('id', enrollmentId)
        .where('user_id', userId)
        .where('status', 'paused')
        .first();

      if (!enrollment) {
        throw new Error('Paused enrollment not found');
      }

      // Update enrollment status
      await db('payment_plan_enrollments')
        .where('id', enrollmentId)
        .update({
          status: 'active',
          resume_date: new Date(),
          updated_at: new Date()
        });

      // Resume Stripe subscription if applicable
      if (enrollment.stripe_subscription_id) {
        await this.stripe.subscriptions.update(enrollment.stripe_subscription_id, {
          pause_collection: null
        });
      }

      // Send notification
      await this.sendPaymentNotification(enrollmentId, 'resumed');
    } catch (error) {
      console.error('Error resuming payment plan:', error);
      throw new Error('Failed to resume payment plan');
    }
  }

  async cancelPaymentPlan(
    enrollmentId: string,
    userId: string,
    reason?: string
  ): Promise<void> {
    try {
      const enrollment = await db('payment_plan_enrollments')
        .where('id', enrollmentId)
        .where('user_id', userId)
        .whereIn('status', ['active', 'paused'])
        .first();

      if (!enrollment) {
        throw new Error('Enrollment not found');
      }

      // Update enrollment status
      await db('payment_plan_enrollments')
        .where('id', enrollmentId)
        .update({
          status: 'cancelled',
          cancelled_date: new Date(),
          cancellation_reason: reason,
          updated_at: new Date()
        });

      // Cancel Stripe subscription if applicable
      if (enrollment.stripe_subscription_id) {
        await this.stripe.subscriptions.cancel(enrollment.stripe_subscription_id);
      }

      // Cancel pending payments
      await db('payment_schedules')
        .where('enrollment_id', enrollmentId)
        .where('status', 'scheduled')
        .update({
          status: 'cancelled',
          updated_at: new Date()
        });

      // Send notification
      await this.sendPaymentNotification(enrollmentId, 'cancelled');
    } catch (error) {
      console.error('Error cancelling payment plan:', error);
      throw new Error('Failed to cancel payment plan');
    }
  }

  async getPaymentPlanDetails(
    enrollmentId: string,
    userId: string
  ): Promise<{
    enrollment: PaymentPlanEnrollment;
    plan: PaymentPlan;
    schedule: PaymentSchedule[];
    transactions: PaymentTransaction[];
  }> {
    try {
      const enrollment = await db('payment_plan_enrollments')
        .where('id', enrollmentId)
        .where('user_id', userId)
        .first();

      if (!enrollment) {
        throw new Error('Enrollment not found');
      }

      const plan = await db('payment_plans')
        .where('id', enrollment.plan_id)
        .first();

      const schedule = await db('payment_schedules')
        .where('enrollment_id', enrollmentId)
        .orderBy('sequence_number');

      const transactions = await db('payment_transactions')
        .where('enrollment_id', enrollmentId)
        .orderBy('created_at', 'desc');

      return {
        enrollment: this.transformEnrollment(enrollment),
        plan: this.transformPaymentPlan(plan),
        schedule: schedule.map(s => this.transformSchedule(s)),
        transactions: transactions.map(t => this.transformTransaction(t))
      };
    } catch (error) {
      console.error('Error getting payment plan details:', error);
      throw new Error('Failed to get payment plan details');
    }
  }

  async getAvailablePaymentPlans(
    userId: string,
    userType: 'user' | 'attorney',
    caseValue?: number,
    practiceArea?: string
  ): Promise<PaymentPlan[]> {
    try {
      const plans = await db('payment_plans')
        .where('is_active', true);

      // Filter based on eligibility criteria
      const eligiblePlans = plans.filter(plan => {
        const criteria = JSON.parse(plan.eligibility_criteria || '{}');

        if (criteria.minCaseValue && caseValue && caseValue < criteria.minCaseValue) {
          return false;
        }

        if (criteria.maxCaseValue && caseValue && caseValue > criteria.maxCaseValue) {
          return false;
        }

        if (criteria.allowedPracticeAreas?.length && practiceArea && 
            !criteria.allowedPracticeAreas.includes(practiceArea)) {
          return false;
        }

        if (criteria.clientTypes?.length && !criteria.clientTypes.includes(userType)) {
          return false;
        }

        return true;
      });

      return eligiblePlans.map(plan => this.transformPaymentPlan(plan));
    } catch (error) {
      console.error('Error getting available payment plans:', error);
      throw new Error('Failed to get available payment plans');
    }
  }

  async processAutomaticPayments(): Promise<void> {
    try {
      // Get due payments
      const duePayments = await db('payment_schedules')
        .where('status', 'scheduled')
        .where('due_date', '<=', new Date())
        .join('payment_plan_enrollments', 'payment_schedules.enrollment_id', 'payment_plan_enrollments.id')
        .where('payment_plan_enrollments.status', 'active')
        .select('payment_schedules.*')
        .limit(50);

      // Process each payment
      for (const payment of duePayments) {
        try {
          await this.processScheduledPayment(payment.id);
        } catch (error) {
          console.error(`Failed to process payment ${payment.id}:`, error);
        }
      }
    } catch (error) {
      console.error('Error processing automatic payments:', error);
    }
  }

  async sendPaymentReminders(): Promise<void> {
    try {
      // Get upcoming payments (3 days before due)
      const upcomingPayments = await db('payment_schedules')
        .where('status', 'scheduled')
        .whereBetween('due_date', [
          new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
          new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
        ])
        .where('reminders_sent', '<', 1)
        .join('payment_plan_enrollments', 'payment_schedules.enrollment_id', 'payment_plan_enrollments.id')
        .where('payment_plan_enrollments.status', 'active')
        .select('payment_schedules.*', 'payment_plan_enrollments.user_id', 'payment_plan_enrollments.user_type');

      for (const payment of upcomingPayments) {
        await this.sendPaymentNotification(
          payment.enrollment_id,
          'reminder',
          payment.amount,
          payment.due_date
        );

        await db('payment_schedules')
          .where('id', payment.id)
          .update({
            reminders_sent: db.raw('reminders_sent + 1'),
            last_reminder_sent: new Date()
          });
      }
    } catch (error) {
      console.error('Error sending payment reminders:', error);
    }
  }

  private validatePlanConfiguration(plan: any): void {
    switch (plan.type) {
      case 'installment':
        if (!plan.installmentCount || plan.installmentCount < 2) {
          throw new Error('Installment plans require at least 2 installments');
        }
        if (!plan.interval) {
          throw new Error('Installment plans require payment interval');
        }
        break;

      case 'subscription':
        if (!plan.interval) {
          throw new Error('Subscription plans require payment interval');
        }
        break;

      case 'deferred':
        if (!plan.deferralPeriodDays) {
          throw new Error('Deferred plans require deferral period');
        }
        break;
    }
  }

  private async checkEligibility(
    userId: string,
    userType: 'user' | 'attorney',
    plan: any,
    amount: number
  ): Promise<void> {
    const criteria = JSON.parse(plan.eligibility_criteria || '{}');

    // Check credit if required
    if (criteria.creditCheckRequired) {
      // Mock credit check - in production, integrate with credit bureau
      const creditScore = await this.performCreditCheck(userId);
      if (creditScore < 600) {
        throw new Error('Credit check failed');
      }
    }

    // Check existing enrollments
    const activeEnrollments = await db('payment_plan_enrollments')
      .where('user_id', userId)
      .whereIn('status', ['active', 'defaulted'])
      .count('* as count')
      .first();

    if (parseInt(activeEnrollments?.count || '0') >= 3) {
      throw new Error('Maximum active payment plans reached');
    }
  }

  private async performCreditCheck(userId: string): Promise<number> {
    // Mock implementation - in production, integrate with credit bureau API
    return 700; // Mock credit score
  }

  private calculatePaymentSchedule(plan: any, totalAmount: number, startDate: Date): any {
    const schedule = {
      downPayment: 0,
      installmentAmount: 0,
      installments: [] as any[],
      firstPaymentDate: new Date(startDate)
    };

    // Calculate down payment
    if (plan.down_payment_percentage) {
      schedule.downPayment = Math.round(totalAmount * plan.down_payment_percentage / 100);
    } else if (plan.down_payment) {
      schedule.downPayment = plan.down_payment;
    }

    const remainingAmount = totalAmount - schedule.downPayment;

    switch (plan.type) {
      case 'installment':
        schedule.installmentAmount = Math.round(remainingAmount / plan.installment_count);
        
        for (let i = 0; i < plan.installment_count; i++) {
          const dueDate = this.calculateNextPaymentDate(startDate, plan.interval, i + 1);
          schedule.installments.push({
            sequenceNumber: i + 1,
            dueDate,
            amount: schedule.installmentAmount
          });
        }
        break;

      case 'subscription':
        schedule.installmentAmount = plan.amount;
        // Subscription payments handled by Stripe
        break;

      case 'deferred':
        schedule.firstPaymentDate = new Date(startDate.getTime() + plan.deferral_period_days * 24 * 60 * 60 * 1000);
        schedule.installmentAmount = totalAmount;
        schedule.installments.push({
          sequenceNumber: 1,
          dueDate: schedule.firstPaymentDate,
          amount: totalAmount
        });
        break;

      case 'fixed':
        schedule.installmentAmount = totalAmount;
        schedule.installments.push({
          sequenceNumber: 1,
          dueDate: startDate,
          amount: totalAmount
        });
        break;
    }

    return schedule;
  }

  private calculateNextPaymentDate(startDate: Date, interval: string, sequenceNumber: number): Date {
    const date = new Date(startDate);

    switch (interval) {
      case 'weekly':
        date.setDate(date.getDate() + (7 * sequenceNumber));
        break;
      case 'biweekly':
        date.setDate(date.getDate() + (14 * sequenceNumber));
        break;
      case 'monthly':
        date.setMonth(date.getMonth() + sequenceNumber);
        break;
    }

    return date;
  }

  private async createPaymentScheduleRecords(enrollmentId: string, schedule: any): Promise<void> {
    const scheduleRecords = schedule.installments.map((installment: any) => ({
      id: uuidv4(),
      enrollment_id: enrollmentId,
      sequence_number: installment.sequenceNumber,
      due_date: installment.dueDate,
      amount: installment.amount,
      status: 'scheduled',
      retry_count: 0,
      is_late: false,
      reminders_sent: 0,
      created_at: new Date(),
      updated_at: new Date()
    }));

    if (scheduleRecords.length > 0) {
      await db('payment_schedules').insert(scheduleRecords);
    }
  }

  private async processDownPayment(enrollmentId: string, amount: number): Promise<void> {
    // Create payment intent for down payment
    const enrollment = await db('payment_plan_enrollments')
      .where('id', enrollmentId)
      .first();

    const paymentIntent = await this.stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: 'cad',
      customer: enrollment.stripe_customer_id,
      payment_method: enrollment.payment_method_id,
      confirm: true,
      description: 'Payment plan down payment',
      metadata: {
        enrollment_id: enrollmentId,
        payment_type: 'down_payment'
      }
    });

    if (paymentIntent.status === 'succeeded') {
      await db('payment_plan_enrollments')
        .where('id', enrollmentId)
        .update({
          down_payment_paid: true,
          paid_amount: amount,
          remaining_amount: enrollment.total_amount - amount,
          status: 'active',
          updated_at: new Date()
        });

      // Create transaction record
      await db('payment_transactions').insert({
        id: uuidv4(),
        enrollment_id: enrollmentId,
        type: 'payment',
        amount: amount,
        currency: 'CAD',
        status: 'completed',
        payment_method: 'card',
        stripe_payment_intent_id: paymentIntent.id,
        stripe_charge_id: paymentIntent.charges.data[0]?.id,
        processed_at: new Date(),
        description: 'Down payment',
        created_at: new Date()
      });

      await this.sendPaymentNotification(enrollmentId, 'down_payment_success', amount);
    } else {
      throw new Error('Down payment failed');
    }
  }

  private async activateEnrollment(enrollmentId: string): Promise<void> {
    await db('payment_plan_enrollments')
      .where('id', enrollmentId)
      .update({
        status: 'active',
        updated_at: new Date()
      });
  }

  private async setupStripeSubscription(enrollment: any, plan: any): Promise<void> {
    const subscription = await this.stripe.subscriptions.create({
      customer: enrollment.stripe_customer_id,
      items: [{
        price: plan.stripe_price_id
      }],
      metadata: {
        enrollment_id: enrollment.id
      }
    });

    await db('payment_plan_enrollments')
      .where('id', enrollment.id)
      .update({
        stripe_subscription_id: subscription.id,
        updated_at: new Date()
      });
  }

  private async createStripeSubscriptionPlan(plan: any): Promise<void> {
    const product = await this.stripe.products.create({
      name: plan.name,
      description: plan.description
    });

    const price = await this.stripe.prices.create({
      product: product.id,
      unit_amount: Math.round(plan.amount * 100),
      currency: plan.currency.toLowerCase(),
      recurring: {
        interval: plan.interval === 'biweekly' ? 'week' : plan.interval,
        interval_count: plan.interval === 'biweekly' ? 2 : 1
      }
    });

    await db('payment_plans')
      .where('id', plan.id)
      .update({
        stripe_product_id: product.id,
        stripe_price_id: price.id
      });
  }

  private async handlePaymentFailure(scheduleId: string, paymentIntent: any): Promise<void> {
    const schedule = await db('payment_schedules')
      .where('id', scheduleId)
      .first();

    const plan = await db('payment_plans')
      .join('payment_plan_enrollments', 'payment_plans.id', 'payment_plan_enrollments.plan_id')
      .where('payment_plan_enrollments.id', schedule.enrollment_id)
      .first();

    // Apply late fee if applicable
    let lateFee = 0;
    if (plan.late_fee_percentage && schedule.is_late) {
      lateFee = Math.round(schedule.amount * plan.late_fee_percentage / 100);
    } else if (plan.late_fee_amount && schedule.is_late) {
      lateFee = plan.late_fee_amount;
    }

    await db('payment_schedules')
      .where('id', scheduleId)
      .update({
        status: 'failed',
        failure_reason: paymentIntent.last_payment_error?.message,
        retry_count: schedule.retry_count + 1,
        next_retry_date: new Date(Date.now() + 24 * 60 * 60 * 1000),
        late_fee_applied: lateFee,
        updated_at: new Date()
      });

    // Check if max retries exceeded
    if (schedule.retry_count >= 3) {
      await this.markEnrollmentAsDefaulted(schedule.enrollment_id);
    }

    await this.sendPaymentNotification(schedule.enrollment_id, 'failed', schedule.amount);
  }

  private async markEnrollmentAsDefaulted(enrollmentId: string): Promise<void> {
    await db('payment_plan_enrollments')
      .where('id', enrollmentId)
      .update({
        status: 'defaulted',
        defaulted_date: new Date(),
        updated_at: new Date()
      });

    await this.sendPaymentNotification(enrollmentId, 'defaulted');
  }

  private async checkEnrollmentCompletion(enrollmentId: string): Promise<void> {
    const enrollment = await db('payment_plan_enrollments')
      .where('id', enrollmentId)
      .first();

    if (enrollment.paid_amount >= enrollment.total_amount) {
      await db('payment_plan_enrollments')
        .where('id', enrollmentId)
        .update({
          status: 'completed',
          completed_date: new Date(),
          updated_at: new Date()
        });

      await this.sendPaymentNotification(enrollmentId, 'completed');
    }
  }

  private async reschedulePendingPayments(enrollmentId: string, resumeDate?: Date): Promise<void> {
    const baseDate = resumeDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // Default 30 days

    const pendingPayments = await db('payment_schedules')
      .where('enrollment_id', enrollmentId)
      .where('status', 'scheduled')
      .orderBy('sequence_number');

    for (let i = 0; i < pendingPayments.length; i++) {
      const newDueDate = new Date(baseDate.getTime() + i * 30 * 24 * 60 * 60 * 1000); // Monthly intervals
      
      await db('payment_schedules')
        .where('id', pendingPayments[i].id)
        .update({
          due_date: newDueDate,
          updated_at: new Date()
        });
    }
  }

  private async getOrCreateStripeCustomer(userId: string, userType: 'user' | 'attorney'): Promise<any> {
    const user = await db(userType === 'user' ? 'users' : 'attorneys')
      .where('id', userId)
      .first();

    if (user.stripe_customer_id) {
      return await this.stripe.customers.retrieve(user.stripe_customer_id);
    }

    const customer = await this.stripe.customers.create({
      email: user.email,
      name: `${user.first_name} ${user.last_name}`,
      metadata: {
        user_id: userId,
        user_type: userType
      }
    });

    await db(userType === 'user' ? 'users' : 'attorneys')
      .where('id', userId)
      .update({ stripe_customer_id: customer.id });

    return customer;
  }

  private async sendPaymentNotification(
    enrollmentId: string,
    type: string,
    amount?: number,
    dueDate?: Date
  ): Promise<void> {
    // Mock implementation - in production, send emails/push notifications
    console.log(`Sending ${type} notification for enrollment ${enrollmentId}`);
  }

  private transformPaymentPlan(plan: any): PaymentPlan {
    return {
      id: plan.id,
      name: plan.name,
      description: plan.description,
      type: plan.type,
      amount: plan.amount,
      currency: plan.currency,
      interval: plan.interval,
      installmentCount: plan.installment_count,
      downPayment: plan.down_payment,
      downPaymentPercentage: plan.down_payment_percentage,
      deferralPeriodDays: plan.deferral_period_days,
      interestRate: plan.interest_rate,
      lateFeeAmount: plan.late_fee_amount,
      lateFeePercentage: plan.late_fee_percentage,
      gracePeriodDays: plan.grace_period_days,
      isActive: plan.is_active,
      eligibilityCriteria: JSON.parse(plan.eligibility_criteria || '{}'),
      terms: plan.terms,
      createdAt: plan.created_at,
      updatedAt: plan.updated_at
    };
  }

  private transformEnrollment(enrollment: any): PaymentPlanEnrollment {
    return {
      id: enrollment.id,
      planId: enrollment.plan_id,
      userId: enrollment.user_id,
      userType: enrollment.user_type,
      consultationId: enrollment.consultation_id,
      matchId: enrollment.match_id,
      status: enrollment.status,
      totalAmount: enrollment.total_amount,
      paidAmount: enrollment.paid_amount,
      remainingAmount: enrollment.remaining_amount,
      downPaymentAmount: enrollment.down_payment_amount,
      downPaymentPaid: enrollment.down_payment_paid,
      installmentAmount: enrollment.installment_amount,
      nextPaymentDate: enrollment.next_payment_date,
      nextPaymentAmount: enrollment.next_payment_amount,
      startDate: enrollment.start_date,
      endDate: enrollment.end_date,
      completedDate: enrollment.completed_date,
      defaultedDate: enrollment.defaulted_date,
      cancelledDate: enrollment.cancelled_date,
      paymentMethod: enrollment.payment_method ? JSON.parse(enrollment.payment_method) : undefined,
      stripeCustomerId: enrollment.stripe_customer_id,
      stripeSubscriptionId: enrollment.stripe_subscription_id,
      stripePaymentIntentId: enrollment.stripe_payment_intent_id,
      metadata: enrollment.metadata ? JSON.parse(enrollment.metadata) : undefined,
      createdAt: enrollment.created_at,
      updatedAt: enrollment.updated_at
    };
  }

  private transformSchedule(schedule: any): PaymentSchedule {
    return {
      id: schedule.id,
      enrollmentId: schedule.enrollment_id,
      sequenceNumber: schedule.sequence_number,
      dueDate: schedule.due_date,
      amount: schedule.amount,
      status: schedule.status,
      paidDate: schedule.paid_date,
      paidAmount: schedule.paid_amount,
      failureReason: schedule.failure_reason,
      retryCount: schedule.retry_count,
      nextRetryDate: schedule.next_retry_date,
      isLate: schedule.is_late,
      lateFeeApplied: schedule.late_fee_applied,
      remindersSent: schedule.reminders_sent,
      lastReminderSent: schedule.last_reminder_sent,
      createdAt: schedule.created_at,
      updatedAt: schedule.updated_at
    };
  }

  private transformTransaction(transaction: any): PaymentTransaction {
    return {
      id: transaction.id,
      enrollmentId: transaction.enrollment_id,
      scheduleId: transaction.schedule_id,
      type: transaction.type,
      amount: transaction.amount,
      currency: transaction.currency,
      status: transaction.status,
      paymentMethod: transaction.payment_method,
      stripePaymentIntentId: transaction.stripe_payment_intent_id,
      stripeChargeId: transaction.stripe_charge_id,
      stripeRefundId: transaction.stripe_refund_id,
      failureCode: transaction.failure_code,
      failureMessage: transaction.failure_message,
      processedAt: transaction.processed_at,
      description: transaction.description,
      metadata: transaction.metadata ? JSON.parse(transaction.metadata) : undefined,
      createdAt: transaction.created_at
    };
  }
}

// Database schema additions needed:
/*
CREATE TABLE payment_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  type VARCHAR(20) NOT NULL CHECK (type IN ('fixed', 'installment', 'subscription', 'deferred')),
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'CAD' CHECK (currency IN ('CAD', 'USD')),
  interval VARCHAR(20) CHECK (interval IN ('monthly', 'weekly', 'biweekly')),
  installment_count INTEGER,
  down_payment DECIMAL(10,2),
  down_payment_percentage INTEGER,
  deferral_period_days INTEGER,
  interest_rate DECIMAL(5,2),
  late_fee_amount DECIMAL(10,2),
  late_fee_percentage DECIMAL(5,2),
  grace_period_days INTEGER DEFAULT 3,
  is_active BOOLEAN DEFAULT TRUE,
  eligibility_criteria JSONB DEFAULT '{}',
  terms TEXT NOT NULL,
  stripe_product_id VARCHAR(255),
  stripe_price_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE payment_plan_enrollments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plan_id UUID REFERENCES payment_plans(id),
  user_id UUID NOT NULL,
  user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('user', 'attorney')),
  consultation_id UUID REFERENCES video_consultations(id),
  match_id UUID REFERENCES matches(id),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed', 'defaulted', 'cancelled', 'paused')),
  total_amount DECIMAL(10,2) NOT NULL,
  paid_amount DECIMAL(10,2) DEFAULT 0,
  remaining_amount DECIMAL(10,2) NOT NULL,
  down_payment_amount DECIMAL(10,2),
  down_payment_paid BOOLEAN DEFAULT FALSE,
  installment_amount DECIMAL(10,2) NOT NULL,
  next_payment_date DATE,
  next_payment_amount DECIMAL(10,2),
  start_date DATE NOT NULL,
  end_date DATE,
  completed_date TIMESTAMP,
  defaulted_date TIMESTAMP,
  cancelled_date TIMESTAMP,
  pause_date TIMESTAMP,
  resume_date TIMESTAMP,
  pause_reason TEXT,
  cancellation_reason TEXT,
  payment_method JSONB,
  payment_method_id VARCHAR(255),
  stripe_customer_id VARCHAR(255),
  stripe_subscription_id VARCHAR(255),
  stripe_payment_intent_id VARCHAR(255),
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE payment_schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  enrollment_id UUID REFERENCES payment_plan_enrollments(id) ON DELETE CASCADE,
  sequence_number INTEGER NOT NULL,
  due_date DATE NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'pending', 'processing', 'paid', 'failed', 'waived', 'cancelled')),
  paid_date TIMESTAMP,
  paid_amount DECIMAL(10,2),
  failure_reason TEXT,
  retry_count INTEGER DEFAULT 0,
  next_retry_date DATE,
  is_late BOOLEAN DEFAULT FALSE,
  late_fee_applied DECIMAL(10,2),
  reminders_sent INTEGER DEFAULT 0,
  last_reminder_sent TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE payment_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  enrollment_id UUID REFERENCES payment_plan_enrollments(id) ON DELETE CASCADE,
  schedule_id UUID REFERENCES payment_schedules(id),
  type VARCHAR(20) NOT NULL CHECK (type IN ('payment', 'refund', 'fee', 'adjustment')),
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'CAD',
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  payment_method VARCHAR(50),
  stripe_payment_intent_id VARCHAR(255),
  stripe_charge_id VARCHAR(255),
  stripe_refund_id VARCHAR(255),
  failure_code VARCHAR(50),
  failure_message TEXT,
  processed_at TIMESTAMP,
  description TEXT,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_payment_plan_enrollments_user ON payment_plan_enrollments(user_id, user_type);
CREATE INDEX idx_payment_plan_enrollments_status ON payment_plan_enrollments(status);
CREATE INDEX idx_payment_schedules_enrollment ON payment_schedules(enrollment_id);
CREATE INDEX idx_payment_schedules_due_date ON payment_schedules(due_date);
CREATE INDEX idx_payment_schedules_status ON payment_schedules(status);
CREATE INDEX idx_payment_transactions_enrollment ON payment_transactions(enrollment_id);
CREATE INDEX idx_payment_transactions_stripe ON payment_transactions(stripe_payment_intent_id);
*/