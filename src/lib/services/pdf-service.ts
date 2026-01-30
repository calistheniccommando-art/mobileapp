/**
 * PDF SERVICE
 *
 * Comprehensive PDF generation service for daily and weekly plans.
 * Integrates with Daily Plan Engine and supports admin template management.
 */

import { format, addDays } from 'date-fns';
import type {
  EnrichedDailyPlan,
  ScheduledMeal,
  EnrichedWorkout,
  PDFExportData,
} from './daily-plan-engine';
import type { FastingPlan, MealType, DifficultyLevel, MealIntensity } from '@/types/fitness';

// ==================== TYPES ====================

/** PDF template definition */
export interface PDFTemplate {
  id: string;
  name: string;
  description: string;
  type: 'daily' | 'weekly';
  isDefault: boolean;

  // Page settings
  pageSize: 'letter' | 'a4';
  orientation: 'portrait' | 'landscape';

  // Theme
  theme: PDFTheme;

  // Sections to include
  sections: PDFSections;

  // Branding
  branding: PDFBranding;

  // Custom content
  customContent?: PDFCustomContent;
}

/** Theme configuration */
export interface PDFTheme {
  mode: 'light' | 'dark';
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
  mutedColor: string;
  successColor: string;
  warningColor: string;
  errorColor: string;

  // Fonts
  fontFamily: string;
  headingFontFamily?: string;
}

/** Section visibility configuration */
export interface PDFSections {
  header: boolean;
  fasting: boolean;
  workout: boolean;
  meals: boolean;
  nutrition: boolean;
  notes: boolean;
  footer: boolean;
}

/** Branding configuration */
export interface PDFBranding {
  appName: string;
  logoUrl?: string;
  tagline?: string;
  showBranding: boolean;
}

/** Custom content placeholders */
export interface PDFCustomContent {
  motivationalMessage?: string;
  adminNotes?: string;
  disclaimer?: string;
}

/** PDF generation options */
export interface PDFGenerationOptions {
  template?: PDFTemplate;
  includeWorkout?: boolean;
  includeMeals?: boolean;
  includeFasting?: boolean;
  includeNutrition?: boolean;
  userInfo?: {
    firstName?: string;
    lastName?: string;
    workoutDifficulty?: DifficultyLevel;
    mealIntensity?: MealIntensity;
  };
}

/** Weekly PDF data */
export interface WeeklyPDFData {
  startDate: Date;
  endDate: Date;
  plans: EnrichedDailyPlan[];
  summary: {
    totalWorkouts: number;
    totalRestDays: number;
    totalCalories: number;
    totalProtein: number;
    avgDailyCalories: number;
    workoutsByDifficulty: Record<DifficultyLevel, number>;
  };
}

// ==================== DEFAULT TEMPLATES ====================

/** Dark theme (default) */
export const DARK_THEME: PDFTheme = {
  mode: 'dark',
  primaryColor: '#10b981', // Emerald
  secondaryColor: '#8b5cf6', // Violet
  accentColor: '#06b6d4', // Cyan
  backgroundColor: '#0f172a', // Slate 900
  textColor: '#ffffff',
  mutedColor: '#94a3b8', // Slate 400
  successColor: '#10b981',
  warningColor: '#f59e0b',
  errorColor: '#ef4444',
  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
};

/** Light theme */
export const LIGHT_THEME: PDFTheme = {
  mode: 'light',
  primaryColor: '#059669', // Emerald 600
  secondaryColor: '#7c3aed', // Violet 600
  accentColor: '#0891b2', // Cyan 600
  backgroundColor: '#ffffff',
  textColor: '#1e293b', // Slate 800
  mutedColor: '#64748b', // Slate 500
  successColor: '#059669',
  warningColor: '#d97706',
  errorColor: '#dc2626',
  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
};

/** Default branding */
export const DEFAULT_BRANDING: PDFBranding = {
  appName: 'FitLife',
  tagline: 'Your Personal Fitness Journey',
  showBranding: true,
};

/** Default sections */
export const DEFAULT_SECTIONS: PDFSections = {
  header: true,
  fasting: true,
  workout: true,
  meals: true,
  nutrition: true,
  notes: true,
  footer: true,
};

