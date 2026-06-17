export type TierName = "Villager" | "Adventurer" | "Warrior" | "Hero" | "Legend" | "FoundingHero";

export interface TierRule {
  // Gaming hours
  periodType: "weekly" | "monthly" | null;
  sessionHoursCap: number;        // hrs free per period (Infinity = unlimited)
  dailyHoursCap: number | null;   // max hrs per calendar day (null = no daily cap)

  // Wi-Fi
  wifiMinutesPerPeriod: number | null; // null = unlimited (or not included if 0)
  wifiUnlimitedInSession: boolean;     // unlimited while gaming, not standalone

  // Racing sim ($3/race walk-in)
  racingFreeRacesPerMonth: number;  // 0 = no free races
  racingDiscountPct: number;        // % off after free races are used

  // Friday Mini-Tourney
  fridayMiniFreePerMonth: number;   // Infinity = always free (Legend)
  fridayMiniPriceAfterFree: number; // per entry after free used

  // Other tournaments (Darts, Pool, Chess League, Grand Prix, Seasonal, etc.)
  otherTournamentDiscountPct: number; // % off all entries, always, no cap

  // Racing Sim League (bi-weekly)
  racingLeagueFreePerMonth: number;   // Legend: 1 free, others: 0
  racingLeaguePriceAfterFree: number; // walk-in price after free used

  // Perks (informational — applied physically, shown to staff)
  snackDiscountPct: number;
  chessClubIncluded: boolean;

  // XP
  xpVisitBonus: number;   // flat XP added on top of base 1 XP per visit day
  xpMultiplier: number;   // multiplier on all XP sources
}

export const TIER_RULES: Record<TierName, TierRule> = {
  Villager: {
    periodType: null,
    sessionHoursCap: 0,
    dailyHoursCap: null,
    wifiMinutesPerPeriod: 0,
    wifiUnlimitedInSession: false,
    racingFreeRacesPerMonth: 0,
    racingDiscountPct: 0,
    fridayMiniFreePerMonth: 0,
    fridayMiniPriceAfterFree: 1,       // same as walk-in
    otherTournamentDiscountPct: 0,
    racingLeagueFreePerMonth: 0,
    racingLeaguePriceAfterFree: 5,
    snackDiscountPct: 0,
    chessClubIncluded: false,
      xpVisitBonus: 0,
    xpMultiplier: 1.0,
  },
  Adventurer: {
    periodType: null,
    sessionHoursCap: 0,
    dailyHoursCap: null,
    wifiMinutesPerPeriod: 0,
    wifiUnlimitedInSession: false,
    racingFreeRacesPerMonth: 0,
    racingDiscountPct: 0,
    fridayMiniFreePerMonth: 0,
    fridayMiniPriceAfterFree: 1,
    otherTournamentDiscountPct: 0,
    racingLeagueFreePerMonth: 0,
    racingLeaguePriceAfterFree: 5,
    snackDiscountPct: 0,
    chessClubIncluded: false,
      xpVisitBonus: 0,
    xpMultiplier: 1.0,
  },
  Warrior: {
    periodType: "weekly",
    sessionHoursCap: 3,
    dailyHoursCap: 1,            // 1hr/day max even if weekly hours remain
    wifiMinutesPerPeriod: 30,    // 30 min included per week
    wifiUnlimitedInSession: false,
    racingFreeRacesPerMonth: 0,
    racingDiscountPct: 0,        // full walk-in price always
    fridayMiniFreePerMonth: 1,   // once per month free
    fridayMiniPriceAfterFree: 1, // $1 per additional entry
    otherTournamentDiscountPct: 0,
    racingLeagueFreePerMonth: 0,
    racingLeaguePriceAfterFree: 5,
    snackDiscountPct: 10,
    chessClubIncluded: false,
      xpVisitBonus: 1,
    xpMultiplier: 1.1,
  },
  Hero: {
    periodType: "monthly",
    sessionHoursCap: 15,
    dailyHoursCap: null,
    wifiMinutesPerPeriod: null,  // unlimited in-session
    wifiUnlimitedInSession: true,
    racingFreeRacesPerMonth: 1,
    racingDiscountPct: 20,       // $2.40 per race after free
    fridayMiniFreePerMonth: 1,
    fridayMiniPriceAfterFree: 0.50, // 50% off $1 = $0.50
    otherTournamentDiscountPct: 50,
    racingLeagueFreePerMonth: 0,
    racingLeaguePriceAfterFree: 5,
    snackDiscountPct: 15,
    chessClubIncluded: true,
      xpVisitBonus: 2,
    xpMultiplier: 1.2,
  },
  FoundingHero: {
    // Identical to Hero — only price differs ($15 vs $20)
    periodType: "monthly",
    sessionHoursCap: 15,
    dailyHoursCap: null,
    wifiMinutesPerPeriod: null,
    wifiUnlimitedInSession: true,
    racingFreeRacesPerMonth: 1,
    racingDiscountPct: 20,
    fridayMiniFreePerMonth: 1,
    fridayMiniPriceAfterFree: 0.50,
    otherTournamentDiscountPct: 50,
    racingLeagueFreePerMonth: 0,
    racingLeaguePriceAfterFree: 5,
    snackDiscountPct: 15,
    chessClubIncluded: true,
      xpVisitBonus: 2,
    xpMultiplier: 1.2,
  },
  Legend: {
    periodType: "monthly",
    sessionHoursCap: Infinity,
    dailyHoursCap: 1,            // 1hr/day cap (30hrs/month if visiting daily)
    wifiMinutesPerPeriod: null,  // fully unlimited, including standalone
    wifiUnlimitedInSession: true,
    racingFreeRacesPerMonth: 3,
    racingDiscountPct: 50,       // $1.50 per race after free
    fridayMiniFreePerMonth: Infinity, // always free, no tracking needed
    fridayMiniPriceAfterFree: 0,
    otherTournamentDiscountPct: 50,
    racingLeagueFreePerMonth: 1,
    racingLeaguePriceAfterFree: 5,
    snackDiscountPct: 25,
    chessClubIncluded: true,
      xpVisitBonus: 3,
    xpMultiplier: 1.35,
  },
};

