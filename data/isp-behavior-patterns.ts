// ISP BEHAVIOR PATTERNS
// Classification: FOUNDER-EYES-ONLY
// Version: 3.2.1-MILITARY

/**
 * ISP behavior patterns for realistic network simulation
 */
export const ISPBehaviorPatterns = {
  // Time-of-day congestion patterns
  timeOfDayCongestion: {
    // Weekday patterns (0-6, where 0 is Sunday)
    weekday: [
      // Sunday
      {
        peakHours: [
          { start: 14, end: 22, factor: 1.5 }, // 2 PM - 10 PM
        ],
        offPeakHours: [
          { start: 2, end: 6, factor: 0.7 }, // 2 AM - 6 AM
        ],
      },
      // Monday
      {
        peakHours: [
          { start: 8, end: 10, factor: 1.8 }, // 8 AM - 10 AM
          { start: 17, end: 22, factor: 1.6 }, // 5 PM - 10 PM
        ],
        offPeakHours: [
          { start: 1, end: 5, factor: 0.6 }, // 1 AM - 5 AM
        ],
      },
      // Tuesday
      {
        peakHours: [
          { start: 8, end: 10, factor: 1.7 }, // 8 AM - 10 AM
          { start: 17, end: 22, factor: 1.5 }, // 5 PM - 10 PM
        ],
        offPeakHours: [
          { start: 1, end: 5, factor: 0.6 }, // 1 AM - 5 AM
        ],
      },
      // Wednesday
      {
        peakHours: [
          { start: 8, end: 10, factor: 1.7 }, // 8 AM - 10 AM
          { start: 17, end: 22, factor: 1.5 }, // 5 PM - 10 PM
        ],
        offPeakHours: [
          { start: 1, end: 5, factor: 0.6 }, // 1 AM - 5 AM
        ],
      },
      // Thursday
      {
        peakHours: [
          { start: 8, end: 10, factor: 1.7 }, // 8 AM - 10 AM
          { start: 17, end: 22, factor: 1.5 }, // 5 PM - 10 PM
        ],
        offPeakHours: [
          { start: 1, end: 5, factor: 0.6 }, // 1 AM - 5 AM
        ],
      },
      // Friday
      {
        peakHours: [
          { start: 8, end: 10, factor: 1.6 }, // 8 AM - 10 AM
          { start: 17, end: 23, factor: 1.8 }, // 5 PM - 11 PM
        ],
        offPeakHours: [
          { start: 2, end: 6, factor: 0.7 }, // 2 AM - 6 AM
        ],
      },
      // Saturday
      {
        peakHours: [
          { start: 12, end: 23, factor: 1.7 }, // 12 PM - 11 PM
        ],
        offPeakHours: [
          { start: 2, end: 7, factor: 0.7 }, // 2 AM - 7 AM
        ],
      },
    ],
  },

  // NAT pool cycling patterns
  natPoolCycling: {
    // Residential ISPs typically cycle IP addresses every 24-72 hours
    residential: {
      minHours: 24,
      maxHours: 72,
      probability: 0.3, // 30% chance of IP change per cycle
    },
    // Mobile ISPs typically cycle IP addresses more frequently
    mobile: {
      minHours: 1,
      maxHours: 24,
      probability: 0.5, // 50% chance of IP change per cycle
    },
    // Datacenter IPs are more stable
    datacenter: {
      minHours: 168, // 7 days
      maxHours: 720, // 30 days
      probability: 0.1, // 10% chance of IP change per cycle
    },
  },

  // TTL signatures by ISP type
  ttlSignatures: {
    residential: {
      windows: 128,
      macos: 64,
      linux: 64,
      mobile: 64,
    },
    mobile: {
      android: 64,
      ios: 64,
    },
    datacenter: {
      aws: 240,
      azure: 128,
      gcp: 64,
      digitalocean: 64,
    },
  },

  // Header order by browser and ISP
  headerOrder: {
    chrome: [
      ["host", "connection", "user-agent", "accept", "accept-language", "accept-encoding"],
      ["host", "user-agent", "accept", "accept-language", "accept-encoding", "connection"],
    ],
    firefox: [
      ["host", "user-agent", "accept", "accept-language", "accept-encoding", "connection"],
      ["host", "connection", "user-agent", "accept", "accept-language", "accept-encoding"],
    ],
    safari: [
      ["host", "accept", "accept-language", "accept-encoding", "connection", "user-agent"],
      ["host", "connection", "accept", "user-agent", "accept-language", "accept-encoding"],
    ],
    edge: [
      ["host", "connection", "user-agent", "accept", "accept-language", "accept-encoding"],
      ["host", "user-agent", "accept", "accept-language", "accept-encoding", "connection"],
    ],
  },
}
