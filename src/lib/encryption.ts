import crypto from "crypto"

/**
 * Encryption key from environment variable
 * Must be 32 bytes (256 bits) for AES-256
 * Generate with: node -e "console.log(crypto.randomBytes(32).toString('base64'))"
 */
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY

if (!ENCRYPTION_KEY) {
  throw new Error(
    "ENCRYPTION_KEY environment variable is required. Generate one with: node -e \"console.log(crypto.randomBytes(32).toString('base64'))\""
  )
}

// Convert base64 key to buffer
const key = Buffer.from(ENCRYPTION_KEY, "base64")

if (key.length !== 32) {
  throw new Error("ENCRYPTION_KEY must be 32 bytes (256 bits) when decoded from base64")
}

const ALGORITHM = "aes-256-gcm"
const IV_LENGTH = 16 // 16 bytes for AES
const AUTH_TAG_LENGTH = 16 // 16 bytes for GCM

/**
 * Encrypts a string value using AES-256-GCM
 * @param text - The plaintext to encrypt
 * @returns Base64 encoded string containing IV + authTag + ciphertext
 */
export function encrypt(text: string): string {
  if (!text) {
    return text
  }

  try {
    // Generate random IV for each encryption
    const iv = crypto.randomBytes(IV_LENGTH)

    // Create cipher
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv)

    // Encrypt
    let encrypted = cipher.update(text, "utf8", "base64")
    encrypted += cipher.final("base64")

    // Get authentication tag
    const authTag = cipher.getAuthTag()

    // Combine IV + authTag + encrypted data
    // Format: base64(IV) + ":" + base64(authTag) + ":" + base64(encrypted)
    return `${iv.toString("base64")}:${authTag.toString("base64")}:${encrypted}`
  } catch (error) {
    console.error("Encryption error:", error)
    throw new Error("Failed to encrypt data")
  }
}

/**
 * Decrypts a string value encrypted with encrypt()
 * @param encryptedText - The encrypted string in format: base64(IV):base64(authTag):base64(ciphertext)
 * @returns The decrypted plaintext
 */
export function decrypt(encryptedText: string): string {
  if (!encryptedText) {
    return encryptedText
  }

  try {
    // Check if the text is already encrypted (has the format)
    if (!encryptedText.includes(":")) {
      // Legacy unencrypted data - return as is
      // This allows gradual migration
      return encryptedText
    }

    const parts = encryptedText.split(":")
    if (parts.length !== 3) {
      // Invalid format - might be legacy data
      return encryptedText
    }

    const [ivBase64, authTagBase64, encrypted] = parts

    // Decode IV and auth tag
    const iv = Buffer.from(ivBase64, "base64")
    const authTag = Buffer.from(authTagBase64, "base64")

    // Create decipher
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
    decipher.setAuthTag(authTag)

    // Decrypt
    let decrypted = decipher.update(encrypted, "base64", "utf8")
    decrypted += decipher.final("utf8")

    return decrypted
  } catch (error) {
    console.error("Decryption error:", error)
    // If decryption fails, return the original text (might be legacy unencrypted data)
    // This allows graceful handling during migration
    return encryptedText
  }
}

/**
 * Encrypts a numeric value (converts to string first)
 * @param value - The number to encrypt
 * @returns Encrypted string
 */
export function encryptNumber(value: number | string): string {
  return encrypt(String(value))
}

/**
 * Decrypts a numeric value and converts back to number
 * @param encryptedValue - The encrypted string
 * @returns The decrypted number as string (for decimal precision)
 */
export function decryptNumber(encryptedValue: string): string {
  const decrypted = decrypt(encryptedValue)
  // Validate it's a valid number
  if (isNaN(parseFloat(decrypted))) {
    throw new Error("Decrypted value is not a valid number")
  }
  return decrypted
}

/**
 * Encrypts a JSON object
 * @param obj - The object to encrypt
 * @returns Encrypted string
 */
export function encryptJSON(obj: unknown): string {
  return encrypt(JSON.stringify(obj))
}

/**
 * Decrypts a JSON object
 * @param encryptedJSON - The encrypted JSON string
 * @returns The decrypted object
 */
export function decryptJSON<T = unknown>(encryptedJSON: string): T {
  const decrypted = decrypt(encryptedJSON)
  try {
    return JSON.parse(decrypted) as T
  } catch (error) {
    throw new Error("Failed to parse decrypted JSON")
  }
}
