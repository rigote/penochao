import {
  PRIVACY_CONSENT_KEY,
  canLoadAnalytics,
  getStoredPrivacyConsent,
  isPrivacyConsentStatus,
  setStoredPrivacyConsent,
} from "./privacy-consent"

function createStorage(initialValue?: string) {
  const data = new Map<string, string>()
  if (initialValue) data.set(PRIVACY_CONSENT_KEY, initialValue)

  return {
    getItem: jest.fn((key: string) => data.get(key) ?? null),
    setItem: jest.fn((key: string, value: string) => {
      data.set(key, value)
    }),
  }
}

describe("privacy consent", () => {
  it("accepts only supported consent statuses", () => {
    expect(isPrivacyConsentStatus("accepted")).toBe(true)
    expect(isPrivacyConsentStatus("rejected")).toBe(true)
    expect(isPrivacyConsentStatus("pending")).toBe(false)
    expect(isPrivacyConsentStatus(null)).toBe(false)
  })

  it("loads analytics only after explicit acceptance", () => {
    expect(canLoadAnalytics("accepted")).toBe(true)
    expect(canLoadAnalytics("rejected")).toBe(false)
    expect(canLoadAnalytics(null)).toBe(false)
  })

  it("ignores invalid stored values", () => {
    expect(getStoredPrivacyConsent(createStorage("accepted"))).toBe("accepted")
    expect(getStoredPrivacyConsent(createStorage("rejected"))).toBe("rejected")
    expect(getStoredPrivacyConsent(createStorage("invalid"))).toBeNull()
  })

  it("stores the user consent decision", () => {
    const storage = createStorage()

    setStoredPrivacyConsent(storage, "rejected")

    expect(storage.setItem).toHaveBeenCalledWith(PRIVACY_CONSENT_KEY, "rejected")
    expect(getStoredPrivacyConsent(storage)).toBe("rejected")
  })
})
