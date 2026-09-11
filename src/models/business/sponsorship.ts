export interface SponsorshipProgress {
  currency: string;
  goal: number;
  raised: number;
  month: string;
  profileUrl: string;
}

export interface KofiPayment {
  amount: number;
  currency: string;
  receivedAt: Date;
  eventId: string;
}
