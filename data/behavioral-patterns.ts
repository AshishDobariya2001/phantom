// BEHAVIORAL PATTERNS
// Classification: FOUNDER-EYES-ONLY
// Version: 3.2.1-MILITARY

import type { BehavioralProfile } from "../types/proxy-types"

/**
 * Behavioral patterns for realistic user simulation
 */
export const BehavioralPatterns: Record<string, BehavioralProfile> = {
  // Human patterns
  "human-casual": {
    type: "HUMAN",
    actionDelay: [300, 2000], // 300ms - 2s between actions
    idleTimeout: [30000, 120000], // 30s - 2m idle time
    scrollJitter: [10, 50], // 10-50px scroll jitter
    submitDelay: [800, 3000], // 800ms - 3s before form submission
  },

  "human-fast": {
    type: "HUMAN",
    actionDelay: [100, 800], // 100-800ms between actions
    idleTimeout: [15000, 60000], // 15s - 1m idle time
    scrollJitter: [5, 30], // 5-30px scroll jitter
    submitDelay: [500, 1500], // 500ms - 1.5s before form submission
  },

  "human-slow": {
    type: "HUMAN",
    actionDelay: [1000, 5000], // 1-5s between actions
    idleTimeout: [60000, 300000], // 1-5m idle time
    scrollJitter: [15, 80], // 15-80px scroll jitter
    submitDelay: [2000, 8000], // 2-8s before form submission
  },

  // Corporate patterns
  "corporate-standard": {
    type: "CORPORATE",
    actionDelay: [200, 1000], // 200ms - 1s between actions
    idleTimeout: [60000, 180000], // 1-3m idle time
    scrollJitter: [5, 20], // 5-20px scroll jitter
    submitDelay: [500, 2000], // 500ms - 2s before form submission
  },

  "corporate-automated": {
    type: "CORPORATE",
    actionDelay: [50, 300], // 50-300ms between actions
    idleTimeout: [10000, 30000], // 10-30s idle time
    scrollJitter: [2, 10], // 2-10px scroll jitter
    submitDelay: [300, 800], // 300-800ms before form submission
  },

  // Bot patterns (for decoy traffic)
  "bot-aggressive": {
    type: "BOT",
    actionDelay: [10, 100], // 10-100ms between actions
    idleTimeout: [1000, 5000], // 1-5s idle time
    scrollJitter: [0, 2], // 0-2px scroll jitter
    submitDelay: [50, 200], // 50-200ms before form submission
  },

  "bot-stealth": {
    type: "BOT",
    actionDelay: [200, 1500], // 200ms - 1.5s between actions
    idleTimeout: [20000, 90000], // 20-90s idle time
    scrollJitter: [8, 40], // 8-40px scroll jitter
    submitDelay: [700, 2500], // 700ms - 2.5s before form submission
  },
}

/**
 * Get a behavioral pattern based on profile name or generate a random one
 */
export function getBehavioralPattern(profile?: string): BehavioralProfile {
  if (profile && BehavioralPatterns[profile]) {
    return BehavioralPatterns[profile]
  }

  // Generate a random human-like profile
  const profiles = Object.values(BehavioralPatterns).filter((p) => p.type === "HUMAN")
  return profiles[Math.floor(Math.random() * profiles.length)]
}

/**
 * Generate a behavioral pattern that mimics a specific user type
 */
export function generateBehavioralPattern(
  type: "HUMAN" | "CORPORATE" | "BOT",
  speed: "SLOW" | "NORMAL" | "FAST" = "NORMAL",
): BehavioralProfile {
  let actionDelayBase: [number, number]
  let idleTimeoutBase: [number, number]
  let scrollJitterBase: [number, number]
  let submitDelayBase: [number, number]

  // Set base values based on type
  switch (type) {
    case "HUMAN":
      actionDelayBase = [300, 2000]
      idleTimeoutBase = [30000, 120000]
      scrollJitterBase = [10, 50]
      submitDelayBase = [800, 3000]
      break

    case "CORPORATE":
      actionDelayBase = [200, 1000]
      idleTimeoutBase = [60000, 180000]
      scrollJitterBase = [5, 20]
      submitDelayBase = [500, 2000]
      break

    case "BOT":
      actionDelayBase = [50, 300]
      idleTimeoutBase = [5000, 20000]
      scrollJitterBase = [2, 10]
      submitDelayBase = [100, 500]
      break
  }

  // Adjust based on speed
  let speedMultiplier: number

  switch (speed) {
    case "SLOW":
      speedMultiplier = 2.0
      break

    case "FAST":
      speedMultiplier = 0.5
      break

    default:
      speedMultiplier = 1.0
  }

  // Apply speed multiplier
  const actionDelay: [number, number] = [
    Math.round(actionDelayBase[0] * speedMultiplier),
    Math.round(actionDelayBase[1] * speedMultiplier),
  ]

  const idleTimeout: [number, number] = [
    Math.round(idleTimeoutBase[0] * speedMultiplier),
    Math.round(idleTimeoutBase[1] * speedMultiplier),
  ]

  const scrollJitter: [number, number] = scrollJitterBase

  const submitDelay: [number, number] = [
    Math.round(submitDelayBase[0] * speedMultiplier),
    Math.round(submitDelayBase[1] * speedMultiplier),
  ]

  return {
    type,
    actionDelay,
    idleTimeout,
    scrollJitter,
    submitDelay,
  }
}
