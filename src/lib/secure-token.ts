/**
 * Utility functions for securely handling tokens
 */

// Simple encryption/decryption for tokens
// Note: In a production environment, you would use a more secure encryption method
// and store the encryption key in a secure environment variable

const ENCRYPTION_KEY = "secure-browser-updates-key"; // In production, this would be an environment variable

/**
 * Encrypt a token before storing it
 * @param token The token to encrypt
 * @returns The encrypted token
 */
export function encryptToken(token: string): string {
  if (!token) return "";
  
  try {
    // Simple XOR encryption (for demonstration purposes only)
    // In production, use a proper encryption library
    const encrypted = Array.from(token)
      .map((char, i) => {
        const keyChar = ENCRYPTION_KEY[i % ENCRYPTION_KEY.length];
        return String.fromCharCode(char.charCodeAt(0) ^ keyChar.charCodeAt(0));
      })
      .join("");
    
    return btoa(encrypted); // Base64 encode
  } catch (error) {
    console.error("Error encrypting token:", error);
    return "";
  }
}

/**
 * Decrypt a stored token
 * @param encryptedToken The encrypted token
 * @returns The decrypted token
 */
export function decryptToken(encryptedToken: string): string {
  if (!encryptedToken) return "";
  
  try {
    const encrypted = atob(encryptedToken); // Base64 decode
    
    // Simple XOR decryption
    const decrypted = Array.from(encrypted)
      .map((char, i) => {
        const keyChar = ENCRYPTION_KEY[i % ENCRYPTION_KEY.length];
        return String.fromCharCode(char.charCodeAt(0) ^ keyChar.charCodeAt(0));
      })
      .join("");
    
    return decrypted;
  } catch (error) {
    console.error("Error decrypting token:", error);
    return "";
  }
}

/**
 * Mask a token for display purposes
 * @param token The token to mask
 * @returns The masked token
 */
export function maskToken(token: string): string {
  if (!token) return "";
  
  // Show first 4 and last 4 characters, mask the rest
  if (token.length <= 8) {
    return "••••••••";
  }
  
  const firstFour = token.substring(0, 4);
  const lastFour = token.substring(token.length - 4);
  const maskedLength = token.length - 8;
  const maskedPart = "•".repeat(maskedLength);
  
  return `${firstFour}${maskedPart}${lastFour}`;
}

/**
 * Validate a GitHub token format
 * @param token The token to validate
 * @returns Whether the token is valid
 */
export function isValidGithubToken(token: string): boolean {
  if (!token) return false;
  
  // GitHub tokens are typically 40 characters long for personal access tokens
  // or start with "ghp_" for fine-grained tokens
  return token.length >= 40 || token.startsWith("ghp_");
}