/** Default daily template */
export const DEFAULT_DAILY_TEMPLATE: PDFTemplate = {
  id: 'default-daily',
  name: 'Default Daily Plan',
  description: 'Professional dark-themed daily plan template',
  type: 'daily',
  isDefault: true,
  pageSize: 'letter',
  orientation: 'portrait',
  theme: DARK_THEME,
  sections: DEFAULT_SECTIONS,
  branding: DEFAULT_BRANDING,
};

/** Default weekly template */
export const DEFAULT_WEEKLY_TEMPLATE: PDFTemplate = {
  id: 'default-weekly',
  name: 'Default Weekly Plan',
  description: 'Professional dark-themed weekly plan template',
  type: 'weekly',
  isDefault: true,
  pageSize: 'letter',
  orientation: 'portrait',
  theme: DARK_THEME,
  sections: DEFAULT_SECTIONS,
  branding: DEFAULT_BRANDING,
};

// ==================== CSS GENERATOR ====================

function generateBaseCSS(theme: PDFTheme): string {
  return `
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: ${theme.fontFamily};
      background: ${theme.backgroundColor};
      color: ${theme.textColor};
      padding: 40px;
      line-height: 1.5;
    }

    .page-break {
      page-break-after: always;
    }

    .header {
      text-align: center;
      margin-bottom: 32px;
      padding-bottom: 20px;
      border-bottom: 2px solid ${theme.mode === 'dark' ? '#334155' : '#e2e8f0'};
    }

    .header h1 {
      font-size: 28px;
      color: ${theme.primaryColor};
      margin-bottom: 8px;
      font-weight: 700;
    }

    .header .date {
      font-size: 16px;
      color: ${theme.mutedColor};
    }

    .header .tagline {
      font-size: 14px;
      color: ${theme.mutedColor};
      margin-top: 4px;
    }

    .section {
      margin-bottom: 24px;
      background: ${theme.mode === 'dark' ? '#1e293b' : '#f8fafc'};
      border-radius: 16px;
      padding: 20px;
      border: 1px solid ${theme.mode === 'dark' ? '#334155' : '#e2e8f0'};
    }

    .section-title {
      font-size: 18px;
      font-weight: 600;
      margin-bottom: 16px;
      color: ${theme.textColor};
      display: flex;
      align-items: center;
    }

    .section-title::before {
      content: '';
      width: 4px;
      height: 20px;
      background: ${theme.primaryColor};
      border-radius: 2px;
      margin-right: 12px;
    }

    .card {
      padding: 16px;
      background: ${theme.backgroundColor};
      border-radius: 12px;
      margin-bottom: 12px;
      border: 1px solid ${theme.mode === 'dark' ? '#334155' : '#e2e8f0'};
    }

    .card:last-child {
      margin-bottom: 0;
    }

    .card-title {
      font-size: 16px;
      font-weight: 600;
      color: ${theme.textColor};
      margin-bottom: 4px;
    }

    .card-subtitle {
      font-size: 14px;
      color: ${theme.mutedColor};
    }

    .stats-row {
      display: flex;
      gap: 16px;
      margin-top: 12px;
      flex-wrap: wrap;
    }

    .stat {
      font-size: 13px;
      color: ${theme.primaryColor};
      font-weight: 500;
    }

    .badge {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
    }

    .badge-primary {
      background: ${theme.primaryColor}20;
      color: ${theme.primaryColor};
    }

    .badge-secondary {
      background: ${theme.secondaryColor}20;
      color: ${theme.secondaryColor};
    }

    .badge-accent {
      background: ${theme.accentColor}20;
      color: ${theme.accentColor};
    }

    .badge-success {
      background: ${theme.successColor}20;
      color: ${theme.successColor};
    }

    .badge-warning {
      background: ${theme.warningColor}20;
      color: ${theme.warningColor};
    }

    .nutrition-grid {
      display: flex;
      justify-content: space-between;
      margin: 16px 0;
    }

    .nutrition-item {
      text-align: center;
      flex: 1;
    }

    .nutrition-value {
      font-size: 22px;
      font-weight: 700;
    }

    .nutrition-label {
      font-size: 11px;
      color: ${theme.mutedColor};
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .exercise-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px;
      background: ${theme.backgroundColor};
      border-radius: 10px;
      margin-bottom: 8px;
    }

    .exercise-number {
      width: 28px;
      height: 28px;
      background: ${theme.primaryColor};
      color: white;
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: 600;
      flex-shrink: 0;
    }

    .exercise-info {
      flex: 1;
    }

    .exercise-name {
      font-size: 14px;
      font-weight: 600;
      color: ${theme.textColor};
    }

    .exercise-details {
      font-size: 12px;
      color: ${theme.mutedColor};
    }

    .meal-item {
      padding: 16px;
      background: ${theme.backgroundColor};
      border-radius: 12px;
      margin-bottom: 12px;
      border: 1px solid ${theme.mode === 'dark' ? '#334155' : '#e2e8f0'};
    }

    .meal-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;
    }

    .meal-time {
      font-size: 12px;
      font-weight: 600;
    }

    .meal-time-in-window {
      background: ${theme.successColor}20;
      color: ${theme.successColor};
      padding: 4px 10px;
      border-radius: 10px;
    }

    .meal-time-outside-window {
      background: ${theme.errorColor}20;
      color: ${theme.errorColor};
      padding: 4px 10px;
      border-radius: 10px;
    }

    .fasting-display {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .fasting-plan {
      font-size: 32px;
      font-weight: 700;
      color: ${theme.secondaryColor};
    }

    .fasting-window {
      text-align: right;
    }

    .fasting-window-label {
      font-size: 14px;
      color: ${theme.textColor};
    }

    .fasting-window-time {
      font-size: 18px;
      font-weight: 600;
      color: ${theme.primaryColor};
    }

    .footer {
      text-align: center;
      margin-top: 32px;
      padding-top: 20px;
      border-top: 1px solid ${theme.mode === 'dark' ? '#334155' : '#e2e8f0'};
      color: ${theme.mutedColor};
      font-size: 11px;
    }

    .rest-day-card {
      text-align: center;
      padding: 32px;
    }

    .rest-day-icon {
      font-size: 48px;
      margin-bottom: 12px;
    }

    .rest-day-title {
      font-size: 20px;
      font-weight: 600;
      color: ${theme.secondaryColor};
      margin-bottom: 8px;
    }

    .rest-day-message {
      color: ${theme.mutedColor};
      font-size: 14px;
    }

    .weekly-day-header {
      background: ${theme.primaryColor}15;
      padding: 12px 16px;
      border-radius: 10px;
      margin-bottom: 16px;
    }

    .weekly-day-title {
      font-size: 16px;
      font-weight: 600;
      color: ${theme.primaryColor};
    }

    .weekly-summary {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
      margin-bottom: 24px;
    }

    .summary-card {
      background: ${theme.mode === 'dark' ? '#1e293b' : '#f8fafc'};
      border-radius: 12px;
      padding: 20px;
      text-align: center;
    }

    .summary-value {
      font-size: 28px;
      font-weight: 700;
      color: ${theme.primaryColor};
    }

    .summary-label {
      font-size: 12px;
      color: ${theme.mutedColor};
      text-transform: uppercase;
    }

    .motivational-quote {
      background: linear-gradient(135deg, ${theme.primaryColor}20, ${theme.secondaryColor}20);
      padding: 20px;
      border-radius: 12px;
      text-align: center;
      margin: 20px 0;
      font-style: italic;
      color: ${theme.textColor};
    }
  `;
}