export function getTierRule(tier: string): TierRule {
  return TIER_RULES[tier as TierName] ?? TIER_RULES.Adventurer;
}

export function isRacingSimDevice(deviceType: string): boolean {
  return deviceType.toLowerCase().includes("racing");
}

/** Next period end from a given start date */
export function nextPeriodEnd(from: Date, periodType: "weekly" | "monthly"): Date {
  const d = new Date(from);
  if (periodType === "weekly") d.setDate(d.getDate() + 7);
  else d.setMonth(d.getMonth() + 1);
  return d;
}

export function nextMonthEnd(from: Date): Date {
  const d = new Date(from);
  d.setMonth(d.getMonth() + 1);
  return d;
}

// ── Session pricing ────────────────────────────────────────────────────────────

export interface SessionPricing {
  isRacingSim: boolean;
  basePrice: number;
  membershipCovered: boolean;
  coveredHours: number;       // for gaming sessions
  excessHours: number;
  raceFree: boolean;          // for racing sims
  totalPrice: number;
  membershipDiscount: number;
  label: string;              // single line for staff
  warning: string | null;     // shown when perk is exhausted or cap enforced
  dailyCapExceeded: boolean;
  dailyHoursRemaining: number | null;
}

export function calculateGamingSessionPricing(params: {
  durationHours: number;
  hourlyRate: number;
  tier: string;
  hoursUsedThisPeriod: number;
  hoursUsedToday: number;
  periodExpired: boolean;
  membershipActive: boolean;
}): SessionPricing {
  const { durationHours, hourlyRate, tier, hoursUsedThisPeriod, hoursUsedToday, periodExpired, membershipActive } = params;
  const rule = getTierRule(tier);
  const basePrice = durationHours * hourlyRate;

  const noMembership: SessionPricing = {
    isRacingSim: false,
    basePrice,
    membershipCovered: false,
    coveredHours: 0,
    excessHours: durationHours,
    raceFree: false,
    totalPrice: basePrice,
    membershipDiscount: 0,
    label: `$${basePrice.toFixed(2)}`,
    warning: null,
    dailyCapExceeded: false,
    dailyHoursRemaining: null,
  };

  if (!rule.periodType || rule.sessionHoursCap === 0 || !membershipActive) {
    return noMembership;
  }

  // Daily cap check
  let dailyCapExceeded = false;
  let dailyHoursRemaining: number | null = null;
  let effectiveDuration = durationHours;

  if (rule.dailyHoursCap !== null) {
    const dailyRemaining = Math.max(0, rule.dailyHoursCap - hoursUsedToday);
    dailyHoursRemaining = dailyRemaining;
    if (durationHours > dailyRemaining) {
      dailyCapExceeded = true;
      effectiveDuration = dailyRemaining; // clamp to daily remaining
    }
  }

  if (effectiveDuration <= 0) {
    return {
      ...noMembership,
      dailyCapExceeded: true,
      dailyHoursRemaining: 0,
      label: "Daily cap reached — full walk-in price",
      warning: `Daily limit of ${rule.dailyHoursCap}h reached. No membership hours apply today.`,
      totalPrice: basePrice,
    };
  }

  const usedSoFar = periodExpired ? 0 : hoursUsedThisPeriod;
  const cap = rule.sessionHoursCap;
  const remaining = Math.max(0, cap === Infinity ? effectiveDuration : cap - usedSoFar);
  const coveredHours = Math.min(effectiveDuration, remaining);
  const excessHours = Math.max(0, effectiveDuration - coveredHours);
  // Add back any daily-capped hours at full price
  const uncappedHours = durationHours - effectiveDuration;
  const totalPrice = (excessHours + uncappedHours) * hourlyRate;
  const membershipDiscount = basePrice - totalPrice;

  let label: string;
  let warning: string | null = null;

  if (dailyCapExceeded) {
    warning = `Daily cap of ${rule.dailyHoursCap}h — only ${dailyHoursRemaining?.toFixed(1)}h of this session applies to membership.`;
  }

  if (excessHours === 0 && !dailyCapExceeded) {
    label = "FREE (membership)";
  } else if (coveredHours > 0 && !dailyCapExceeded) {
    label = `$${totalPrice.toFixed(2)} — ${coveredHours.toFixed(1)}h free, ${excessHours.toFixed(1)}h charged`;
  } else if (dailyCapExceeded && dailyHoursRemaining === 0) {
    label = `$${totalPrice.toFixed(2)} — daily cap reached`;
  } else {
    label = `$${totalPrice.toFixed(2)}`;
  }

  return {
    isRacingSim: false,
    basePrice,
    membershipCovered: coveredHours > 0,
    coveredHours,
    excessHours,
    raceFree: false,
    totalPrice,
    membershipDiscount,
    label,
    warning,
    dailyCapExceeded,
    dailyHoursRemaining,
  };
}

