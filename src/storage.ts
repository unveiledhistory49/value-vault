import type { Card } from './types';
import { encryptData, decryptData } from './lib/crypto';

const VAULT_KEY = 'valuevault_encrypted';
const SALT_CHECK_KEY = 'valuevault_check'; // Encrypted string "valuevault_authenticated" to verify PIN

export function uid(prefix = 'id_') {
  return prefix + Math.random().toString(36).slice(2, 9);
}

// Helper to compress images to small Base64 JPEG strings
export function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        // Max dimension 600px
        const max = 600;
        if (width > max || height > max) {
          if (width > height) {
            height = Math.round((height * max) / width);
            width = max;
          } else {
            width = Math.round((width * max) / height);
            height = max;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context not available'));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        
        // Low quality (0.5) to keep storage under ~30KB
        const base64 = canvas.toDataURL('image/jpeg', 0.5);
        resolve(base64);
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

// Check if a vault already exists
export function hasVault(): boolean {
  return !!localStorage.getItem(SALT_CHECK_KEY);
}

// Setup a new vault with a password
export async function setupVault(password: string): Promise<void> {
  const checkEncrypted = await encryptData("valuevault_authenticated", password);
  localStorage.setItem(SALT_CHECK_KEY, checkEncrypted);
  
  // Save empty cards list
  const emptyEncrypted = await encryptData(JSON.stringify([]), password);
  localStorage.setItem(VAULT_KEY, emptyEncrypted);
}

// Unlock vault: verify PIN and return cards
export async function unlockVault(password: string): Promise<Card[]> {
  const checkStr = localStorage.getItem(SALT_CHECK_KEY);
  if (!checkStr) {
    throw new Error("No vault found");
  }
  
  // Verify password by decrypting salt check
  const decryptedCheck = await decryptData(checkStr, password);
  if (decryptedCheck !== "valuevault_authenticated") {
    throw new Error("Incorrect Password/PIN");
  }
  
  const encryptedCards = localStorage.getItem(VAULT_KEY);
  if (!encryptedCards) return [];
  
  const decryptedCards = await decryptData(encryptedCards, password);
  return JSON.parse(decryptedCards) as Card[];
}

// Save all cards back to encrypted store
export async function saveVault(cards: Card[], password: string): Promise<void> {
  const encrypted = await encryptData(JSON.stringify(cards), password);
  localStorage.setItem(VAULT_KEY, encrypted);
}

// Wipe local data
export function wipeVault(): void {
  localStorage.removeItem(VAULT_KEY);
  localStorage.removeItem(SALT_CHECK_KEY);
}
