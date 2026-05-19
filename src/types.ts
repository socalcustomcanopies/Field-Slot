export enum SlotStatus {
  AVAILABLE = 'available',
  BOOKED = 'booked',
  PENDING = 'pending'
}

export enum GameType {
  PRIVATE = 'private',
  OPEN_CHALLENGE = 'open_challenge'
}

export enum MatchType {
  SMALL_SIDED = 'small_sided',
  FULL_FIELD = '11v11'
}

export interface Team {
  id: string;
  name: string;
  managerId: string;
  logoUrl?: string;
  createdAt: any;
}

export interface Field {
  id: string;
  name: string;
  location: string;
  imageUrl?: string;
  capacity?: number;
  amenities?: string[];
}

export interface Slot {
  id: string;
  fieldId: string;
  field?: Field; // Joined data
  startTime: any;
  endTime: any;
  price: number;
  status: SlotStatus;
  bookedByTeamId?: string;
  bookedByTeam?: Team; // Joined data
  opponentTeamId?: string;
  opponentTeam?: Team; // Joined data
  gameType: GameType;
  matchType?: MatchType;
}

export interface Booking {
  id: string;
  slotId: string;
  teamId: string;
  amount: number;
  status: 'pending' | 'confirmed' | 'failed';
  createdAt: any;
}