// ==================== HTML GENERATORS ====================

/** Generate header section */
function generateHeader(
  template: PDFTemplate,
  date: Date,
  isWeekly: boolean = false,
  endDate?: Date
): string {
  if (!template.sections.header) return '';

  const dateStr = isWeekly && endDate
    ? `${format(date, 'MMMM d')} - ${format(endDate, 'MMMM d, yyyy')}`
    : format(date, 'EEEE, MMMM d, yyyy');

  return `
    <div class="header">
      <h1>${template.branding.appName} ${isWeekly ? 'Weekly' : 'Daily'} Plan</h1>
      <p class="date">${dateStr}</p>
      ${template.branding.tagline && template.branding.showBranding
        ? `<p class="tagline">${template.branding.tagline}</p>`
        : ''}
    </div>
  `;
}

/** Generate fasting section */
function generateFastingSection(
  template: PDFTemplate,
  fastingPlan: string,
  eatingWindow: { start: string; end: string; fastingHours: number; eatingHours: number }
): string {
  if (!template.sections.fasting) return '';

  return `
    <div class="section">
      <div class="section-title">Intermittent Fasting</div>
      <div class="fasting-display">
        <div>
          <div class="fasting-plan">${fastingPlan}</div>
          <p style="color: ${template.theme.mutedColor}; margin-top: 8px;">
            ${eatingWindow.fastingHours} hours fasting · ${eatingWindow.eatingHours} hours eating
          </p>
        </div>
        <div class="fasting-window">
          <p class="fasting-window-label">Eating Window</p>
          <p class="fasting-window-time">${eatingWindow.start} - ${eatingWindow.end}</p>
        </div>
      </div>
    </div>
  `;
}

