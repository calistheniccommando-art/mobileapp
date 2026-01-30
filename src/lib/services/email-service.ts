/**
 * EMAIL SERVICE
 *
 * Handles gender-specific confirmation emails for subscription purchases.
 * Templates include personalized content, plan details, and motivational messaging.
 */

import type { SubscriptionPlanId, ConfirmationEmailData } from '@/types/subscription';
import {
  SUBSCRIPTION_PLANS,
  EMAIL_TEMPLATE_MALE,
  EMAIL_TEMPLATE_FEMALE,
} from '@/types/subscription';

// ==================== EMAIL TYPES ====================

export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

// ==================== HTML EMAIL TEMPLATES ====================

function generateMaleEmailHtml(data: ConfirmationEmailData): string {
  const template = EMAIL_TEMPLATE_MALE;
  const accentColor = '#10b981'; // Emerald green for male

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${template.subject}</title>
  <style>
    body { margin: 0; padding: 0; font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #0f172a; color: #ffffff; }
    .container { max-width: 600px; margin: 0 auto; background: linear-gradient(180deg, #0f172a 0%, #1e293b 100%); }
    .header { padding: 40px 30px; text-align: center; background: linear-gradient(135deg, ${accentColor}20 0%, transparent 100%); }
    .logo { font-size: 28px; font-weight: bold; color: ${accentColor}; margin-bottom: 10px; }
    .content { padding: 30px; }
    .greeting { font-size: 24px; font-weight: bold; margin-bottom: 20px; color: ${accentColor}; }
    .intro { font-size: 16px; line-height: 1.6; margin-bottom: 25px; color: #e2e8f0; }
    .plan-card { background: rgba(16, 185, 129, 0.1); border: 1px solid ${accentColor}40; border-radius: 16px; padding: 25px; margin: 25px 0; }
    .plan-name { font-size: 20px; font-weight: bold; color: ${accentColor}; margin-bottom: 10px; }
    .plan-details { color: #94a3b8; font-size: 14px; line-height: 1.8; }
    .plan-row { display: flex; justify-content: space-between; margin: 8px 0; }
    .quote-box { background: #1e293b; border-left: 4px solid ${accentColor}; padding: 20px; margin: 25px 0; font-style: italic; color: #94a3b8; }
    .cta-button { display: block; background: ${accentColor}; color: #000000; text-decoration: none; padding: 16px 40px; border-radius: 12px; font-weight: bold; font-size: 16px; text-align: center; margin: 30px auto; width: fit-content; }
    .features { margin: 25px 0; }
    .feature { display: flex; align-items: center; margin: 12px 0; color: #e2e8f0; }
    .feature-icon { color: ${accentColor}; margin-right: 12px; font-size: 18px; }
    .closing { font-size: 14px; color: #94a3b8; line-height: 1.6; margin-top: 30px; }
    .signature { font-weight: bold; color: ${accentColor}; margin-top: 15px; }
    .footer { padding: 30px; text-align: center; border-top: 1px solid #334155; color: #64748b; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">🦁 CALISTHENIC COMMANDO</div>
      <div style="color: #94a3b8; font-size: 14px;">MISSION BRIEFING</div>
    </div>

    <div class="content">
      <div class="greeting">${template.greeting(data.userName)}</div>

      <div class="intro">${template.intro}</div>

      <div class="plan-card">
        <div class="plan-name">⚔️ ${data.planName}</div>
        <div class="plan-details">
          <div class="plan-row">
            <span>Mission Duration:</span>
            <span style="color: #ffffff; font-weight: bold;">${data.planDuration}</span>
          </div>
          <div class="plan-row">
            <span>Investment:</span>
            <span style="color: ${accentColor}; font-weight: bold;">₦${data.planPrice.toLocaleString()}</span>
          </div>
          <div class="plan-row">
            <span>Deployment Date:</span>
            <span style="color: #ffffff;">${data.startDate}</span>
          </div>
          <div class="plan-row">
            <span>Mission End:</span>
            <span style="color: #ffffff;">${data.endDate}</span>
          </div>
          ${data.includesBook ? `
          <div class="plan-row">
            <span>📘 Physical Guidebook:</span>
            <span style="color: ${accentColor};">Included</span>
          </div>
          ` : ''}
          ${data.includesTrainer ? `
          <div class="plan-row">
            <span>🎖️ Trainer Check-ins:</span>
            <span style="color: ${accentColor};">Monthly</span>
          </div>
          ` : ''}
        </div>
      </div>

      <div class="quote-box">
        "${template.motivationalQuote}"
      </div>

      <div class="features">
        <div style="font-weight: bold; margin-bottom: 15px; color: #ffffff;">YOUR ARSENAL INCLUDES:</div>
        <div class="feature">
          <span class="feature-icon">💪</span>
          <span>Military-Grade Bodyweight Workouts</span>
        </div>
        <div class="feature">
          <span class="feature-icon">🍖</span>
          <span>Tactical Nigerian Nutrition Plans</span>
        </div>
        <div class="feature">
          <span class="feature-icon">⏱️</span>
          <span>Strategic Fasting Protocols</span>
        </div>
        <div class="feature">
          <span class="feature-icon">📊</span>
          <span>Battle-Ready Progress Tracking</span>
        </div>
      </div>

      <a href="${data.appLink}" class="cta-button">${template.ctaText}</a>

      <div class="closing">
        ${template.closingMessage}
        <div class="signature">${template.signature}</div>
      </div>
    </div>

    <div class="footer">
      <p>This email was sent because you subscribed to Calisthenic Commando.</p>
      <p>© ${new Date().getFullYear()} Calisthenic Commando. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

function generateFemaleEmailHtml(data: ConfirmationEmailData): string {
  const template = EMAIL_TEMPLATE_FEMALE;
  const accentColor = '#ec4899'; // Pink for female

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${template.subject}</title>
  <style>
    body { margin: 0; padding: 0; font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #0f172a; color: #ffffff; }
    .container { max-width: 600px; margin: 0 auto; background: linear-gradient(180deg, #1e1b2e 0%, #2d2640 100%); }
    .header { padding: 40px 30px; text-align: center; background: linear-gradient(135deg, ${accentColor}20 0%, transparent 100%); }
    .logo { font-size: 28px; font-weight: bold; color: ${accentColor}; margin-bottom: 10px; }
    .content { padding: 30px; }
    .greeting { font-size: 24px; font-weight: bold; margin-bottom: 20px; color: ${accentColor}; }
    .intro { font-size: 16px; line-height: 1.6; margin-bottom: 25px; color: #e2e8f0; }
    .plan-card { background: rgba(236, 72, 153, 0.1); border: 1px solid ${accentColor}40; border-radius: 16px; padding: 25px; margin: 25px 0; }
    .plan-name { font-size: 20px; font-weight: bold; color: ${accentColor}; margin-bottom: 10px; }
    .plan-details { color: #94a3b8; font-size: 14px; line-height: 1.8; }
    .plan-row { display: flex; justify-content: space-between; margin: 8px 0; }
    .quote-box { background: #2d2640; border-left: 4px solid ${accentColor}; padding: 20px; margin: 25px 0; font-style: italic; color: #c4b5d0; }
    .cta-button { display: block; background: ${accentColor}; color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 12px; font-weight: bold; font-size: 16px; text-align: center; margin: 30px auto; width: fit-content; }
    .features { margin: 25px 0; }
    .feature { display: flex; align-items: center; margin: 12px 0; color: #e2e8f0; }
    .feature-icon { color: ${accentColor}; margin-right: 12px; font-size: 18px; }
    .closing { font-size: 14px; color: #c4b5d0; line-height: 1.6; margin-top: 30px; }
    .signature { font-weight: bold; color: ${accentColor}; margin-top: 15px; }
    .footer { padding: 30px; text-align: center; border-top: 1px solid #3d3650; color: #8b7fa3; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">✨ CALISTHENIC COMMANDO</div>
      <div style="color: #c4b5d0; font-size: 14px;">YOUR WELLNESS JOURNEY</div>
    </div>

    <div class="content">
      <div class="greeting">${template.greeting(data.userName)}</div>

      <div class="intro">${template.intro}</div>

      <div class="plan-card">
        <div class="plan-name">💫 ${data.planName}</div>
        <div class="plan-details">
          <div class="plan-row">
            <span>Journey Duration:</span>
            <span style="color: #ffffff; font-weight: bold;">${data.planDuration}</span>
          </div>
          <div class="plan-row">
            <span>Investment in You:</span>
            <span style="color: ${accentColor}; font-weight: bold;">₦${data.planPrice.toLocaleString()}</span>
          </div>
          <div class="plan-row">
            <span>Start Date:</span>
            <span style="color: #ffffff;">${data.startDate}</span>
          </div>
          <div class="plan-row">
            <span>Renewal Date:</span>
            <span style="color: #ffffff;">${data.endDate}</span>
          </div>
          ${data.includesBook ? `
          <div class="plan-row">
            <span>📖 Wellness Guidebook:</span>
            <span style="color: ${accentColor};">Included</span>
          </div>
          ` : ''}
          ${data.includesTrainer ? `
          <div class="plan-row">
            <span>👩‍🏫 Personal Coach:</span>
            <span style="color: ${accentColor};">Monthly Check-ins</span>
          </div>
          ` : ''}
        </div>
      </div>

      <div class="quote-box">
        "${template.motivationalQuote}"
      </div>

      <div class="features">
        <div style="font-weight: bold; margin-bottom: 15px; color: #ffffff;">YOUR WELLNESS TOOLKIT:</div>
        <div class="feature">
          <span class="feature-icon">🌸</span>
          <span>Sculpting & Toning Workouts</span>
        </div>
        <div class="feature">
          <span class="feature-icon">🥗</span>
          <span>Nourishing Nigerian Meal Plans</span>
        </div>
        <div class="feature">
          <span class="feature-icon">🌙</span>
          <span>Gentle Wellness Fasting</span>
        </div>
        <div class="feature">
          <span class="feature-icon">📈</span>
          <span>Progress Celebration Tracking</span>
        </div>
      </div>

      <a href="${data.appLink}" class="cta-button">${template.ctaText}</a>

      <div class="closing">
        ${template.closingMessage}
        <div class="signature">${template.signature}</div>
      </div>
    </div>

    <div class="footer">
      <p>This email was sent because you subscribed to Calisthenic Commando.</p>
      <p>© ${new Date().getFullYear()} Calisthenic Commando. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

// ==================== PLAIN TEXT EMAIL TEMPLATES ====================

function generateMaleEmailText(data: ConfirmationEmailData): string {
  const template = EMAIL_TEMPLATE_MALE;

  return `
CALISTHENIC COMMANDO - MISSION BRIEFING
========================================

${template.greeting(data.userName)}

${template.intro}

YOUR PLAN DETAILS
-----------------
Plan: ${data.planName}
Duration: ${data.planDuration}
Investment: ₦${data.planPrice.toLocaleString()}
Deployment Date: ${data.startDate}
Mission End: ${data.endDate}
${data.includesBook ? 'Physical Guidebook: Included' : ''}
${data.includesTrainer ? 'Trainer Check-ins: Monthly' : ''}

"${template.motivationalQuote}"

YOUR ARSENAL INCLUDES:
- Military-Grade Bodyweight Workouts
- Tactical Nigerian Nutrition Plans
- Strategic Fasting Protocols
- Battle-Ready Progress Tracking

${template.ctaText}: ${data.appLink}

${template.closingMessage}

${template.signature}

---
This email was sent because you subscribed to Calisthenic Commando.
© ${new Date().getFullYear()} Calisthenic Commando. All rights reserved.
  `.trim();
}

function generateFemaleEmailText(data: ConfirmationEmailData): string {
  const template = EMAIL_TEMPLATE_FEMALE;

  return `
CALISTHENIC COMMANDO - YOUR WELLNESS JOURNEY
=============================================

${template.greeting(data.userName)}

${template.intro}

YOUR PLAN DETAILS
-----------------
Plan: ${data.planName}
Duration: ${data.planDuration}
Investment: ₦${data.planPrice.toLocaleString()}
Start Date: ${data.startDate}
Renewal Date: ${data.endDate}
${data.includesBook ? 'Wellness Guidebook: Included' : ''}
${data.includesTrainer ? 'Personal Coach: Monthly Check-ins' : ''}

"${template.motivationalQuote}"

YOUR WELLNESS TOOLKIT:
- Sculpting & Toning Workouts
- Nourishing Nigerian Meal Plans
- Gentle Wellness Fasting
- Progress Celebration Tracking

${template.ctaText}: ${data.appLink}

${template.closingMessage}

${template.signature}

---
This email was sent because you subscribed to Calisthenic Commando.
© ${new Date().getFullYear()} Calisthenic Commando. All rights reserved.
  `.trim();
}

// ==================== EMAIL SERVICE ====================

export class EmailService {
  private apiEndpoint: string | null = null;

  constructor(apiEndpoint?: string) {
    this.apiEndpoint = apiEndpoint ?? null;
  }

  /**
   * Generate confirmation email for a subscription purchase
   */
  generateConfirmationEmail(data: ConfirmationEmailData): EmailPayload {
    const template = data.gender === 'male' ? EMAIL_TEMPLATE_MALE : EMAIL_TEMPLATE_FEMALE;

    const html =
      data.gender === 'male'
        ? generateMaleEmailHtml(data)
        : generateFemaleEmailHtml(data);

    const text =
      data.gender === 'male'
        ? generateMaleEmailText(data)
        : generateFemaleEmailText(data);

    return {
      to: data.userEmail,
      subject: template.subject,
      html,
      text,
    };
  }

  /**
   * Send email (requires backend integration)
   * This method prepares the payload but actual sending requires a backend service
   */
  async sendEmail(payload: EmailPayload): Promise<EmailResult> {
    // If no API endpoint configured, log the email for development
    if (!this.apiEndpoint) {
      console.log('=== EMAIL WOULD BE SENT ===');
      console.log('To:', payload.to);
      console.log('Subject:', payload.subject);
      console.log('Preview:', payload.text.substring(0, 200) + '...');
      console.log('===========================');

      return {
        success: true,
        messageId: `mock_${Date.now()}`,
      };
    }

    try {
      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.text();
        return {
          success: false,
          error: `Email send failed: ${error}`,
        };
      }

      const result = await response.json();
      return {
        success: true,
        messageId: result.messageId,
      };
    } catch (error) {
      return {
        success: false,
        error: `Email send error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Send subscription confirmation email
   */
  async sendConfirmationEmail(data: ConfirmationEmailData): Promise<EmailResult> {
    const payload = this.generateConfirmationEmail(data);
    return this.sendEmail(payload);
  }
}

// ==================== HELPER FUNCTIONS ====================

export function buildConfirmationEmailData(
  userName: string,
  userEmail: string,
  gender: 'male' | 'female',
  planId: SubscriptionPlanId,
  startDate: Date,
  appLink: string = 'https://calistheniccommando.app'
): ConfirmationEmailData {
  const plan = SUBSCRIPTION_PLANS[planId];
  const endDate = new Date(startDate);
  endDate.setMonth(endDate.getMonth() + plan.durationMonths);

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-NG', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getDurationString = (months: number): string => {
    if (months === 1) return '1 Month';
    if (months === 12) return '1 Year';
    return `${months} Months`;
  };

  return {
    userName,
    userEmail,
    gender,
    planName: plan.name,
    planPrice: plan.priceNaira,
    planDuration: getDurationString(plan.durationMonths),
    startDate: formatDate(startDate),
    endDate: formatDate(endDate),
    includesBook: plan.includesPhysicalBook,
    includesTrainer: plan.includesTrainerCheckin,
    dailyWorkoutPreview: '',
    appLink,
  };
}

// ==================== SINGLETON INSTANCE ====================

export const emailService = new EmailService();
