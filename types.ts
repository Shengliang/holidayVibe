
export interface AgentMemory {
  recipientName: string;
  senderName?: string;
  date?: string;
  generatedCardUrl: string | null;
  generatedBackgroundUrl?: string | null;
  cardMessage: string | null;
  giftUrl: string | null;
  conversationContext: string; // Stores the chat transcript or text prompt
  userImages?: { data: string; mime: string }[]; // Reference photos
  photoAlbumLink?: string; // Shared album link
}

export enum InputMode {
  TEXT = 'TEXT',
  VOICE = 'VOICE'
}
