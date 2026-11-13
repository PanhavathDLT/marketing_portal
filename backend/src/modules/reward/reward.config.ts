// Check-in points per day — index 0 = Day 1, index 6 = Day 7
// Cycle length is derived from this array's length
export const CHECK_IN_POINTS = [20, 20, 20, 20, 20, 20, 60];
export const CYCLE_LENGTH = CHECK_IN_POINTS.length;

// Tier thresholds (minimum cumulative points to reach each tier)
export const TIER_THRESHOLDS = {
  BRONZE: 0,
  SILVER: 200,
  GOLD: 500,
  PLATINUM: 1000,
  DIAMOND: 2000,
};

export const TIERS = ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'DIAMOND'] as const;

// Phnom Penh timezone for day boundary
export const TIMEZONE = 'Asia/Phnom_Penh';
