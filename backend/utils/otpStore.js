// Secure in-memory server-side storage for temporary OTP records.
// NOTE: This is for local development only. In production, we will migrate to Redis or MongoDB.
const otps = new Map();

const OTP_EXPIRATION_TIME = 10 * 60 * 1000; // 10 minutes
const RESEND_COOLDOWN_TIME = 1 * 60 * 1000; // 1 minute
const MAX_ATTEMPTS = 5;

/**
 * Saves a new OTP record for an email. Enforces request rate limits.
 * 
 * @param {string} email 
 * @param {string} hashedOtp 
 * @throws {Error} If user is within the 1-minute resend cooldown period.
 */
export function saveOtp(email, hashedOtp) {
  const normalizedEmail = email.trim().toLowerCase();
  const existingRecord = otps.get(normalizedEmail);

  if (existingRecord) {
    const timeSinceLastRequest = Date.now() - existingRecord.createdAt;
    if (timeSinceLastRequest < RESEND_COOLDOWN_TIME) {
      const secondsLeft = Math.ceil((RESEND_COOLDOWN_TIME - timeSinceLastRequest) / 1000);
      throw new Error(`Please wait ${secondsLeft} seconds before requesting a new OTP.`);
    }
  }

  otps.set(normalizedEmail, {
    email: normalizedEmail,
    hashedOtp,
    expiresAt: Date.now() + OTP_EXPIRATION_TIME,
    attempts: 0,
    createdAt: Date.now(),
    verified: false
  });
}

/**
 * Retrieves the OTP record for a given email.
 * 
 * @param {string} email 
 * @returns {object|null}
 */
export function getOtp(email) {
  const normalizedEmail = email.trim().toLowerCase();
  return otps.get(normalizedEmail) || null;
}

/**
 * Increments the verification attempts counter for an email.
 * 
 * @param {string} email 
 * @returns {number} Updated attempts count.
 */
export function incrementAttempts(email) {
  const normalizedEmail = email.trim().toLowerCase();
  const record = otps.get(normalizedEmail);
  if (record) {
    record.attempts += 1;
    otps.set(normalizedEmail, record);
    return record.attempts;
  }
  return 0;
}

/**
 * Deletes the OTP record for a given email.
 * 
 * @param {string} email 
 */
export function deleteOtp(email) {
  const normalizedEmail = email.trim().toLowerCase();
  otps.delete(normalizedEmail);
}

export { MAX_ATTEMPTS };