export interface RacingPricing {
  isRacingSim: true;
  basePrice: number;           // walk-in rate per race
  raceFree: boolean;
  freeRacesRemaining: number;
  totalPrice: number;
  membershipCovered: boolean;  // true when race is free via membership
  membershipDiscount: number;
  label: string;
  warning: string | null;
}

export function calculateRacingPricing(params: {
  walkInRate: number;
  tier: string;
  racingRacesUsed: number;
  perksMonthExpired: boolean;
  membershipActive: boolean;
}): RacingPricing {
  const { walkInRate, tier, racingRacesUsed, perksMonthExpired, membershipActive } = params;
  const rule = getTierRule(tier);

  const usedRaces = perksMonthExpired ? 0 : racingRacesUsed;
  const freeRacesRemaining = Math.max(0, rule.racingFreeRacesPerMonth - usedRaces);

  if (!membershipActive || rule.racingFreeRacesPerMonth === 0) {
    return {
      isRacingSim: true,
      basePrice: walkInRate,
      raceFree: false,
      freeRacesRemaining: 0,
      totalPrice: walkInRate,
      membershipCovered: false,
      membershipDiscount: 0,
      label: `$${walkInRate.toFixed(2)} (walk-in)`,
      warning: null,
    };
  }

  if (freeRacesRemaining > 0) {
    return {
      isRacingSim: true,
      basePrice: walkInRate,
      raceFree: true,
      freeRacesRemaining,
      totalPrice: 0,
      membershipCovered: true,
      membershipDiscount: walkInRate,
      label: "FREE (membership)",
      warning: null,
    };
  }

  // After free races — apply discount
  const discountedPrice = walkInRate * (1 - rule.racingDiscountPct / 100);
  return {
    isRacingSim: true,
    basePrice: walkInRate,
    raceFree: false,
    freeRacesRemaining: 0,
    totalPrice: discountedPrice,
    membershipCovered: false,
    membershipDiscount: walkInRate - discountedPrice,
    label: `$${discountedPrice.toFixed(2)} (${rule.racingDiscountPct}% off — free races used)`,
    warning: `All ${rule.racingFreeRacesPerMonth} free race${rule.racingFreeRacesPerMonth > 1 ? "s" : ""} used this month.`,
  };
}

