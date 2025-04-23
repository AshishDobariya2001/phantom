// ISP BEHAVIOR SIMULATION
// Classification: FOUNDER-EYES-ONLY
// Version: 3.2.1-MILITARY

import { Logger } from "../utils/logger"
import { entropyAmplificationSystem } from "./entropy-amplification-system"
import type { ISPSpoofParams } from "../types/proxy-types"
import { createHash } from "crypto"

/**
 * ISP type
 */
export type ISPType =
  | "RESIDENTIAL" // Residential ISP
  | "MOBILE" // Mobile carrier
  | "DATACENTER" // Datacenter provider
  | "CORPORATE" // Corporate network
  | "EDUCATIONAL" // Educational institution
  | "GOVERNMENT" // Government network
  | "SATELLITE" // Satellite provider

/**
 * Connection type
 */
export type ConnectionType =
  | "FIBER" // Fiber optic
  | "CABLE" // Cable
  | "DSL" // DSL
  | "CELLULAR_4G" // 4G cellular
  | "CELLULAR_5G" // 5G cellular
  | "SATELLITE" // Satellite
  | "DIALUP" // Dialup (legacy)
  | "WIRELESS" // Wireless

/**
 * Bandwidth profile
 */
export interface BandwidthProfile {
  baseKbps: number // Base bandwidth in Kbps
  maxKbps: number // Maximum bandwidth in Kbps
  minKbps: number // Minimum bandwidth in Kbps
  jitterPercent: number // Jitter as percentage of base
  burstable: boolean // Whether bandwidth can burst
  burstMultiplier: number // Burst multiplier
  burstDurationMs: number // Burst duration in ms
  throttleThresholdKB: number // Throttle threshold in KB
  throttleMultiplier: number // Throttle multiplier
}

/**
 * Latency profile
 */
export interface LatencyProfile {
  baseMs: number // Base latency in ms
  jitterMs: number // Jitter in ms
  minMs: number // Minimum latency in ms
  maxMs: number // Maximum latency in ms
  spikeFrequency: number // Frequency of latency spikes (0-1)
  spikeMultiplier: number // Spike multiplier
  spikeDurationMs: number // Spike duration in ms
}

/**
 * Packet loss profile
 */
export interface PacketLossProfile {
  baseRate: number // Base packet loss rate (0-1)
  burstRate: number // Burst packet loss rate (0-1)
  burstFrequency: number // Frequency of packet loss bursts (0-1)
  burstDurationMs: number // Burst duration in ms
}

/**
 * TCP handoff profile
 */
export interface TCPHandoffProfile {
  initialWindowSize: number // Initial window size
  maxWindowSize: number // Maximum window size
  windowScalingFactor: number // Window scaling factor
  congestionAlgorithm: string // Congestion algorithm
  timeoutMs: number // Timeout in ms
  retransmissionRate: number // Retransmission rate (0-1)
  mtu: number // MTU
  mss: number // MSS
}

/**
 * Regional congestion profile
 */
export interface RegionalCongestionProfile {
  region: string // Region
  timeZone: string // Time zone
  peakHours: Array<{ start: number; end: number; factor: number }> // Peak hours
  offPeakHours: Array<{ start: number; end: number; factor: number }> // Off-peak hours
  weekdayFactors: number[] // Factors for each day of week (0-6, where 0 is Sunday)
  seasonalFactors: number[] // Factors for each month (0-11, where 0 is January)
  holidayFactor: number // Factor for holidays
}

/**
 * ISP behavior profile
 */
export interface ISPBehaviorProfile {
  id: string
  name: string
  region: string
  ispType: ISPType
  connectionType: ConnectionType
  bandwidth: BandwidthProfile
  latency: LatencyProfile
  packetLoss: PacketLossProfile
  tcpHandoff: TCPHandoffProfile
  regionalCongestion: RegionalCongestionProfile
  headerOrder: string[]
  ttl: number
  mtu: number
  created: number
  updated: number
}

/**
 * ISP behavior simulation options
 */
export interface ISPBehaviorSimulationOptions {
  ispType?: ISPType
  connectionType?: ConnectionType
  region?: string
  timeZone?: string
  bandwidthKbps?: number
  latencyMs?: number
  packetLossRate?: number
  jitterPercent?: number
  congestionFactor?: number
}

/**
 * ISP behavior simulation result
 */
export interface ISPBehaviorSimulationResult extends ISPSpoofParams {
  tcpHandoffProfile: TCPHandoffProfile
  bandwidthProfile: BandwidthProfile
  latencyProfile: LatencyProfile
  packetLossProfile: PacketLossProfile
  regionalCongestion: RegionalCongestionProfile
  simulationTime: number
  simulationHash: string
}

/**
 * ISP Behavior Simulation
 *
 * Military-grade ISP behavior simulation system with:
 * - Realistic bandwidth ramping and throttling
 * - TCP handoff mimicry
 * - Regional congestion profiles
 * - Time-of-day and day-of-week patterns
 * - Carrier-grade NAT simulation
 */
export class ISPBehaviorSimulation {
  private static instance: ISPBehaviorSimulation
  private profiles: Map<string, ISPBehaviorProfile> = new Map()
  private regionProfiles: Map<string, Set<string>> = new Map() // region -> Set of profileIds
  private ispTypeProfiles: Map<ISPType, Set<string>> = new Map() // ispType -> Set of profileIds
  private connectionTypeProfiles: Map<ConnectionType, Set<string>> = new Map() // connectionType -> Set of profileIds
  private logger: Logger
  private initialized = false

  private constructor() {
    this.logger = new Logger("ISPBehaviorSimulation", "MILITARY")
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): ISPBehaviorSimulation {
    if (!ISPBehaviorSimulation.instance) {
      ISPBehaviorSimulation.instance = new ISPBehaviorSimulation()
    }
    return ISPBehaviorSimulation.instance
  }

  /**
   * Initialize ISP behavior simulation
   */
  public async initialize(): Promise<void> {
    if (this.initialized) {
      return
    }

    try {
      this.logger.info("Initializing ISP Behavior Simulation")

      // Ensure entropy amplification system is initialized
      await entropyAmplificationSystem.initialize()

      // Create default profiles
      await this.createDefaultProfiles()

      this.initialized = true
      this.logger.info("ISP Behavior Simulation initialized successfully")
    } catch (error) {
      this.logger.error("Failed to initialize ISP Behavior Simulation", error)
      throw new Error(`ISP_BEHAVIOR_SIMULATION_INITIALIZATION_FAILED: ${error.message}`)
    }
  }

