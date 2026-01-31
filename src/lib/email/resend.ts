/**
 * EMAIL SERVICE - RESEND API INTEGRATION
 * 
 * Handles transactional emails through Resend API.
 * Note: In production, emails should be sent from backend/serverless functions.
 */

// ==================== TYPES ====================

export type EmailType =
  | 'welcome'
  | 'payment_confirmation'
  | 'password_reset'
  | 'weekly_summary'
  | 'subscription_expiring'
  | 'milestone_celebration';

export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface WelcomeEmailData {
  userName: string;
  userEmail: string;
}

export interface PaymentEmailData {
  userName: string;
  userEmail: string;
  planName: string;
  amount: string;
  transactionId: string;
  date: string;
}

export interface PasswordResetData {
  userName: string;
  userEmail: string;
  resetLink: string;
  expiresIn: string;
}

export interface WeeklySummaryData {
  userName: string;
  userEmail: string;
  weekNumber: number;
  workoutsCompleted: number;
  totalWorkouts: number;
  fastingCompliance: number;
  caloriesBurned: number;
  currentStreak: number;
  topAchievement?: string;
}

export interface MilestoneEmailData {
  userName: string;
  userEmail: string;
  milestoneName: string;
  milestoneDescription: string;
}

// ==================== CONFIGURATION ====================

// In production, this would be stored securely
// and emails would be sent via backend API
const RESEND_API_KEY = process.env.EXPO_PUBLIC_RESEND_API_KEY || '';
const FROM_EMAIL = 'Calisthenic Commando <noreply@calistheniccommando.com>';
const SUPPORT_EMAIL = 'support@calistheniccommando.com';

// ==================== EMAIL TEMPLATES ====================

const emailStyles = `
  <style>
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.6;
      color: #1a1a1a;
      background-color: #f5f5f5;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .header {
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      padding: 32px;
      text-align: center;
    }
    .header h1 {
      color: white;
      margin: 0;
      font-size: 24px;
      font-weight: 700;
    }
    .header img {
      width: 80px;
      height: 80px;
      margin-bottom: 16px;
    }
    .content {
      padding: 32px;
    }
    .content h2 {
      color: #10b981;
      margin-top: 0;
    }
    .button {
      display: inline-block;
      background: #10b981;
      color: white !important;
      text-decoration: none;
      padding: 14px 28px;
      border-radius: 8px;
      font-weight: 600;
      margin: 16px 0;
    }
    .button:hover {
      background: #059669;
    }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
      margin: 24px 0;
    }
    .stat-card {
      background: #f0fdf4;
      padding: 16px;
      border-radius: 8px;
      text-align: center;
    }
    .stat-value {
      font-size: 28px;
      font-weight: 700;
      color: #10b981;
    }
    .stat-label {
      font-size: 12px;
      color: #6b7280;
      text-transform: uppercase;
    }
    .footer {
      background: #f9fafb;
      padding: 24px 32px;
      text-align: center;
      font-size: 14px;
      color: #6b7280;
    }
    .footer a {
      color: #10b981;
    }
    .divider {
      border-top: 1px solid #e5e7eb;
      margin: 24px 0;
    }
    .highlight {
      background: #fef3c7;
      padding: 16px;
      border-radius: 8px;
      border-left: 4px solid #f59e0b;
    }
    .receipt {
      background: #f9fafb;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
    }
    .receipt-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid #e5e7eb;
    }
    .receipt-row:last-child {
      border-bottom: none;
      font-weight: 600;
    }
  </style>
`;

/**
 * Generate welcome email HTML
 */
export function generateWelcomeEmail(data: WelcomeEmailData): EmailPayload {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      ${emailStyles}
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>💪 Welcome to Calisthenic Commando!</h1>
        </div>
        <div class="content">
          <h2>Hey ${data.userName}! 👋</h2>
          <p>Welcome to your fitness transformation journey! We're thrilled to have you as part of the Commando community.</p>
          
          <p>Here's what you can expect:</p>
          <ul>
            <li>🏋️ <strong>Personalized Workouts</strong> - Tailored to your fitness level</li>
            <li>🥗 <strong>Meal Plans</strong> - Nutrition guidance that fits your goals</li>
            <li>⏰ <strong>Intermittent Fasting</strong> - Smart fasting schedules</li>
            <li>📊 <strong>Progress Tracking</strong> - Watch your transformation unfold</li>
          </ul>

          <div class="highlight">
            <strong>Pro Tip:</strong> Start with the onboarding quiz to get a personalized plan based on your goals and fitness level!
          </div>

          <div style="text-align: center; margin-top: 24px;">
            <a href="calistheniccommando://onboarding" class="button">Start Your Journey</a>
          </div>

          <div class="divider"></div>
          
          <p>Have questions? We're here to help! Reach out anytime at <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a></p>
          
          <p>Let's crush it together! 💪</p>
          <p><strong>The Calisthenic Commando Team</strong></p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} Calisthenic Commando. All rights reserved.</p>
          <p>You're receiving this because you signed up at calistheniccommando.com</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return {
    to: data.userEmail,
    subject: 'Welcome to Calisthenic Commando! 💪',
    html,
    text: `Welcome to Calisthenic Commando, ${data.userName}! Your fitness journey starts now.`,
  };
}

