
export interface AgentMemory {
  recipientName: string;
  generatedCardUrl: string | null;
  generatedBackgroundUrl?: string | null;
  cardMessage: string | null;
  giftUrl: string | null;
  conversationContext: string; // Stores the chat transcript or text prompt
}

export enum InputMode {
  TEXT = 'TEXT',
  VOICE = 'VOICE'
}