// ── Tournament pricing ──────────────────────────────────────────────────────────

export type TournamentCategory = "friday_mini" | "racing_sim_league" | "other";

export function classifyTournament(category: string): TournamentCategory {
  const c = category.toLowerCase().replace(/[\s_-]+/g, "_");
  if (c.includes("friday") || c.includes("mini")) return "friday_mini";
  if (c.includes("racing") && c.includes("league")) return "racing_sim_league";
  return "other";
}

export interface TournamentPricing {
  walkInFee: number;
  finalFee: number;
  membershipDiscount: number;
  isFree: boolean;
  label: string;
  warning: string | null;
}

export function calculateTournamentPricing(params: {
  category: string;
  walkInFee: number;
  tier: string;
  fridayEntriesUsed: number;
  racingLeagueUsed: number;
  perksMonthExpired: boolean;
  membershipActive: boolean;
}): TournamentPricing {
  const { category, walkInFee, tier, fridayEntriesUsed, racingLeagueUsed, perksMonthExpired, membershipActive } = params;
  const rule = getTierRule(tier);
  const tourType = classifyTournament(category);

  const noDiscount: TournamentPricing = {
    walkInFee,
    finalFee: walkInFee,
    membershipDiscount: 0,
    isFree: walkInFee === 0,
    label: walkInFee === 0 ? "FREE" : `$${walkInFee.toFixed(2)}`,
    warning: null,
  };

  if (!membershipActive) return noDiscount;

  const usedFriday = perksMonthExpired ? 0 : fridayEntriesUsed;
  const usedLeague = perksMonthExpired ? 0 : racingLeagueUsed;

  if (tourType === "friday_mini") {
    const freeCap = rule.fridayMiniFreePerMonth;
    if (freeCap === Infinity || usedFriday < freeCap) {
      return {
        walkInFee,
        finalFee: 0,
        membershipDiscount: walkInFee,
        isFree: true,
        label: "FREE (membership)",
        warning: null,
      };
    }
    const priceAfter = rule.fridayMiniPriceAfterFree;
    return {
      walkInFee,
      finalFee: priceAfter,
      membershipDiscount: walkInFee - priceAfter,
      isFree: priceAfter === 0,
      label: priceAfter === 0 ? "FREE" : `$${priceAfter.toFixed(2)} (free entry used)`,
      warning: `Free Friday entry used this month. Additional entries: $${priceAfter.toFixed(2)}.`,
    };
  }

  if (tourType === "racing_sim_league") {
    if (rule.racingLeagueFreePerMonth > 0 && usedLeague < rule.racingLeagueFreePerMonth) {
      return {
        walkInFee,
        finalFee: 0,
        membershipDiscount: walkInFee,
        isFree: true,
        label: "FREE (membership)",
        warning: null,
      };
    }
    // After free entry or if no free entries
    const discounted = walkInFee * (1 - rule.otherTournamentDiscountPct / 100);
    if (rule.racingLeagueFreePerMonth > 0) {
      // Legend gets discount after free entry? Spec says "full price ($5)" for 2nd entry
      return {
        walkInFee,
        finalFee: rule.racingLeaguePriceAfterFree,
        membershipDiscount: walkInFee - rule.racingLeaguePriceAfterFree,
        isFree: rule.racingLeaguePriceAfterFree === 0,
        label: `$${rule.racingLeaguePriceAfterFree.toFixed(2)} (free entry used)`,
        warning: "Free Racing Sim League entry used this month.",
      };
    }
    // No free entries — apply general discount
    if (rule.otherTournamentDiscountPct > 0) {
      return {
        walkInFee,
        finalFee: discounted,
        membershipDiscount: walkInFee - discounted,
        isFree: discounted === 0,
        label: `$${discounted.toFixed(2)} (${rule.otherTournamentDiscountPct}% off)`,
        warning: null,
      };
    }
    return noDiscount;
  }

  // Other tournaments — flat discount, no cap
  if (rule.otherTournamentDiscountPct > 0) {
    const discounted = walkInFee * (1 - rule.otherTournamentDiscountPct / 100);
    return {
      walkInFee,
      finalFee: discounted,
      membershipDiscount: walkInFee - discounted,
      isFree: discounted === 0,
      label: `$${discounted.toFixed(2)} (${rule.otherTournamentDiscountPct}% off)`,
      warning: null,
    };
  }

  return noDiscount;
}