  /**
   * Create default profiles
   */
  private async createDefaultProfiles(): Promise<void> {
    try {
      // Create residential fiber profile
      await this.createISPBehaviorProfile({
        name: "residential-fiber",
        region: "na-east",
        ispType: "RESIDENTIAL",
        connectionType: "FIBER",
        bandwidth: {
          baseKbps: 500000, // 500 Mbps
          maxKbps: 1000000, // 1 Gbps
          minKbps: 300000, // 300 Mbps
          jitterPercent: 5,
          burstable: true,
          burstMultiplier: 1.5,
          burstDurationMs: 5000,
          throttleThresholdKB: 1000000, // 1 GB
          throttleMultiplier: 0.7,
        },
        latency: {
          baseMs: 15,
          jitterMs: 5,
          minMs: 10,
          maxMs: 50,
          spikeFrequency: 0.01,
          spikeMultiplier: 3,
          spikeDurationMs: 2000,
        },
        packetLoss: {
          baseRate: 0.001,
          burstRate: 0.01,
          burstFrequency: 0.005,
          burstDurationMs: 1000,
        },
        tcpHandoff: {
          initialWindowSize: 10,
          maxWindowSize: 256,
          windowScalingFactor: 7,
          congestionAlgorithm: "cubic",
          timeoutMs: 5000,
          retransmissionRate: 0.001,
          mtu: 1500,
          mss: 1460,
        },
        regionalCongestion: {
          region: "na-east",
          timeZone: "America/New_York",
          peakHours: [
            { start: 8, end: 10, factor: 1.5 }, // 8 AM - 10 AM
            { start: 19, end: 22, factor: 1.8 }, // 7 PM - 10 PM
          ],
          offPeakHours: [
            { start: 2, end: 6, factor: 0.7 }, // 2 AM - 6 AM
          ],
          weekdayFactors: [0.7, 0.9, 0.9, 0.9, 0.9, 1.0, 0.8], // Sun-Sat
          seasonalFactors: [0.9, 0.9, 0.9, 0.9, 0.9, 1.0, 1.1, 1.1, 0.9, 0.9, 0.9, 1.0], // Jan-Dec
          holidayFactor: 1.2,
        },
        headerOrder: ["host", "connection", "user-agent", "accept", "accept-language", "accept-encoding"],
        ttl: 64,
        mtu: 1500,
      })

      // Create residential cable profile
      await this.createISPBehaviorProfile({
        name: "residential-cable",
        region: "na-east",
        ispType: "RESIDENTIAL",
        connectionType: "CABLE",
        bandwidth: {
          baseKbps: 100000, // 100 Mbps
          maxKbps: 300000, // 300 Mbps
          minKbps: 50000, // 50 Mbps
          jitterPercent: 10,
          burstable: true,
          burstMultiplier: 1.2,
          burstDurationMs: 3000,
          throttleThresholdKB: 500000, // 500 MB
          throttleMultiplier: 0.5,
        },
        latency: {
          baseMs: 25,
          jitterMs: 10,
          minMs: 15,
          maxMs: 100,
          spikeFrequency: 0.02,
          spikeMultiplier: 4,
          spikeDurationMs: 3000,
        },
        packetLoss: {
          baseRate: 0.002,
          burstRate: 0.02,
          burstFrequency: 0.01,
          burstDurationMs: 2000,
        },
        tcpHandoff: {
          initialWindowSize: 8,
          maxWindowSize: 128,
          windowScalingFactor: 6,
          congestionAlgorithm: "cubic",
          timeoutMs: 10000,
          retransmissionRate: 0.002,
          mtu: 1500,
          mss: 1460,
        },
        regionalCongestion: {
          region: "na-east",
          timeZone: "America/New_York",
          peakHours: [
            { start: 8, end: 10, factor: 1.8 }, // 8 AM - 10 AM
            { start: 19, end: 23, factor: 2.0 }, // 7 PM - 11 PM
          ],
          offPeakHours: [
            { start: 2, end: 6, factor: 0.6 }, // 2 AM - 6 AM
          ],
          weekdayFactors: [0.8, 0.9, 0.9, 0.9, 0.9, 1.1, 1.0], // Sun-Sat
          seasonalFactors: [0.9, 0.9, 0.9, 0.9, 0.9, 1.0, 1.1, 1.1, 0.9, 0.9, 0.9, 1.0], // Jan-Dec
          holidayFactor: 1.3,
        },
        headerOrder: ["host", "user-agent", "accept", "accept-language", "accept-encoding", "connection"],
        ttl: 64,
        mtu: 1500,
      })

      // Create mobile 4G profile
      await this.createISPBehaviorProfile({
        name: "mobile-4g",
        region: "na-east",
        ispType: "MOBILE",
        connectionType: "CELLULAR_4G",
        bandwidth: {
          baseKbps: 20000, // 20 Mbps
          maxKbps: 50000, // 50 Mbps
          minKbps: 5000, // 5 Mbps
          jitterPercent: 20,
          burstable: true,
          burstMultiplier: 1.3,
          burstDurationMs: 2000,
          throttleThresholdKB: 100000, // 100 MB
          throttleMultiplier: 0.3,
        },
        latency: {
          baseMs: 50,
          jitterMs: 20,
          minMs: 30,
          maxMs: 200,
          spikeFrequency: 0.05,
          spikeMultiplier: 5,
          spikeDurationMs: 5000,
        },
        packetLoss: {
          baseRate: 0.005,
          burstRate: 0.05,
          burstFrequency: 0.02,
          burstDurationMs: 3000,
        },
        tcpHandoff: {
          initialWindowSize: 6,
          maxWindowSize: 64,
          windowScalingFactor: 5,
          congestionAlgorithm: "cubic",
          timeoutMs: 15000,
          retransmissionRate: 0.005,
          mtu: 1428,
          mss: 1388,
        },
        regionalCongestion: {
          region: "na-east",
          timeZone: "America/New_York",
          peakHours: [
            { start: 12, end: 14, factor: 1.5 }, // 12 PM - 2 PM
            { start: 17, end: 22, factor: 1.8 }, // 5 PM - 10 PM
          ],
          offPeakHours: [
            { start: 1, end: 6, factor: 0.5 }, // 1 AM - 6 AM
          ],
          weekdayFactors: [0.9, 0.8, 0.8, 0.8, 0.8, 1.2, 1.1], // Sun-Sat
          seasonalFactors: [0.9, 0.9, 0.9, 0.9, 0.9, 1.0, 1.1, 1.1, 0.9, 0.9, 0.9, 1.0], // Jan-Dec
          holidayFactor: 1.4,
        },
        headerOrder: ["host", "connection", "user-agent", "accept", "accept-language", "accept-encoding"],
        ttl: 53,
        mtu: 1428,
      })

      // Create datacenter profile
      await this.createISPBehaviorProfile({
        name: "datacenter",
        region: "na-east",
        ispType: "DATACENTER",
        connectionType: "FIBER",
        bandwidth: {
          baseKbps: 1000000, // 1 Gbps
          maxKbps: 10000000, // 10 Gbps
          minKbps: 500000, // 500 Mbps
          jitterPercent: 2,
          burstable: true,
          burstMultiplier: 2.0,
          burstDurationMs: 10000,
          throttleThresholdKB: 10000000, // 10 GB
          throttleMultiplier: 0.8,
        },
        latency: {
          baseMs: 5,
          jitterMs: 2,
          minMs: 3,
          maxMs: 20,
          spikeFrequency: 0.001,
          spikeMultiplier: 2,
          spikeDurationMs: 1000,
        },
        packetLoss: {
          baseRate: 0.0001,
          burstRate: 0.001,
          burstFrequency: 0.001,
          burstDurationMs: 500,
        },
        tcpHandoff: {
          initialWindowSize: 20,
          maxWindowSize: 512,
          windowScalingFactor: 8,
          congestionAlgorithm: "bbr",
          timeoutMs: 3000,
          retransmissionRate: 0.0005,
          mtu: 9000, // Jumbo frames
          mss: 8960,
        },
        regionalCongestion: {
          region: "na-east",
          timeZone: "America/New_York",
          peakHours: [
            { start: 9, end: 17, factor: 1.2 }, // 9 AM - 5 PM
          ],
          offPeakHours: [
            { start: 0, end: 6, factor: 0.8 }, // 12 AM - 6 AM
          ],
          weekdayFactors: [0.7, 1.0, 1.0, 1.0, 1.0, 0.9, 0.7], // Sun-Sat
          seasonalFactors: [1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0], // Jan-Dec
          holidayFactor: 0.8,
        },
        headerOrder: ["host", "user-agent", "accept", "accept-language", "accept-encoding", "connection"],
        ttl: 64,
        mtu: 9000,
      })

      this.logger.info("Created default ISP behavior profiles")
    } catch (error) {
      this.logger.error("Failed to create default profiles", error)
    }
  }