/**
 * Generate payment confirmation email HTML
 */
export function generatePaymentEmail(data: PaymentEmailData): EmailPayload {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      ${emailStyles}
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>✅ Payment Confirmed</h1>
        </div>
        <div class="content">
          <h2>Thank you, ${data.userName}!</h2>
          <p>Your payment has been successfully processed. You now have full access to all premium features!</p>
          
          <div class="receipt">
            <div class="receipt-row">
              <span>Plan</span>
              <span>${data.planName}</span>
            </div>
            <div class="receipt-row">
              <span>Date</span>
              <span>${data.date}</span>
            </div>
            <div class="receipt-row">
              <span>Transaction ID</span>
              <span>${data.transactionId}</span>
            </div>
            <div class="receipt-row">
              <span>Total</span>
              <span>${data.amount}</span>
            </div>
          </div>

          <p><strong>What's included:</strong></p>
          <ul>
            <li>✓ All premium workouts</li>
            <li>✓ Advanced meal plans</li>
            <li>✓ Priority support</li>
            <li>✓ Exclusive content</li>
          </ul>

          <div style="text-align: center; margin-top: 24px;">
            <a href="calistheniccommando://home" class="button">Start Training</a>
          </div>

          <div class="divider"></div>
          
          <p style="font-size: 14px; color: #6b7280;">
            Need help? Contact us at <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a>
          </p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} Calisthenic Commando. All rights reserved.</p>
          <p>This is a receipt for your payment.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return {
    to: data.userEmail,
    subject: `Payment Confirmed - ${data.planName}`,
    html,
    text: `Payment confirmed! Amount: ${data.amount}. Transaction ID: ${data.transactionId}`,
  };
}

/**
 * Generate password reset email HTML
 */
export function generatePasswordResetEmail(data: PasswordResetData): EmailPayload {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      ${emailStyles}
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🔐 Password Reset</h1>
        </div>
        <div class="content">
          <h2>Hi ${data.userName},</h2>
          <p>We received a request to reset your password. Click the button below to create a new password:</p>
          
          <div style="text-align: center; margin: 32px 0;">
            <a href="${data.resetLink}" class="button">Reset Password</a>
          </div>

          <div class="highlight">
            <strong>⚠️ This link expires in ${data.expiresIn}</strong>
            <br>
            If you didn't request this reset, you can safely ignore this email.
          </div>

          <div class="divider"></div>
          
          <p style="font-size: 14px; color: #6b7280;">
            If the button doesn't work, copy and paste this link into your browser:
            <br>
            <a href="${data.resetLink}">${data.resetLink}</a>
          </p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} Calisthenic Commando. All rights reserved.</p>
          <p>If you didn't request this, please contact <a href="mailto:${SUPPORT_EMAIL}">support</a>.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return {
    to: data.userEmail,
    subject: 'Reset Your Password - Calisthenic Commando',
    html,
    text: `Reset your password: ${data.resetLink}. This link expires in ${data.expiresIn}.`,
  };
}

/**
 * Generate weekly summary email HTML
 */
