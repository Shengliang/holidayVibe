export interface AgentMemory {
  vibe: string;
  themeColor: string;
  charity: string | null;
  donationAmount: number;
  recipientName: string;
  generatedCardUrl: string | null;
  cardMessage: string | null;
  giftUrl: string | null;
}

export enum AppView {
  DASHBOARD = 'DASHBOARD',
  VIBE_STUDIO = 'VIBE_STUDIO',
  LIVE_AGENT = 'LIVE_AGENT',
  VEO_MEMORIES = 'VEO_MEMORIES',
  CHARITY = 'CHARITY',
  CARD_WORKSHOP = 'CARD_WORKSHOP'
}

export interface NavItem {
  id: AppView;
  label: string;
  icon: string;
  description: string;
}