/** Generate workout section */
function generateWorkoutSection(
  template: PDFTemplate,
  workout: EnrichedWorkout | null,
  isRestDay: boolean
): string {
  if (!template.sections.workout) return '';

  if (isRestDay || !workout) {
    return `
      <div class="section">
        <div class="section-title">Today's Workout</div>
        <div class="card rest-day-card">
          <div class="rest-day-icon">🧘</div>
          <div class="rest-day-title">Rest Day</div>
          <div class="rest-day-message">Take time to recover. Light stretching or a walk is encouraged!</div>
        </div>
      </div>
    `;
  }

  const exercisesHtml = workout.exerciseDetails
    .map(
      (ex, i) => `
      <div class="exercise-item">
        <div class="exercise-number">${i + 1}</div>
        <div class="exercise-info">
          <div class="exercise-name">${ex.name}</div>
          <div class="exercise-details">
            ${ex.sets ? `${ex.sets} sets` : ''}
            ${ex.reps ? ` × ${ex.reps} reps` : ''}
            ${ex.duration ? ` · ${ex.duration}s` : ''}
            ${ex.restTime ? ` · ${ex.restTime}s rest` : ''}
          </div>
        </div>
      </div>
    `
    )
    .join('');

  return `
    <div class="section">
      <div class="section-title">Today's Workout</div>
      <div class="card">
        <div class="card-title">${workout.name}</div>
        <div class="card-subtitle">${workout.description || ''}</div>
        <div class="stats-row">
          <span class="stat">${workout.completionEstimate.totalMinutes} min</span>
          <span class="stat">${workout.completionEstimate.totalCalories} cal</span>
          <span class="stat">${workout.exerciseDetails.length} exercises</span>
          <span class="badge badge-primary">${workout.difficulty}</span>
        </div>
      </div>
      ${exercisesHtml}
    </div>
  `;
}