export function generateWeeklySummaryEmail(data: WeeklySummaryData): EmailPayload {
  const completionRate = Math.round((data.workoutsCompleted / data.totalWorkouts) * 100);
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      ${emailStyles}
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📊 Your Week ${data.weekNumber} Summary</h1>
        </div>
        <div class="content">
          <h2>Great work, ${data.userName}! 🎉</h2>
          <p>Here's how you did this week:</p>
          
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-value">${data.workoutsCompleted}/${data.totalWorkouts}</div>
              <div class="stat-label">Workouts</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">${data.fastingCompliance}%</div>
              <div class="stat-label">Fasting Compliance</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">${data.caloriesBurned}</div>
              <div class="stat-label">Calories Burned</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">🔥 ${data.currentStreak}</div>
              <div class="stat-label">Day Streak</div>
            </div>
          </div>

          ${completionRate >= 80 ? `
            <div class="highlight" style="background: #d1fae5; border-color: #10b981;">
              <strong>🏆 Outstanding!</strong> You completed ${completionRate}% of your workouts. Keep up the amazing work!
            </div>
          ` : completionRate >= 50 ? `
            <div class="highlight">
              <strong>💪 Good progress!</strong> You completed ${completionRate}% of your workouts. Push a little harder next week!
            </div>
          ` : `
            <div class="highlight" style="background: #fee2e2; border-color: #ef4444;">
              <strong>📈 Room for improvement!</strong> You completed ${completionRate}% of your workouts. Let's make next week count!
            </div>
          `}

          ${data.topAchievement ? `
            <div style="text-align: center; margin: 24px 0; padding: 20px; background: #fef3c7; border-radius: 8px;">
              <div style="font-size: 32px; margin-bottom: 8px;">🏅</div>
              <div style="font-weight: 600;">Top Achievement</div>
              <div style="color: #92400e;">${data.topAchievement}</div>
            </div>
          ` : ''}

          <div style="text-align: center; margin-top: 24px;">
            <a href="calistheniccommando://profile" class="button">View Full Progress</a>
          </div>

          <div class="divider"></div>
          
          <p>Ready to crush it again this week? Let's go! 💪</p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} Calisthenic Commando. All rights reserved.</p>
          <p><a href="calistheniccommando://settings/notifications">Manage email preferences</a></p>
        </div>
      </div>
    </body>
    </html>
  `;

  return {
    to: data.userEmail,
    subject: `Week ${data.weekNumber} Summary: ${data.workoutsCompleted} workouts, ${data.currentStreak} day streak 🔥`,
    html,
    text: `Week ${data.weekNumber}: ${data.workoutsCompleted}/${data.totalWorkouts} workouts, ${data.fastingCompliance}% fasting, ${data.currentStreak} day streak`,
  };
}

/**
 * Generate milestone celebration email HTML
 */
export function generateMilestoneEmail(data: MilestoneEmailData): EmailPayload {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      ${emailStyles}
    </head>
    <body>
      <div class="container">
        <div class="header" style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);">
          <h1>🏆 Achievement Unlocked!</h1>
        </div>
        <div class="content" style="text-align: center;">
          <div style="font-size: 72px; margin: 24px 0;">🎉</div>
          <h2>Congratulations, ${data.userName}!</h2>
          
          <div style="background: #fef3c7; padding: 24px; border-radius: 12px; margin: 24px 0;">
            <div style="font-size: 24px; font-weight: 700; color: #92400e; margin-bottom: 8px;">
              ${data.milestoneName}
            </div>
            <div style="color: #b45309;">
              ${data.milestoneDescription}
            </div>
          </div>

          <p>You're making incredible progress. Every milestone brings you closer to your goals!</p>

          <div style="margin-top: 24px;">
            <a href="calistheniccommando://profile/achievements" class="button">View All Achievements</a>
          </div>

          <div class="divider"></div>
          
          <p style="color: #6b7280;">Share your achievement and inspire others! 🌟</p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} Calisthenic Commando. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return {
    to: data.userEmail,
    subject: `🏆 Achievement Unlocked: ${data.milestoneName}`,
    html,
    text: `Congratulations! You've earned: ${data.milestoneName} - ${data.milestoneDescription}`,
  };
}

// ==================== SEND EMAIL ====================

/**
 * Send email via Resend API
 * NOTE: In production, this should be handled by a backend service
 */
export async function sendEmail(payload: EmailPayload): Promise<{ success: boolean; id?: string; error?: string }> {
  if (!RESEND_API_KEY) {
    console.warn('[Email] No Resend API key configured');
    return { success: false, error: 'Email service not configured' };
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: payload.to,
        subject: payload.subject,
        html: payload.html,
        text: payload.text,
      }),
    });

    const data = await response.json();

    if (response.ok) {
      console.log('[Email] Sent successfully:', data.id);
      return { success: true, id: data.id };
    } else {
      console.error('[Email] Failed to send:', data);
      return { success: false, error: data.message || 'Failed to send email' };
    }
  } catch (error) {
    console.error('[Email] Error sending:', error);
    return { success: false, error: String(error) };
  }
}

// ==================== CONVENIENCE FUNCTIONS ====================

export async function sendWelcomeEmail(data: WelcomeEmailData) {
  const payload = generateWelcomeEmail(data);
  return sendEmail(payload);
}

export async function sendPaymentConfirmation(data: PaymentEmailData) {
  const payload = generatePaymentEmail(data);
  return sendEmail(payload);
}

export async function sendPasswordReset(data: PasswordResetData) {
  const payload = generatePasswordResetEmail(data);
  return sendEmail(payload);
}

export async function sendWeeklySummary(data: WeeklySummaryData) {
  const payload = generateWeeklySummaryEmail(data);
  return sendEmail(payload);
}

export async function sendMilestoneEmail(data: MilestoneEmailData) {
  const payload = generateMilestoneEmail(data);
  return sendEmail(payload);
}

// ==================== EXPORTS ====================

export const emailService = {
  // Templates
  generateWelcomeEmail,
  generatePaymentEmail,
  generatePasswordResetEmail,
  generateWeeklySummaryEmail,
  generateMilestoneEmail,

  // Send
  sendEmail,
  sendWelcomeEmail,
  sendPaymentConfirmation,
  sendPasswordReset,
  sendWeeklySummary,
  sendMilestoneEmail,
};

export default emailService;
