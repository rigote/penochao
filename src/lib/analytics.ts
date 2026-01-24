/**
 * Google Analytics utility functions
 * Provides type-safe event tracking
 */

// Get GA ID from environment variable
const GA_ID = process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID

// Declare gtag function for TypeScript
declare global {
  interface Window {
    gtag: (
      command: 'config' | 'event' | 'js' | 'set',
      targetId: string | Date,
      config?: Record<string, any>
    ) => void
  }
}

/**
 * Track page views
 */
export const trackPageView = (url: string) => {
  if (typeof window !== 'undefined' && window.gtag && GA_ID) {
    window.gtag('config', GA_ID, {
      page_path: url,
    })
  }
}

/**
 * Track custom events
 */
export const trackEvent = (
  action: string,
  category: string,
  label?: string,
  value?: number
) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    })
  }
}

/**
 * Track user login
 */
export const trackLogin = (method: string) => {
  trackEvent('login', 'authentication', method)
}

/**
 * Track user signup
 */
export const trackSignup = (method: string) => {
  trackEvent('sign_up', 'authentication', method)
}

/**
 * Track expense creation
 */
export const trackExpenseCreated = (amount: number, category?: string) => {
  trackEvent('expense_created', 'expenses', category, amount)
}

/**
 * Track income creation
 */
export const trackIncomeCreated = (amount: number, category?: string) => {
  trackEvent('income_created', 'incomes', category, amount)
}

/**
 * Track invoice upload
 */
export const trackInvoiceUpload = (fileType: string) => {
  trackEvent('invoice_uploaded', 'invoices', fileType)
}

/**
 * Track report export
 */
export const trackReportExport = (reportType: string) => {
  trackEvent('report_exported', 'reports', reportType)
}

/**
 * Track subscription upgrade
 */
export const trackSubscriptionUpgrade = (plan: string) => {
  trackEvent('subscription_upgrade', 'subscription', plan)
}

/**
 * Track feature usage
 */
export const trackFeatureUsage = (featureName: string) => {
  trackEvent('feature_used', 'features', featureName)
}

/**
 * Track search
 */
export const trackSearch = (searchTerm: string, resultsCount: number) => {
  trackEvent('search', 'engagement', searchTerm, resultsCount)
}

/**
 * Track button click
 */
export const trackButtonClick = (buttonName: string, location: string) => {
  trackEvent('button_click', 'engagement', `${location}_${buttonName}`)
}

/**
 * Track form submission
 */
export const trackFormSubmit = (formName: string, success: boolean) => {
  trackEvent(
    success ? 'form_submit_success' : 'form_submit_error',
    'forms',
    formName
  )
}

/**
 * Track error
 */
export const trackError = (errorMessage: string, errorLocation: string) => {
  trackEvent('error', 'errors', `${errorLocation}: ${errorMessage}`)
}