/** Generate meals section */
function generateMealsSection(
  template: PDFTemplate,
  meals: ScheduledMeal[],
  totalNutrition: { calories: number; protein: number; carbs: number; fat: number },
  eatingWindow?: { start: string; end: string }
): string {
  if (!template.sections.meals) return '';

  const mealsHtml = meals
    .map(
      (meal) => `
      <div class="meal-item">
        <div class="meal-header">
          <span class="badge badge-accent">${meal.type}</span>
          ${meal.scheduledTime
            ? `<span class="meal-time ${meal.isWithinWindow ? 'meal-time-in-window' : 'meal-time-outside-window'}">${meal.scheduledTime}</span>`
            : ''}
        </div>
        <div class="card-title">${meal.name}</div>
        <div class="card-subtitle">
          ${meal.nutrition.calories} cal · ${meal.nutrition.protein}g protein ·
          ${meal.nutrition.carbs}g carbs · ${meal.nutrition.fat}g fat
        </div>
        ${meal.prepTime || meal.cookTime
          ? `<div style="margin-top: 8px; font-size: 12px; color: ${template.theme.mutedColor};">
              ${meal.prepTime ? `Prep: ${meal.prepTime}min` : ''}
              ${meal.prepTime && meal.cookTime ? '·' : ''}
              ${meal.cookTime ? `Cook: ${meal.cookTime}min` : ''}
            </div>`
          : ''}
      </div>
    `
    )
    .join('');

  const nutritionHtml = template.sections.nutrition
    ? `
      <div class="nutrition-grid">
        <div class="nutrition-item">
          <div class="nutrition-value" style="color: ${template.theme.textColor};">${totalNutrition.calories}</div>
          <div class="nutrition-label">Calories</div>
        </div>
        <div class="nutrition-item">
          <div class="nutrition-value" style="color: ${template.theme.accentColor};">${totalNutrition.protein}g</div>
          <div class="nutrition-label">Protein</div>
        </div>
        <div class="nutrition-item">
          <div class="nutrition-value" style="color: ${template.theme.warningColor};">${totalNutrition.carbs}g</div>
          <div class="nutrition-label">Carbs</div>
        </div>
        <div class="nutrition-item">
          <div class="nutrition-value" style="color: ${template.theme.errorColor};">${totalNutrition.fat}g</div>
          <div class="nutrition-label">Fat</div>
        </div>
      </div>
    `
    : '';

  return `
    <div class="section">
      <div class="section-title">Meal Schedule</div>
      ${eatingWindow
        ? `<div class="card" style="background: ${template.theme.primaryColor}10; border: none;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="color: ${template.theme.primaryColor}; font-weight: 600;">Eating Window</span>
              <span style="font-size: 16px; font-weight: 700;">${eatingWindow.start} - ${eatingWindow.end}</span>
            </div>
          </div>`
        : ''}
      ${nutritionHtml}
      ${mealsHtml}
    </div>
  `;
}

/** Generate footer section */
function generateFooter(template: PDFTemplate, date: Date): string {
  if (!template.sections.footer) return '';

  return `
    <div class="footer">
      ${template.branding.showBranding ? `Generated by ${template.branding.appName}` : 'Your Fitness Plan'} · ${format(date, 'MMMM d, yyyy')}
      ${template.customContent?.disclaimer ? `<p style="margin-top: 8px;">${template.customContent.disclaimer}</p>` : ''}
    </div>
  `;
}

/** Generate motivational message */
function generateMotivationalMessage(template: PDFTemplate): string {
  if (!template.customContent?.motivationalMessage) return '';

  return `
    <div class="motivational-quote">
      "${template.customContent.motivationalMessage}"
    </div>
  `;
}

// ==================== PDF SERVICE ====================