// ── Perk status summary (for admin panel display) ────────────────────────────────

export interface PerkStatus {
  tier: string;
  membershipActive: boolean;
  membershipExpiresAt: string | null;

  gaming: {
    hoursRemainingThisPeriod: number | null; // null = unlimited
    hoursUsedThisPeriod: number;
    periodCap: number | null;
    periodEnds: string | null;
    periodType: "weekly" | "monthly" | null;
    dailyCap: number | null;
    hoursUsedToday: number;
    dailyRemaining: number | null;
  };

  racing: {
    freeRacesTotal: number;
    freeRacesUsed: number;
    freeRacesRemaining: number;
    discountPct: number;
    priceAfterFree: number;
    basePrice: number;
  };

  tournaments: {
    fridayFreeTotal: number | "unlimited";
    fridayFreeUsed: number;
    fridayFreeRemaining: number | "unlimited";
    fridayPriceAfterFree: number;
    otherDiscountPct: number;
    racingLeagueFreeTotal: number;
    racingLeagueFreeUsed: number;
    racingLeagueFreeRemaining: number;
  };

  wifi: {
    minutesPerPeriod: number | null;
    minutesUsed: number;
    minutesRemaining: number | null;
    unlimitedInSession: boolean;
  };

  perks: {
    snackDiscountPct: number;
    chessClubIncluded: boolean;
    showOnLeaderboardWall: boolean;
    xpVisitBonus: number;
  };
}

