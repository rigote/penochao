export const PRIVACY_CONSENT_KEY = "penochao:privacy-consent"

export type PrivacyConsentStatus = "accepted" | "rejected"

export function isPrivacyConsentStatus(value: unknown): value is PrivacyConsentStatus {
  return value === "accepted" || value === "rejected"
}

export function canLoadAnalytics(status: PrivacyConsentStatus | null): boolean {
  return status === "accepted"
}

export function getStoredPrivacyConsent(storage: Pick<Storage, "getItem">): PrivacyConsentStatus | null {
  const value = storage.getItem(PRIVACY_CONSENT_KEY)
  return isPrivacyConsentStatus(value) ? value : null
}

export function setStoredPrivacyConsent(
  storage: Pick<Storage, "setItem">,
  status: PrivacyConsentStatus
) {
  storage.setItem(PRIVACY_CONSENT_KEY, status)
}