export const PDFService = {
  /**
   * Generate HTML for a daily plan PDF
   */
  generateDailyHTML(
    plan: EnrichedDailyPlan,
    options: PDFGenerationOptions = {}
  ): string {
    const template = options.template ?? DEFAULT_DAILY_TEMPLATE;
    const theme = template.theme;

    const includeWorkout = options.includeWorkout ?? template.sections.workout;
    const includeMeals = options.includeMeals ?? template.sections.meals;
    const includeFasting = options.includeFasting ?? template.sections.fasting;

    // Extract fasting window info - plan.fasting is DailyFastingStatus which has window directly
    const fastingWindow = plan.fasting.window;
    const eatingWindow = {
      start: fastingWindow.eatingStartTime,
      end: fastingWindow.eatingEndTime,
      fastingHours: fastingWindow.fastingHours,
      eatingHours: fastingWindow.eatingHours,
    };

    const planDate = new Date(plan.date);

    let html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>${generateBaseCSS(theme)}</style>
      </head>
      <body>
        ${generateHeader(template, planDate)}
        ${generateMotivationalMessage(template)}
    `;

    if (includeFasting) {
      html += generateFastingSection(template, fastingWindow.plan, eatingWindow);
    }

    if (includeWorkout) {
      html += generateWorkoutSection(template, plan.workout, plan.isRestDay);
    }

    if (includeMeals) {
      html += generateMealsSection(
        template,
        plan.meals.scheduled,
        plan.meals.totalNutrition,
        { start: eatingWindow.start, end: eatingWindow.end }
      );
    }

    html += `
        ${generateFooter(template, planDate)}
      </body>
      </html>
    `;

    return html;
  },

  /**
   * Generate HTML for a weekly plan PDF
   */
  generateWeeklyHTML(
    weekData: WeeklyPDFData,
    options: PDFGenerationOptions = {}
  ): string {
    const template = options.template ?? DEFAULT_WEEKLY_TEMPLATE;
    const theme = template.theme;

    let html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>${generateBaseCSS(theme)}</style>
      </head>
      <body>
        ${generateHeader(template, weekData.startDate, true, weekData.endDate)}
        ${generateMotivationalMessage(template)}

        <!-- Weekly Summary -->
        <div class="weekly-summary">
          <div class="summary-card">
            <div class="summary-value">${weekData.summary.totalWorkouts}</div>
            <div class="summary-label">Workouts</div>
          </div>
          <div class="summary-card">
            <div class="summary-value">${weekData.summary.totalRestDays}</div>
            <div class="summary-label">Rest Days</div>
          </div>
          <div class="summary-card">
            <div class="summary-value">${Math.round(weekData.summary.avgDailyCalories)}</div>
            <div class="summary-label">Avg. Calories</div>
          </div>
        </div>
    `;

    // Generate each day
    weekData.plans.forEach((plan, index) => {
      const dayDate = addDays(weekData.startDate, index);
      const dayName = format(dayDate, 'EEEE');
      const shortDate = format(dayDate, 'MMM d');

      html += `
        <div class="section">
          <div class="weekly-day-header">
            <span class="weekly-day-title">${dayName}, ${shortDate}</span>
          </div>
      `;

      // Compact workout info
      if (plan.isRestDay || !plan.workout) {
        html += `
          <div class="card" style="text-align: center; padding: 16px;">
            <span style="color: ${theme.secondaryColor}; font-weight: 600;">🧘 Rest Day</span>
          </div>
        `;
      } else {
        html += `
          <div class="card">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <div>
                <div class="card-title">${plan.workout.name}</div>
                <div class="card-subtitle">${plan.workout.exerciseDetails.length} exercises · ${plan.workout.completionEstimate.totalMinutes} min</div>
              </div>
              <span class="badge badge-primary">${plan.workout.difficulty}</span>
            </div>
          </div>
        `;
      }

      // Compact meals summary
      const mealTypes = plan.meals.scheduled.map((m) => m.type).join(', ');
      html += `
        <div class="card">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div>
              <div class="card-title">${plan.meals.scheduled.length} Meals</div>
              <div class="card-subtitle">${mealTypes}</div>
            </div>
            <div style="text-align: right;">
              <div style="font-weight: 600; color: ${theme.primaryColor};">${plan.meals.totalNutrition.calories} cal</div>
              <div style="font-size: 12px; color: ${theme.mutedColor};">${plan.meals.totalNutrition.protein}g protein</div>
            </div>
          </div>
        </div>
      `;

      html += '</div>';

      // Add page break after every 2 days (except last)
      if (index % 2 === 1 && index < weekData.plans.length - 1) {
        html += '<div class="page-break"></div>';
      }
    });

    html += `
        ${generateFooter(template, weekData.startDate)}
      </body>
      </html>
    `;

    return html;
  },

  /**
   * Get default template by type
   */
  getDefaultTemplate(type: 'daily' | 'weekly'): PDFTemplate {
    return type === 'weekly' ? DEFAULT_WEEKLY_TEMPLATE : DEFAULT_DAILY_TEMPLATE;
  },

  /**
   * Create a custom template from a base template
   */
  createCustomTemplate(
    base: PDFTemplate,
    customizations: Partial<PDFTemplate>
  ): PDFTemplate {
    return {
      ...base,
      ...customizations,
      id: customizations.id ?? `custom-${Date.now()}`,
      isDefault: false,
      theme: {
        ...base.theme,
        ...(customizations.theme ?? {}),
      },
      sections: {
        ...base.sections,
        ...(customizations.sections ?? {}),
      },
      branding: {
        ...base.branding,
        ...(customizations.branding ?? {}),
      },
    };
  },

  /**
   * Create template with light theme
   */
  createLightTemplate(type: 'daily' | 'weekly'): PDFTemplate {
    const base = type === 'weekly' ? DEFAULT_WEEKLY_TEMPLATE : DEFAULT_DAILY_TEMPLATE;
    return this.createCustomTemplate(base, {
      id: `${type}-light`,
      name: `Light ${type === 'weekly' ? 'Weekly' : 'Daily'} Plan`,
      theme: LIGHT_THEME,
    });
  },

  /**
   * Generate weekly data from daily plans
   */
  generateWeeklyData(plans: EnrichedDailyPlan[]): WeeklyPDFData {
    const sortedPlans = [...plans].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    const startDate = sortedPlans[0]?.date ?? new Date();
    const endDate = sortedPlans[sortedPlans.length - 1]?.date ?? new Date();

    const totalWorkouts = sortedPlans.filter((p) => !p.isRestDay && p.workout).length;
    const totalRestDays = sortedPlans.filter((p) => p.isRestDay).length;
    const totalCalories = sortedPlans.reduce(
      (sum, p) => sum + p.meals.totalNutrition.calories,
      0
    );
    const totalProtein = sortedPlans.reduce(
      (sum, p) => sum + p.meals.totalNutrition.protein,
      0
    );

    const workoutsByDifficulty: Record<DifficultyLevel, number> = {
      beginner: 0,
      intermediate: 0,
      advanced: 0,
    };

    sortedPlans.forEach((p) => {
      if (p.workout) {
        const difficulty = p.workout.difficulty;
        workoutsByDifficulty[difficulty]++;
      }
    });

    return {
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      plans: sortedPlans,
      summary: {
        totalWorkouts,
        totalRestDays,
        totalCalories,
        totalProtein,
        avgDailyCalories: sortedPlans.length > 0 ? totalCalories / sortedPlans.length : 0,
        workoutsByDifficulty,
      },
    };
  },
};