export function buildPerkStatus(
  player: {
    membershipTier: string;
    membershipExpiresAt: Date | null;
    currentPeriodEnd: Date | null;
    hoursUsedThisPeriod: number;
    hoursUsedToday: number;
    lastSessionDate: string | null;
    perksMonthEnd: Date | null;
    racingRacesUsed: number;
    fridayEntriesUsed: number;
    racingLeagueUsed: number;
    wifiMinutesUsed: number;
    showOnLeaderboardWall: boolean;
  }
): PerkStatus {
  const rule = getTierRule(player.membershipTier);
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);

  const membershipActive = !player.membershipExpiresAt || player.membershipExpiresAt > now;
  const periodExpired = !player.currentPeriodEnd || player.currentPeriodEnd < now;
  const perksMonthExpired = !player.perksMonthEnd || player.perksMonthEnd < now;
  const isNewDay = player.lastSessionDate !== todayStr;

  const hoursUsedThisPeriod = periodExpired ? 0 : player.hoursUsedThisPeriod;
  const hoursUsedToday = isNewDay ? 0 : player.hoursUsedToday;
  const racingRacesUsed = perksMonthExpired ? 0 : player.racingRacesUsed;
  const fridayEntriesUsed = perksMonthExpired ? 0 : player.fridayEntriesUsed;
  const racingLeagueUsed = perksMonthExpired ? 0 : player.racingLeagueUsed;
  const wifiMinutesUsed = periodExpired ? 0 : player.wifiMinutesUsed;

  const cap = rule.sessionHoursCap === Infinity ? null : rule.sessionHoursCap;
  const hoursRemaining = !membershipActive || !rule.periodType
    ? null
    : cap === null
    ? null  // unlimited
    : Math.max(0, cap - hoursUsedThisPeriod);

  const dailyRemaining = rule.dailyHoursCap !== null
    ? Math.max(0, rule.dailyHoursCap - hoursUsedToday)
    : null;

  const freeRacesRemaining = Math.max(0, rule.racingFreeRacesPerMonth - racingRacesUsed);
  const fridayFreeTotal = rule.fridayMiniFreePerMonth === Infinity ? "unlimited" : rule.fridayMiniFreePerMonth;
  const fridayFreeRemaining = rule.fridayMiniFreePerMonth === Infinity
    ? "unlimited"
    : Math.max(0, rule.fridayMiniFreePerMonth - fridayEntriesUsed);

  const wifiMinutesRemaining = rule.wifiMinutesPerPeriod !== null && rule.wifiMinutesPerPeriod > 0
    ? Math.max(0, rule.wifiMinutesPerPeriod - wifiMinutesUsed)
    : rule.wifiMinutesPerPeriod;

  return {
    tier: player.membershipTier,
    membershipActive,
    membershipExpiresAt: player.membershipExpiresAt?.toISOString() ?? null,
    gaming: {
      hoursRemainingThisPeriod: hoursRemaining,
      hoursUsedThisPeriod,
      periodCap: cap,
      periodEnds: periodExpired ? null : (player.currentPeriodEnd?.toISOString() ?? null),
      periodType: rule.periodType,
      dailyCap: rule.dailyHoursCap,
      hoursUsedToday,
      dailyRemaining,
    },
    racing: {
      freeRacesTotal: rule.racingFreeRacesPerMonth,
      freeRacesUsed: racingRacesUsed,
      freeRacesRemaining,
      discountPct: rule.racingDiscountPct,
      priceAfterFree: 3 * (1 - rule.racingDiscountPct / 100),
      basePrice: 3,
    },
    tournaments: {
      fridayFreeTotal,
      fridayFreeUsed: fridayEntriesUsed,
      fridayFreeRemaining,
      fridayPriceAfterFree: rule.fridayMiniPriceAfterFree,
      otherDiscountPct: rule.otherTournamentDiscountPct,
      racingLeagueFreeTotal: rule.racingLeagueFreePerMonth,
      racingLeagueFreeUsed: racingLeagueUsed,
      racingLeagueFreeRemaining: Math.max(0, rule.racingLeagueFreePerMonth - racingLeagueUsed),
    },
    wifi: {
      minutesPerPeriod: rule.wifiMinutesPerPeriod,
      minutesUsed: wifiMinutesUsed,
      minutesRemaining: wifiMinutesRemaining,
      unlimitedInSession: rule.wifiUnlimitedInSession,
    },
    perks: {
      snackDiscountPct: rule.snackDiscountPct,
      chessClubIncluded: rule.chessClubIncluded,
      showOnLeaderboardWall: player.showOnLeaderboardWall,
      xpVisitBonus: rule.xpVisitBonus,
    },
  };
}