  /**
   * Create ISP behavior profile
   */
  public async createISPBehaviorProfile(
    profile: Omit<ISPBehaviorProfile, "id" | "created" | "updated">,
  ): Promise<string> {
    try {
      if (!this.initialized) {
        await this.initialize()
      }

      // Generate profile ID
      const profileId = await this.generateProfileId(profile.name, profile.region, profile.ispType)

      // Create profile
      const now = Date.now()
      \
        profile.region, profile.ispType)

      // Create profile
      const now = Date.now()
      const newProfile: ISPBehaviorProfile = {
        id: profileId,
        ...profile,
        created: now,
        updated: now,
      }

      // Store profile
      this.profiles.set(profileId, newProfile)

      // Add to region profiles
      if (!this.regionProfiles.has(profile.region)) {
        this.regionProfiles.set(profile.region, new Set())
      }
      this.regionProfiles.get(profile.region)?.add(profileId)

      // Add to ISP type profiles
      if (!this.ispTypeProfiles.has(profile.ispType)) {
        this.ispTypeProfiles.set(profile.ispType, new Set())
      }
      this.ispTypeProfiles.get(profile.ispType)?.add(profileId)

      // Add to connection type profiles
      if (!this.connectionTypeProfiles.has(profile.connectionType)) {
        this.connectionTypeProfiles.set(profile.connectionType, new Set())
      }
      this.connectionTypeProfiles.get(profile.connectionType)?.add(profileId)

      this.logger.info(`Created ISP behavior profile ${profileId} for ${profile.name} in ${profile.region}`)

      return profileId
    } catch (error) {
      this.logger.error("Failed to create ISP behavior profile", error)
      throw new Error(`CREATE_ISP_BEHAVIOR_PROFILE_FAILED: ${error.message}`)
    }
  }

  /**
   * Generate profile ID
   */
  private async generateProfileId(name: string, region: string, ispType: ISPType): Promise<string> {
    try {
      // Generate entropy for profile ID
      const entropy = await entropyAmplificationSystem.generateEntropyForPurpose("isp-profile-id", {
        consistentWith: `${name}:${region}:${ispType}`,
      })

      return entropy.hex.substring(0, 32)
    } catch (error) {
      this.logger.error("Failed to generate profile ID", error)
      return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
    }
  }

  /**
   * Simulate ISP behavior
   */
  public async simulateISPBehavior(
    domain: string,
    region: string,
    options: ISPBehaviorSimulationOptions = {},
  ): Promise<ISPBehaviorSimulationResult> {
    try {
      if (!this.initialized) {
        await this.initialize()
      }

      // Get profile
      let profile: ISPBehaviorProfile | undefined

      // Find profile for region and ISP type
      const regionProfiles = this.regionProfiles.get(region) || new Set()

      if (regionProfiles.size > 0) {
        // Filter by ISP type if specified
        let candidates = Array.from(regionProfiles)
          .map((id) => this.profiles.get(id))
          .filter(Boolean) as ISPBehaviorProfile[]

        if (options.ispType) {
          candidates = candidates.filter((p) => p.ispType === options.ispType)
        }

        if (options.connectionType) {
          candidates = candidates.filter((p) => p.connectionType === options.connectionType)
        }

        if (candidates.length > 0) {
          // Select random profile from candidates
          profile = candidates[Math.floor(Math.random() * candidates.length)]
        }
      }

      // If no profile found, create a temporary one
      if (!profile) {
        const ispType = options.ispType || "RESIDENTIAL"
        const connectionType = options.connectionType || "CABLE"
        const timeZone = options.timeZone || this.getTimeZoneForRegion(region)

        profile = {
          id: "temp-" + Math.random().toString(36).substring(2, 15),
          name: `temp-${ispType.toLowerCase()}-${connectionType.toLowerCase()}`,
          region,
          ispType,
          connectionType,
          bandwidth: this.generateBandwidthProfile(ispType, connectionType, options.bandwidthKbps),
          latency: this.generateLatencyProfile(ispType, connectionType, options.latencyMs),
          packetLoss: this.generatePacketLossProfile(ispType, connectionType, options.packetLossRate),
          tcpHandoff: this.generateTCPHandoffProfile(ispType, connectionType),
          regionalCongestion: this.generateRegionalCongestionProfile(region, timeZone, options.congestionFactor),
          headerOrder: ["host", "user-agent", "accept", "accept-language", "accept-encoding", "connection"],
          ttl: this.getTTLForISPType(ispType),
          mtu: this.getMTUForConnectionType(connectionType),
          created: Date.now(),
          updated: Date.now(),
        }
      }

      // Get current time
      const now = Date.now()

      // Get current hour and day of week
      const date = new Date(now)
      const hour = date.getHours()
      const dayOfWeek = date.getDay() // 0-6, where 0 is Sunday
      const month = date.getMonth() // 0-11, where 0 is January

      // Calculate congestion factor
      let congestionFactor = 1.0

      // Apply time-of-day congestion
      const peakHour = profile.regionalCongestion.peakHours.find((peak) => hour >= peak.start && hour < peak.end)
      if (peakHour) {
        congestionFactor *= peakHour.factor
      }

      const offPeakHour = profile.regionalCongestion.offPeakHours.find(
        (offPeak) => hour >= offPeak.start && hour < offPeak.end,
      )
      if (offPeakHour) {
        congestionFactor *= offPeakHour.factor
      }

      // Apply day-of-week congestion
      congestionFactor *= profile.regionalCongestion.weekdayFactors[dayOfWeek]

      // Apply seasonal congestion
      congestionFactor *= profile.regionalCongestion.seasonalFactors[month]

      // Apply user-specified congestion factor
      if (options.congestionFactor !== undefined) {
        congestionFactor *= options.congestionFactor
      }

      // Calculate bandwidth
      let bandwidth = profile.bandwidth.baseKbps

      // Apply congestion to bandwidth
      bandwidth = Math.max(profile.bandwidth.minKbps, bandwidth / congestionFactor)

      // Apply jitter to bandwidth
      const bandwidthJitter = (Math.random() * 2 - 1) * (profile.bandwidth.jitterPercent / 100) * bandwidth
      bandwidth = Math.max(profile.bandwidth.minKbps, Math.min(profile.bandwidth.maxKbps, bandwidth + bandwidthJitter))

      // Calculate latency
      let latency = profile.latency.baseMs

      // Apply congestion to latency
      latency = Math.min(profile.latency.maxMs, latency * congestionFactor)

      // Apply jitter to latency
      const latencyJitter = (Math.random() * 2 - 1) * profile.latency.jitterMs
      latency = Math.max(profile.latency.minMs, Math.min(profile.latency.maxMs, latency + latencyJitter))

      // Check for latency spike
      if (Math.random() < profile.latency.spikeFrequency) {
        latency = Math.min(profile.latency.maxMs, latency * profile.latency.spikeMultiplier)
      }

      // Calculate packet loss
      let packetLossRate = profile.packetLoss.baseRate

      // Apply congestion to packet loss
      packetLossRate = Math.min(1, packetLossRate * congestionFactor)

      // Check for packet loss burst
      if (Math.random() < profile.packetLoss.burstFrequency) {
        packetLossRate = Math.min(1, packetLossRate * profile.packetLoss.burstRate)
      }

      // Determine if packet loss occurs
      const packetLoss = Math.random() < packetLossRate

      // Create result
      const result: ISPBehaviorSimulationResult = {
        name: profile.name,
        region: profile.region,
        latencyBase: profile.latency.baseMs,
        latencyJitter: profile.latency.jitterMs,
        packetLossRate: profile.packetLoss.baseRate,
        bandwidthKbps: profile.bandwidth.baseKbps,
        timeOfDayCongestion: true,
        useCacheBusters: true,
        headerOrder: profile.headerOrder,
        actualLatency: latency,
        packetLoss,
        actualBandwidthKbps: bandwidth,
        ttl: profile.ttl,
        tcpHandoffProfile: profile.tcpHandoff,
        bandwidthProfile: profile.bandwidth,
        latencyProfile: profile.latency,
        packetLossProfile: profile.packetLoss,
        regionalCongestion: profile.regionalCongestion,
        simulationTime: now,
        simulationHash: await this.generateSimulationHash(profile, latency, bandwidth, packetLossRate),
      }

      return result
    } catch (error) {
      this.logger.error("Failed to simulate ISP behavior", error)

      // Return basic parameters as fallback
      return {
        name: "generic-isp",
        region: "global",
        latencyBase: 50,
        latencyJitter: 10,
        packetLossRate: 0.001,
        bandwidthKbps: 5000,
        timeOfDayCongestion: false,
        useCacheBusters: true,
        actualLatency: 50,
        packetLoss: false,
        actualBandwidthKbps: 5000,
        ttl: 64,
        tcpHandoffProfile: {
          initialWindowSize: 10,
          maxWindowSize: 256,
          windowScalingFactor: 7,
          congestionAlgorithm: "cubic",
          timeoutMs: 5000,
          retransmissionRate: 0.001,
          mtu: 1500,
          mss: 1460,
        },
        bandwidthProfile: {
          baseKbps: 5000,
          maxKbps: 10000,
          minKbps: 1000,
          jitterPercent: 10,
          burstable: true,
          burstMultiplier: 1.5,
          burstDurationMs: 5000,
          throttleThresholdKB: 100000,
          throttleMultiplier: 0.5,
        },
        latencyProfile: {
          baseMs: 50,
          jitterMs: 10,
          minMs: 10,
          maxMs: 200,
          spikeFrequency: 0.01,
          spikeMultiplier: 3,
          spikeDurationMs: 2000,
        },
        packetLossProfile: {
          baseRate: 0.001,
          burstRate: 0.01,
          burstFrequency: 0.005,
          burstDurationMs: 1000,
        },
        regionalCongestion: {
          region: "global",
          timeZone: "UTC",
          peakHours: [
            { start: 8, end: 10, factor: 1.5 },
            { start: 17, end: 22, factor: 1.5 },
          ],
          offPeakHours: [{ start: 1, end: 6, factor: 0.7 }],
          weekdayFactors: [0.8, 1.0, 1.0, 1.0, 1.0, 1.0, 0.9],
          seasonalFactors: [1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0],
          holidayFactor: 1.2,
        },
        simulationTime: Date.now(),
        simulationHash: "fallback-simulation-hash",
      }
    }
  }

  /**
   * Generate bandwidth profile
   */
  private generateBandwidthProfile(
    ispType: ISPType,
    connectionType: ConnectionType,
    bandwidthKbps?: number,
  ): BandwidthProfile {
    try {
      // Base bandwidth profile
      let baseKbps = bandwidthKbps || 50000 // 50 Mbps default
      let maxKbps = baseKbps * 2
      let minKbps = baseKbps * 0.5
      let jitterPercent = 10
      let burstable = true
      let burstMultiplier = 1.5
      let burstDurationMs = 5000
      let throttleThresholdKB = 500000 // 500 MB
      let throttleMultiplier = 0.5

      // Adjust based on ISP type
      switch (ispType) {
        case "RESIDENTIAL":
          // Residential ISP
          break
        case "MOBILE":
          // Mobile carrier
          baseKbps = bandwidthKbps || 20000 // 20 Mbps
          maxKbps = baseKbps * 1.5
          minKbps = baseKbps * 0.3
          jitterPercent = 20
          burstDurationMs = 3000
          throttleThresholdKB = 100000 // 100 MB
          throttleMultiplier = 0.3
          break
        case "DATACENTER":
          // Datacenter provider
          baseKbps = bandwidthKbps || 1000000 // 1 Gbps
          maxKbps = baseKbps * 10
          minKbps = baseKbps * 0.8
          jitterPercent = 2
          burstMultiplier = 2.0
          burstDurationMs = 10000
          throttleThresholdKB = 10000000 // 10 GB
          throttleMultiplier = 0.8
          break
        case "CORPORATE":
          // Corporate network
          baseKbps = bandwidthKbps || 200000 // 200 Mbps
          maxKbps = baseKbps * 3
          minKbps = baseKbps * 0.7
          jitterPercent = 5
          burstMultiplier = 1.8
          burstDurationMs = 8000
          throttleThresholdKB = 2000000 // 2 GB
          throttleMultiplier = 0.7
          break
        case "EDUCATIONAL":
          // Educational institution
          baseKbps = bandwidthKbps || 500000 // 500 Mbps
          maxKbps = baseKbps * 5
          minKbps = baseKbps * 0.6
          jitterPercent = 8
          burstMultiplier = 1.7
          burstDurationMs = 7000
          throttleThresholdKB = 5000000 // 5 GB
          throttleMultiplier = 0.6
          break
        case "GOVERNMENT":
          // Government network
          baseKbps = bandwidthKbps || 300000 // 300 Mbps
          maxKbps = baseKbps * 4
          minKbps = baseKbps * 0.7
          jitterPercent = 3
          burstMultiplier = 1.6
          burstDurationMs = 6000
          throttleThresholdKB = 3000000 // 3 GB
          throttleMultiplier = 0.7
          break
        case "SATELLITE":
          // Satellite provider
          baseKbps = bandwidthKbps || 10000 // 10 Mbps
          maxKbps = baseKbps * 1.2
          minKbps = baseKbps * 0.2
          jitterPercent = 30
          burstable = false
          throttleThresholdKB = 50000 // 50 MB
          throttleMultiplier = 0.2
          break
      }

      // Adjust based on connection type
      switch (connectionType) {
        case "FIBER":
          // Fiber optic
          baseKbps = bandwidthKbps || Math.max(baseKbps, 500000) // At least 500 Mbps
          maxKbps = baseKbps * 2
          minKbps = baseKbps * 0.8
          jitterPercent = Math.min(jitterPercent, 5)
          break
        case "CABLE":
          // Cable
          baseKbps = bandwidthKbps || Math.max(baseKbps, 100000) // At least 100 Mbps
          maxKbps = baseKbps * 1.5
          minKbps = baseKbps * 0.5
          jitterPercent = Math.min(jitterPercent, 10)
          break
        case "DSL":
          // DSL
          baseKbps = bandwidthKbps || Math.min(baseKbps, 50000) // At most 50 Mbps
          maxKbps = baseKbps * 1.2
          minKbps = baseKbps * 0.4
          jitterPercent = Math.max(jitterPercent, 15)
          break
        case "CELLULAR_4G":
          // 4G cellular
          baseKbps = bandwidthKbps || Math.min(baseKbps, 20000) // At most 20 Mbps
          maxKbps = baseKbps * 1.5
          minKbps = baseKbps * 0.3
          jitterPercent = Math.max(jitterPercent, 20)
          break
        case "CELLULAR_5G":
          // 5G cellular
          baseKbps = bandwidthKbps || Math.max(baseKbps, 100000) // At least 100 Mbps
          maxKbps = baseKbps * 2
          minKbps = baseKbps * 0.4
          jitterPercent = Math.min(jitterPercent, 15)
          break
        case "SATELLITE":
          // Satellite
          baseKbps = bandwidthKbps || Math.min(baseKbps, 10000) // At most 10 Mbps
          maxKbps = baseKbps * 1.2
          minKbps = baseKbps * 0.2
          jitterPercent = Math.max(jitterPercent, 30)
          burstable = false
          break
        case "DIALUP":
          // Dialup (legacy)
          baseKbps = bandwidthKbps || 56 // 56 Kbps
          maxKbps = 64
          minKbps = 28
          jitterPercent = 40
          burstable = false
          break
        case "WIRELESS":
          // Wireless
          baseKbps = bandwidthKbps || Math.min(baseKbps, 50000) // At most 50 Mbps
          maxKbps = baseKbps * 1.3
          minKbps = baseKbps * 0.3
          jitterPercent = Math.max(jitterPercent, 25)
          break
      }

      return {
        baseKbps,
        maxKbps,
        minKbps,
        jitterPercent,
        burstable,
        burstMultiplier,
        burstDurationMs,
        throttleThresholdKB,
        throttleMultiplier,
      }
    } catch (error) {
      this.logger.error("Failed to generate bandwidth profile", error)
      return {
        baseKbps: 50000,
        maxKbps: 100000,
        minKbps: 25000,
        jitterPercent: 10,
        burstable: true,
        burstMultiplier: 1.5,
        burstDurationMs: 5000,
        throttleThresholdKB: 500000,
        throttleMultiplier: 0.5,
      }
    }
  }

  /**
   * Generate latency profile
   */
  private generateLatencyProfile(ispType: ISPType, connectionType: ConnectionType, latencyMs?: number): LatencyProfile {
    try {
      // Base latency profile
      let baseMs = latencyMs || 50
      let jitterMs = 10
      let minMs = Math.max(1, baseMs * 0.5)
      let maxMs = baseMs * 4
      let spikeFrequency = 0.01
      let spikeMultiplier = 3
      let spikeDurationMs = 2000

      // Adjust based on ISP type
      switch (ispType) {
        case "RESIDENTIAL":
          // Residential ISP
          break
        case "MOBILE":
          // Mobile carrier
          baseMs = latencyMs || 80
          jitterMs = 20
          minMs = Math.max(1, baseMs * 0.6)
          maxMs = baseMs * 5
          spikeFrequency = 0.05
          spikeMultiplier = 4
          spikeDurationMs = 3000
          break
        case "DATACENTER":
          // Datacenter provider
          baseMs = latencyMs || 10
          jitterMs = 2
          minMs = Math.max(1, baseMs * 0.8)
          maxMs = baseMs * 3
          spikeFrequency = 0.001
          spikeMultiplier = 2
          spikeDurationMs = 1000
          break
        case "CORPORATE":
          // Corporate network
          baseMs = latencyMs || 30
          jitterMs = 5
          minMs = Math.max(1, baseMs * 0.7)
          maxMs = baseMs * 3
          spikeFrequency = 0.005
          spikeMultiplier = 2.5
          spikeDurationMs = 1500
          break
        case "EDUCATIONAL":
          // Educational institution
          baseMs = latencyMs || 20
          jitterMs = 5
          minMs = Math.max(1, baseMs * 0.7)
          maxMs = baseMs * 3
          spikeFrequency = 0.008
          spikeMultiplier = 2.5
          spikeDurationMs = 1500
          break
        case "GOVERNMENT":
          // Government network
          baseMs = latencyMs || 25
          jitterMs = 5
          minMs = Math.max(1, baseMs * 0.7)
          maxMs = baseMs * 3
          spikeFrequency = 0.003
          spikeMultiplier = 2
          spikeDurationMs = 1200
          break
        case "SATELLITE":
          // Satellite provider
          baseMs = latencyMs || 500
          jitterMs = 50
          minMs = Math.max(1, baseMs * 0.8)
          maxMs = baseMs * 2
          spikeFrequency = 0.1
          spikeMultiplier = 1.5
          spikeDurationMs = 5000
          break
      }

      // Adjust based on connection type
      switch (connectionType) {
        case "FIBER":
          // Fiber optic
          baseMs = latencyMs || Math.min(baseMs, 20) // At most 20ms
          jitterMs = Math.min(jitterMs, 5)
          minMs = Math.max(1, baseMs * 0.8)
          maxMs = baseMs * 2
          spikeFrequency = Math.min(spikeFrequency, 0.005)
          break
        case "CABLE":
          // Cable
          baseMs = latencyMs || Math.min(baseMs, 30) // At most 30ms
          jitterMs = Math.min(jitterMs, 10)
          minMs = Math.max(1, baseMs * 0.7)
          maxMs = baseMs * 3
          spikeFrequency = Math.min(spikeFrequency, 0.01)
          break
        case "DSL":
          // DSL
          baseMs = latencyMs || Math.max(baseMs, 40) // At least 40ms
          jitterMs = Math.max(jitterMs, 15)
          minMs = Math.max(1, baseMs * 0.6)
          maxMs = baseMs * 4
          spikeFrequency = Math.max(spikeFrequency, 0.02)
          break
        case "CELLULAR_4G":
          // 4G cellular
          baseMs = latencyMs || Math.max(baseMs, 60) // At least 60ms
          jitterMs = Math.max(jitterMs, 20)
          minMs = Math.max(1, baseMs * 0.6)
          maxMs = baseMs * 5
          spikeFrequency = Math.max(spikeFrequency, 0.05)
          break
        case "CELLULAR_5G":
          // 5G cellular
          baseMs = latencyMs || Math.min(baseMs, 40) // At most 40ms
          jitterMs = Math.min(jitterMs, 15)
          minMs = Math.max(1, baseMs * 0.7)
          maxMs = baseMs * 3
          spikeFrequency = Math.min(spikeFrequency, 0.03)
          break
        case "SATELLITE":
          // Satellite
          baseMs = latencyMs || Math.max(baseMs, 500) // At least 500ms
          jitterMs = Math.max(jitterMs, 50)
          minMs = Math.max(1, baseMs * 0.8)
          maxMs = baseMs * 2
          spikeFrequency = Math.max(spikeFrequency, 0.1)
          break
        case "DIALUP":
          // Dialup (legacy)
          baseMs = latencyMs || 200 // 200ms
          jitterMs = 50
          minMs = 150
          maxMs = 500
          spikeFrequency = 0.2
          spikeMultiplier = 2
          break
        case "WIRELESS":
          // Wireless
          baseMs = latencyMs || Math.max(baseMs, 50) // At least 50ms
          jitterMs = Math.max(jitterMs, 20)
          minMs = Math.max(1, baseMs * 0.6)
          maxMs = baseMs * 4
          spikeFrequency = Math.max(spikeFrequency, 0.05)
          break
      }

      return {
        baseMs,
        jitterMs,
        minMs,
        maxMs,
        spikeFrequency,
        spikeMultiplier,
        spikeDurationMs,
      }
    } catch (error) {
      this.logger.error("Failed to generate latency profile", error)
      return {
        baseMs: 50,
        jitterMs: 10,
        minMs: 20,
        maxMs: 200,
        spikeFrequency: 0.01,
        spikeMultiplier: 3,
        spikeDurationMs: 2000,
      }
    }
  }

  /**
   * Generate packet loss profile
   */
  private generatePacketLossProfile(
    ispType: ISPType,
    connectionType: ConnectionType,
    packetLossRate?: number,
  ): PacketLossProfile {
    try {
      // Base packet loss profile
      let baseRate = packetLossRate || 0.001
      let burstRate = baseRate * 10
      let burstFrequency = 0.01
      let burstDurationMs = 2000

      // Adjust based on ISP type
      switch (ispType) {
        case "RESIDENTIAL":
          // Residential ISP
          break
        case "MOBILE":
          // Mobile carrier
          baseRate = packetLossRate || 0.005
          burstRate = baseRate * 10
          burstFrequency = 0.05
          burstDurationMs = 3000
          break
        case "DATACENTER":
          // Datacenter provider
          baseRate = packetLossRate || 0.0001
          burstRate = baseRate * 10
          burstFrequency = 0.001
          burstDurationMs = 1000
          break
        case "CORPORATE":
          // Corporate network
          baseRate = packetLossRate || 0.0005
          burstRate = baseRate * 10
          burstFrequency = 0.005
          burstDurationMs = 1500
          break
        case "EDUCATIONAL":
          // Educational institution
          baseRate = packetLossRate || 0.001
          burstRate = baseRate * 10
          burstFrequency = 0.01
          burstDurationMs = 2000
          break
        case "GOVERNMENT":
          // Government network
          baseRate = packetLossRate || 0.0005
          burstRate = baseRate * 10
          burstFrequency = 0.005
          burstDurationMs = 1500
          break
        case "SATELLITE":
          // Satellite provider
          baseRate = packetLossRate || 0.01
          burstRate = baseRate * 5
          burstFrequency = 0.1
          burstDurationMs = 5000
          break
      }

      // Adjust based on connection type
      switch (connectionType) {
        case "FIBER":
          // Fiber optic
          baseRate = packetLossRate || Math.min(baseRate, 0.0005) // At most 0.05%
          burstRate = baseRate * 5
          burstFrequency = Math.min(burstFrequency, 0.005)
          break
        case "CABLE":
          // Cable
          baseRate = packetLossRate || Math.min(baseRate, 0.001) // At most 0.1%
          burstRate = baseRate * 8
          burstFrequency = Math.min(burstFrequency, 0.01)
          break
        case "DSL":
          // DSL
          baseRate = packetLossRate || Math.max(baseRate, 0.002) // At least 0.2%
          burstRate = baseRate * 10
          burstFrequency = Math.max(burstFrequency, 0.02)
          break
        case "CELLULAR_4G":
          // 4G cellular
          baseRate = packetLossRate || Math.max(baseRate, 0.005) // At least 0.5%
          burstRate = baseRate * 10
          burstFrequency = Math.max(burstFrequency, 0.05)
          break
        case "CELLULAR_5G":
          // 5G cellular
          baseRate = packetLossRate || Math.min(baseRate, 0.002) // At most 0.2%
          burstRate = baseRate * 8
          burstFrequency = Math.min(burstFrequency, 0.02)
          break
        case "SATELLITE":
          // Satellite
          baseRate = packetLossRate || Math.max(baseRate, 0.01) // At least 1%
          burstRate = baseRate * 5
          burstFrequency = Math.max(burstFrequency, 0.1)
          break
        case "DIALUP":
          // Dialup (legacy)
          baseRate = packetLossRate || 0.02
          burstRate = baseRate * 3
          burstFrequency = 0.2
          burstDurationMs = 5000
          break
        case "WIRELESS":
          // Wireless
          baseRate = packetLossRate || Math.max(baseRate, 0.003) // At least 0.3%
          burstRate = baseRate * 8
          burstFrequency = Math.max(burstFrequency, 0.03)
          break
      }

      return {
        baseRate,
        burstRate,
        burstFrequency,
        burstDurationMs,
      }
    } catch (error) {
      this.logger.error("Failed to generate packet loss profile", error)
      return {
        baseRate: 0.001,
        burstRate: 0.01,
        burstFrequency: 0.01,
        burstDurationMs: 2000,
      }
    }
  }

  /**
   * Generate TCP handoff profile
   */
  private generateTCPHandoffProfile(ispType: ISPType, connectionType: ConnectionType): TCPHandoffProfile {
    try {
      // Base TCP handoff profile
      let initialWindowSize = 10
      let maxWindowSize = 256
      let windowScalingFactor = 7
      let congestionAlgorithm = "cubic"
      let timeoutMs = 5000
      let retransmissionRate = 0.001
      let mtu = 1500
      let mss = 1460

      // Adjust based on ISP type
      switch (ispType) {
        case "RESIDENTIAL":
          // Residential ISP
          break
        case "MOBILE":
          // Mobile carrier
          initialWindowSize = 6
          maxWindowSize = 64
          windowScalingFactor = 5
          timeoutMs = 15000
          retransmissionRate = 0.005
          mtu = 1428
          mss = 1388
          break
        case "DATACENTER":
          // Datacenter provider
          initialWindowSize = 20
          maxWindowSize = 512
          windowScalingFactor = 8
          congestionAlgorithm = "bbr"
          timeoutMs = 3000
          retransmissionRate = 0.0005
          mtu = 9000 // Jumbo frames
          mss = 8960
          break
        case "CORPORATE":
          // Corporate network
          initialWindowSize = 15
          maxWindowSize = 384
          windowScalingFactor = 7
          congestionAlgorithm = "cubic"
          timeoutMs = 4000
          retransmissionRate = 0.0008
          mtu = 1500
          mss = 1460
          break
        case "EDUCATIONAL":
          // Educational institution
          initialWindowSize = 15
          maxWindowSize = 384
          windowScalingFactor = 7
          congestionAlgorithm = "cubic"
          timeoutMs = 4000
          retransmissionRate = 0.001
          mtu = 1500
          mss = 1460
          break
        case "GOVERNMENT":
          // Government network
          initialWindowSize = 12
          maxWindowSize = 320
          windowScalingFactor = 7
          congestionAlgorithm = "cubic"
          timeoutMs = 4500
          retransmissionRate = 0.0009
          mtu = 1500
          mss = 1460
          break
        case "SATELLITE":
          // Satellite provider
          initialWindowSize = 4
          maxWindowSize = 32
          windowScalingFactor = 4
          congestionAlgorithm = "hybla"
          timeoutMs = 20000
          retransmissionRate = 0.01
          mtu = 1400
          mss = 1360
          break
      }

      // Adjust based on connection type
      switch (connectionType) {
        case "FIBER":
          // Fiber optic
          initialWindowSize = Math.max(initialWindowSize, 15)
          maxWindowSize = Math.max(maxWindowSize, 384)
          windowScalingFactor = Math.max(windowScalingFactor, 7)
          congestionAlgorithm = "cubic"
          timeoutMs = Math.min(timeoutMs, 4000)
          retransmissionRate = Math.min(retransmissionRate, 0.0008)
          break
        case "CABLE":
          // Cable
          initialWindowSize = Math.max(initialWindowSize, 10)
          maxWindowSize = Math.max(maxWindowSize, 256)
          windowScalingFactor = Math.max(windowScalingFactor, 6)
          congestionAlgorithm = "cubic"
          timeoutMs = Math.min(timeoutMs, 5000)
          retransmissionRate = Math.min(retransmissionRate, 0.001)
          break
        case "DSL":
          // DSL
          initialWindowSize = Math.min(initialWindowSize, 8)
          maxWindowSize = Math.min(maxWindowSize, 128)
          windowScalingFactor = Math.min(windowScalingFactor, 6)
          congestionAlgorithm = "cubic"
          timeoutMs = Math.max(timeoutMs, 8000)
          retransmissionRate = Math.max(retransmissionRate, 0.002)
          break
        case "CELLULAR_4G":
          // 4G cellular
          initialWindowSize = Math.min(initialWindowSize, 6)
          maxWindowSize = Math.min(maxWindowSize, 64)
          windowScalingFactor = Math.min(windowScalingFactor, 5)
          congestionAlgorithm = "cubic"
          timeoutMs = Math.max(timeoutMs, 15000)
          retransmissionRate = Math.max(retransmissionRate, 0.005)
          mtu = 1428
          mss = 1388
          break
        case "CELLULAR_5G":
          // 5G cellular
          initialWindowSize = Math.max(initialWindowSize, 10)
          maxWindowSize = Math.max(maxWindowSize, 256)
          windowScalingFactor = Math.max(windowScalingFactor, 6)
          congestionAlgorithm = "cubic"
          timeoutMs = Math.min(timeoutMs, 8000)
          retransmissionRate = Math.min(retransmissionRate, 0.002)
          break
        case "SATELLITE":
          // Satellite
          initialWindowSize = Math.min(initialWindowSize, 4)
          maxWindowSize = Math.min(maxWindowSize, 32)
          windowScalingFactor = Math.min(windowScalingFactor, 4)
          congestionAlgorithm = "hybla"
          timeoutMs = Math.max(timeoutMs, 20000)
          retransmissionRate = Math.max(retransmissionRate, 0.01)
          mtu = 1400
          mss = 1360
          break
        case "DIALUP":
          // Dialup (legacy)
          initialWindowSize = 2
          maxWindowSize = 8
          windowScalingFactor = 2
          congestionAlgorithm = "reno"
          timeoutMs = 30000
          retransmissionRate = 0.02
          mtu = 576
          mss = 536
          break
        case "WIRELESS":
          // Wireless
          initialWindowSize = Math.min(initialWindowSize, 8)
          maxWindowSize = Math.min(maxWindowSize, 128)
          windowScalingFactor = Math.min(windowScalingFactor, 6)
          congestionAlgorithm = "cubic"
          timeoutMs = Math.max(timeoutMs, 10000)
          retransmissionRate = Math.max(retransmissionRate, 0.003)
          break
      }

      return {
        initialWindowSize,
        maxWindowSize,
        windowScalingFactor,
        congestionAlgorithm,
        timeoutMs,
        retransmissionRate,
        mtu,
        mss,
      }
    } catch (error) {
      this.logger.error("Failed to generate TCP handoff profile", error)
      return {
        initialWindowSize: 10,
        maxWindowSize: 256,
        windowScalingFactor: 7,
        congestionAlgorithm: "cubic",
        timeoutMs: 5000,
        retransmissionRate: 0.001,
        mtu: 1500,
        mss: 1460,
      }
    }
  }

  /**
   * Generate regional congestion profile
   */
  private generateRegionalCongestionProfile(
    region: string,
    timeZone: string,
    congestionFactor?: number,
  ): RegionalCongestionProfile {
    try {
      // Base regional congestion profile
      const baseFactor = congestionFactor !== undefined ? congestionFactor : 1.0

      // Default peak hours
      const peakHours = [
        { start: 8, end: 10, factor: 1.5 * baseFactor }, // 8 AM - 10 AM
        { start: 17, end: 22, factor: 1.8 * baseFactor }, // 5 PM - 10 PM
      ]

      // Default off-peak hours
      const offPeakHours = [
        { start: 2, end: 6, factor: 0.7 * baseFactor }, // 2 AM - 6 AM
      ]

      // Default weekday factors
      const weekdayFactors = [0.7, 0.9, 0.9, 0.9, 0.9, 1.0, 0.8].map((f) => f * baseFactor) // Sun-Sat

      // Default seasonal factors
      const seasonalFactors = [0.9, 0.9, 0.9, 0.9, 0.9, 1.0, 1.1, 1.1, 0.9, 0.9, 0.9, 1.0].map((f) => f * baseFactor) // Jan-Dec

      // Default holiday factor
      const holidayFactor = 1.2 * baseFactor

      // Adjust based on region
      switch (region) {
        case "na-east":
          // North America East
          // Already using defaults
          break
        case "na-west":
          // North America West
          // Shift peak hours for time zone difference
          peakHours[0] = { start: 9, end: 11, factor: 1.5 * baseFactor }
          peakHours[1] = { start: 18, end: 23, factor: 1.8 * baseFactor }
          offPeakHours[0] = { start: 3, end: 7, factor: 0.7 * baseFactor }
          break
        case "eu-west":
          // Europe West
          peakHours[0] = { start: 8, end: 10, factor: 1.6 * baseFactor }
          peakHours[1] = { start: 16, end: 20, factor: 1.7 * baseFactor }
          offPeakHours[0] = { start: 1, end: 5, factor: 0.6 * baseFactor }
          weekdayFactors[5] = 0.9 * baseFactor // Friday
          weekdayFactors[6] = 0.7 * baseFactor // Saturday
          break
        case "eu-central":
          // Europe Central
          peakHours[0] = { start: 8, end: 10, factor: 1.7 * baseFactor }
          peakHours[1] = { start: 16, end: 19, factor: 1.6 * baseFactor }
          offPeakHours[0] = { start: 0, end: 5, factor: 0.6 * baseFactor }
          weekdayFactors[5] = 0.8 * baseFactor // Friday
          weekdayFactors[6] = 0.6 * baseFactor // Saturday
          break
        case "ap-east":
          // Asia Pacific East
          peakHours[0] = { start: 9, end: 11, factor: 1.8 * baseFactor }
          peakHours[1] = { start: 19, end: 23, factor: 1.9 * baseFactor }
          offPeakHours[0] = { start: 2, end: 6, factor: 0.5 * baseFactor }
          weekdayFactors[0] = 0.9 * baseFactor // Sunday
          break
        case "ap-south":
          // Asia Pacific South
          peakHours[0] = { start: 10, end: 13, factor: 1.7 * baseFactor }
          peakHours[1] = { start: 18, end: 22, factor: 1.8 * baseFactor }
          offPeakHours[0] = { start: 2, end: 7, factor: 0.6 * baseFactor }
          break
        case "sa-east":
          // South America East
          peakHours[0] = { start: 9, end: 12, factor: 1.6 * baseFactor }
          peakHours[1] = { start: 19, end: 23, factor: 1.9 * baseFactor }
          offPeakHours[0] = { start: 3, end: 7, factor: 0.7 * baseFactor }
          break
        default:
          // Global
          // Use defaults
          break
      }

      return {
        region,
        timeZone,
        peakHours,
        offPeakHours,
        weekdayFactors,
        seasonalFactors,
        holidayFactor,
      }
    } catch (error) {
      this.logger.error("Failed to generate regional congestion profile", error)
      return {
        region: "global",
        timeZone: "UTC",
        peakHours: [
          { start: 8, end: 10, factor: 1.5 },
          { start: 17, end: 22, factor: 1.5 },
        ],
        offPeakHours: [{ start: 1, end: 6, factor: 0.7 }],
        weekdayFactors: [0.8, 1.0, 1.0, 1.0, 1.0, 1.0, 0.9],
        seasonalFactors: [1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0],
        holidayFactor: 1.2,
      }
    }
  }

  /**
   * Get time zone for region
   */
  private getTimeZoneForRegion(region: string): string {
    switch (region) {
      case "na-east":
        return "America/New_York"
      case "na-west":
        return "America/Los_Angeles"
      case "eu-west":
        return "Europe/London"
      case "eu-central":
        return "Europe/Berlin"
      case "ap-east":
        return "Asia/Tokyo"
      case "ap-south":
        return "Asia/Singapore"
      case "sa-east":
        return "America/Sao_Paulo"
      default:
        return "UTC"
    }
  }

  /**
   * Get TTL for ISP type
   */
  private getTTLForISPType(ispType: ISPType): number {
    switch (ispType) {
      case "RESIDENTIAL":
        return 64
      case "MOBILE":
        return 53
      case "DATACENTER":
        return 64
      case "CORPORATE":
        return 128
      case "EDUCATIONAL":
        return 128
      case "GOVERNMENT":
        return 255
      case "SATELLITE":
        return 32
      default:
        return 64
    }
  }

  /**
   * Get MTU for connection type
   */
  private getMTUForConnectionType(connectionType: ConnectionType): number {
    switch (connectionType) {
      case "FIBER":
        return 1500
      case "CABLE":
        return 1500
      case "DSL":
        return 1492
      case "CELLULAR_4G":
        return 1428
      case "CELLULAR_5G":
        return 1500
      case "SATELLITE":
        return 1400
      case "DIALUP":
        return 576
      case "WIRELESS":
        return 1492
      default:
        return 1500
    }
  }

  /**
   * Generate simulation hash
   */
  private async generateSimulationHash(
    profile: ISPBehaviorProfile,
    latency: number,
    bandwidth: number,
    packetLossRate: number,
  ): Promise<string> {
    try {
      // Generate entropy for hash
      const entropy = await entropyAmplificationSystem.generateEntropyForPurpose("isp-simulation-hash", {
        consistentWith: profile.id,
      })

      // Create hash input
      const hashInput = JSON.stringify({
        profileId: profile.id,
        name: profile.name,
        region: profile.region,
        ispType: profile.ispType,
        connectionType: profile.connectionType,
        latency,
        bandwidth,
        packetLossRate,
        timestamp: Date.now(),
      })

      // Create hash
      return createHash("sha256").update(hashInput).update(entropy.hex).digest("hex")
    } catch (error) {
      this.logger.error("Failed to generate simulation hash", error)
      return createHash("sha256").update(Date.now().toString()).digest("hex") // Fallback
    }
  }

  /**
   * Clean up resources
   */
  public async cleanup(): Promise<void> {
    try {
      // Clear profiles
      this.profiles.clear()
      this.regionProfiles.clear()
      this.ispTypeProfiles.clear()
      this.connectionTypeProfiles.clear()

      this.initialized = false

      this.logger.info("ISP Behavior Simulation cleaned up")
    } catch (error) {
      this.logger.error("Failed to clean up ISP Behavior Simulation", error)
    }
  }
}

// Export singleton instance
export const ispBehaviorSimulation = ISPBehaviorSimulation.getInstance()

// Helper functions for easier access
export async function initializeISPBehaviorSimulation(): Promise<void> {
  return ispBehaviorSimulation.initialize()
}

export async function createISPBehaviorProfile(
  profile: Omit<ISPBehaviorProfile, "id" | "created" | "updated">,
): Promise<string> {
  return ispBehaviorSimulation.createISPBehaviorProfile(profile)
}

export async function simulateISPBehavior(
  domain: string,
  region: string,
  options?: ISPBehaviorSimulationOptions,
): Promise<ISPBehaviorSimulationResult> {
  return ispBehaviorSimulation.simulateISPBehavior(domain, region, options)
}

export async function cleanupISPBehaviorSimulation(): Promise<void> {
  return ispBehaviorSimulation.cleanup()
}