// ==================== ADMIN TEMPLATE SERVICE ====================

/** In-memory template storage (will be replaced with database in production) */
let customTemplates: PDFTemplate[] = [];

export const AdminPDFService = {
  /**
   * Get all templates (default + custom)
   */
  getAllTemplates(): PDFTemplate[] {
    return [DEFAULT_DAILY_TEMPLATE, DEFAULT_WEEKLY_TEMPLATE, ...customTemplates];
  },

  /**
   * Get templates by type
   */
  getTemplatesByType(type: 'daily' | 'weekly'): PDFTemplate[] {
    return this.getAllTemplates().filter((t) => t.type === type);
  },

  /**
   * Get template by ID
   */
  getTemplateById(id: string): PDFTemplate | undefined {
    return this.getAllTemplates().find((t) => t.id === id);
  },

  /**
   * Create a new template
   */
  createTemplate(template: Omit<PDFTemplate, 'id'>): PDFTemplate {
    const newTemplate: PDFTemplate = {
      ...template,
      id: `template-${Date.now()}`,
      isDefault: false,
    };
    customTemplates.push(newTemplate);
    return newTemplate;
  },

  /**
   * Update an existing template
   */
  updateTemplate(id: string, updates: Partial<PDFTemplate>): PDFTemplate | null {
    const index = customTemplates.findIndex((t) => t.id === id);
    if (index === -1) return null;

    customTemplates[index] = {
      ...customTemplates[index],
      ...updates,
      id, // Preserve ID
      isDefault: false, // Custom templates can't be default
    };

    return customTemplates[index];
  },

  /**
   * Delete a template
   */
  deleteTemplate(id: string): boolean {
    const initialLength = customTemplates.length;
    customTemplates = customTemplates.filter((t) => t.id !== id);
    return customTemplates.length < initialLength;
  },

  /**
   * Duplicate a template
   */
  duplicateTemplate(id: string, newName?: string): PDFTemplate | null {
    const source = this.getTemplateById(id);
    if (!source) return null;

    return this.createTemplate({
      ...source,
      name: newName ?? `${source.name} (Copy)`,
      isDefault: false,
    });
  },

  /**
   * Export template as JSON
   */
  exportTemplate(id: string): string | null {
    const template = this.getTemplateById(id);
    if (!template) return null;
    return JSON.stringify(template, null, 2);
  },

  /**
   * Import template from JSON
   */
  importTemplate(json: string): PDFTemplate | null {
    try {
      const parsed = JSON.parse(json) as PDFTemplate;
      return this.createTemplate({
        ...parsed,
        name: `${parsed.name} (Imported)`,
      });
    } catch {
      return null;
    }
  },
};

export default PDFService;
