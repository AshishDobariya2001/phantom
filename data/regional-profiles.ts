// REGIONAL ISP PROFILES
// Classification: FOUNDER-EYES-ONLY
// Version: 3.2.1-MILITARY

import type { ISPProfile } from "../types/proxy-types"

/**
 * Regional ISP profiles for realistic network behavior simulation
 */
export const RegionalProfiles: Record<string, ISPProfile[]> = {
  // North America - East
  "na-east": [
    {
      name: "comcast-east",
      region: "na-east",
      latencyBase: 35,
      latencyJitter: 15,
      packetLossRate: 0.002,
      bandwidthKbps: 150000,
      timeOfDayCongestion: true,
      useCacheBusters: true,
      headerOrder: ["host", "connection", "user-agent", "accept", "accept-language", "accept-encoding"],
    },
    {
      name: "verizon-fios",
      region: "na-east",
      latencyBase: 25,
      latencyJitter: 8,
      packetLossRate: 0.001,
      bandwidthKbps: 300000,
      timeOfDayCongestion: true,
      useCacheBusters: true,
      headerOrder: ["host", "user-agent", "accept", "accept-language", "accept-encoding", "connection"],
    },
    {
      name: "spectrum-east",
      region: "na-east",
      latencyBase: 40,
      latencyJitter: 20,
      packetLossRate: 0.003,
      bandwidthKbps: 100000,
      timeOfDayCongestion: true,
      useCacheBusters: false,
      headerOrder: [
        "host",
        "connection",
        "cache-control",
        "user-agent",
        "accept",
        "accept-language",
        "accept-encoding",
      ],
    },
  ],

  // North America - West
  "na-west": [
    {
      name: "comcast-west",
      region: "na-west",
      latencyBase: 45,
      latencyJitter: 18,
      packetLossRate: 0.0025,
      bandwidthKbps: 120000,
      timeOfDayCongestion: true,
      useCacheBusters: true,
      headerOrder: ["host", "connection", "user-agent", "accept", "accept-language", "accept-encoding"],
    },
    {
      name: "cox-communications",
      region: "na-west",
      latencyBase: 38,
      latencyJitter: 12,
      packetLossRate: 0.002,
      bandwidthKbps: 200000,
      timeOfDayCongestion: true,
      useCacheBusters: true,
      headerOrder: ["host", "user-agent", "accept", "accept-language", "accept-encoding", "connection"],
    },
  ],

  // Europe - Central
  "eu-central": [
    {
      name: "deutsche-telekom",
      region: "eu-central",
      latencyBase: 30,
      latencyJitter: 10,
      packetLossRate: 0.001,
      bandwidthKbps: 250000,
      timeOfDayCongestion: true,
      useCacheBusters: true,
      headerOrder: ["host", "user-agent", "accept", "accept-language", "accept-encoding", "connection"],
    },
    {
      name: "orange-france",
      region: "eu-central",
      latencyBase: 35,
      latencyJitter: 15,
      packetLossRate: 0.0015,
      bandwidthKbps: 200000,
      timeOfDayCongestion: true,
      useCacheBusters: true,
      headerOrder: ["host", "connection", "user-agent", "accept", "accept-language", "accept-encoding"],
    },
  ],

  // Asia Pacific - Southeast
  "ap-southeast": [
    {
      name: "singtel",
      region: "ap-southeast",
      latencyBase: 50,
      latencyJitter: 25,
      packetLossRate: 0.003,
      bandwidthKbps: 100000,
      timeOfDayCongestion: true,
      useCacheBusters: false,
      headerOrder: ["host", "connection", "user-agent", "accept", "accept-language", "accept-encoding"],
    },
    {
      name: "telstra-australia",
      region: "ap-southeast",
      latencyBase: 60,
      latencyJitter: 30,
      packetLossRate: 0.004,
      bandwidthKbps: 80000,
      timeOfDayCongestion: true,
      useCacheBusters: true,
      headerOrder: ["host", "user-agent", "accept", "accept-language", "accept-encoding", "connection"],
    },
  ],

  // South America - East
  "sa-east": [
    {
      name: "claro-brazil",
      region: "sa-east",
      latencyBase: 70,
      latencyJitter: 35,
      packetLossRate: 0.005,
      bandwidthKbps: 50000,
      timeOfDayCongestion: true,
      useCacheBusters: false,
      headerOrder: ["host", "connection", "user-agent", "accept", "accept-language", "accept-encoding"],
    },
    {
      name: "telefonica-argentina",
      region: "sa-east",
      latencyBase: 75,
      latencyJitter: 40,
      packetLossRate: 0.006,
      bandwidthKbps: 40000,
      timeOfDayCongestion: true,
      useCacheBusters: true,
      headerOrder: ["host", "user-agent", "accept", "accept-language", "accept-encoding", "connection"],
    },
  ],

  // Global (fallback)
  global: [
    {
      name: "generic-isp",
      region: "global",
      latencyBase: 50,
      latencyJitter: 20,
      packetLossRate: 0.003,
      bandwidthKbps: 100000,
      timeOfDayCongestion: false,
      useCacheBusters: true,
      headerOrder: ["host", "user-agent", "accept", "accept-language", "accept-encoding", "connection"],
    },
  ],
}
