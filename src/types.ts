export type CardType = 'gift' | 'loyalty' | 'credit';

export interface Card {
  id: string;
  store: string;
  balance: number;
  type: CardType;
  expiryDate?: string; // YYYY-MM-DD
  serialNumber?: string;
  pin?: string;
  notes?: string;
  photoId?: string | null; // bar code / card image blob stored in IndexedDB
  createdAt: string;
  updatedAt: string;
}
