// PROXY ROTATION SCHEDULER
// Classification: FOUNDER-EYES-ONLY
// Version: 3.2.1-MILITARY

import { v4 as uuidv4 } from "uuid"
import { Logger } from "../utils/logger"
import { proxyManager } from "./proxy-manager"
import type { ProxyTier, RoutingStrategy } from "../types/proxy-types"

/**
 * Rotation strategy
 */
export type RotationStrategy =
  | "TIME_BASED" // Rotate based on time intervals
  | "USAGE_BASED" // Rotate based on usage count
  | "ENTROPY_BASED" // Rotate based on entropy analysis
  | "PATTERN_BREAKING" // Rotate to break detectable patterns
  | "RISK_BASED" // Rotate based on risk assessment
  | "HYBRID" // Combination of multiple strategies

/**
 * Rotation schedule
 */
export interface RotationSchedule {
  id: string
  domainPattern: string | RegExp
  strategy: RotationStrategy
  interval?: number // Time in milliseconds
  maxUsage?: number // Maximum number of uses
  timeWindows?: Array<{
    startHour: number
    endHour: number
    dayOfWeek?: number[] // 0-6, where 0 is Sunday
  }>
  proxyTier?: ProxyTier
  region?: string
  routingStrategy?: RoutingStrategy
  enabled: boolean
  lastRotation: number
  usageCount: number
  riskThreshold?: number // 0-1, where 1 is highest risk
  jitterFactor?: number // 0-1, randomization factor for timing
  entropyThreshold?: number // Threshold for entropy-based rotation
}

/**
 * Proxy Rotation Scheduler
 *
 * Military-grade scheduler for automated proxy rotation with:
 * - Time-based rotation with jitter
 * - Usage-based rotation with variable thresholds
 * - Entropy-based rotation for pattern breaking
 * - Risk-based rotation for adaptive security
 * - Hybrid strategies for maximum undetectability
 */
export class ProxyRotationScheduler {
  private static instance: ProxyRotationScheduler
  private schedules: Map<string, RotationSchedule> = new Map()
  private domainProxyMap: Map<string, string> = new Map()
  private intervalId: NodeJS.Timeout | null = null
  private logger: Logger
  private initialized = false

  private constructor() {
    this.logger = new Logger("ProxyRotationScheduler", "MILITARY")
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): ProxyRotationScheduler {
    if (!ProxyRotationScheduler.instance) {
      ProxyRotationScheduler.instance = new ProxyRotationScheduler()
    }
    return ProxyRotationScheduler.instance
  }

  /**
   * Initialize scheduler
   */
  public async initialize(): Promise<void> {
    if (this.initialized) {
      return
    }

    try {
      this.logger.info("Initializing Proxy Rotation Scheduler")

      // Start scheduler
      this.startScheduler()

      this.initialized = true
      this.logger.info("Proxy Rotation Scheduler initialized successfully")
    } catch (error) {
      this.logger.error("Failed to initialize Proxy Rotation Scheduler", error)
      throw new Error(`SCHEDULER_INITIALIZATION_FAILED: ${error.message}`)
    }
  }

  /**
   * Start scheduler
   */
  private startScheduler(): void {
    // Check schedules every 10 seconds
    this.intervalId = setInterval(() => this.checkSchedules(), 10000)
    this.logger.info("Proxy Rotation Scheduler started")
  }

  /**
   * Stop scheduler
   */
  public stopScheduler(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
      this.logger.info("Proxy Rotation Scheduler stopped")
    }
  }

  /**
   * Check schedules for rotation
   */
  private async checkSchedules(): Promise<void> {
    try {
      const now = Date.now()
      const currentHour = new Date().getHours()
      const currentDayOfWeek = new Date().getDay() // 0-6, where 0 is Sunday

      for (const [scheduleId, schedule] of this.schedules.entries()) {
        if (!schedule.enabled) {
          continue
        }

        let shouldRotate = false
        const timeSinceLastRotation = now - schedule.lastRotation

        // Check time-based rotation
        if (schedule.strategy === "TIME_BASED" || schedule.strategy === "HYBRID") {
          if (schedule.interval && timeSinceLastRotation >= schedule.interval) {
            shouldRotate = true
            this.logger.info(`Time-based rotation triggered for schedule ${scheduleId}`, {
              timeSinceLastRotation,
              interval: schedule.interval,
            })
          }
        }

        // Check usage-based rotation
        if (schedule.strategy === "USAGE_BASED" || schedule.strategy === "HYBRID") {
          if (schedule.maxUsage && schedule.usageCount >= schedule.maxUsage) {
            shouldRotate = true
            this.logger.info(`Usage-based rotation triggered for schedule ${scheduleId}`, {
              usageCount: schedule.usageCount,
              maxUsage: schedule.maxUsage,
            })
          }
        }

        // Check time window rotation
        if (schedule.timeWindows && schedule.timeWindows.length > 0) {
          const isInTimeWindow = schedule.timeWindows.some((window) => {
            const dayMatch = !window.dayOfWeek || window.dayOfWeek.includes(currentDayOfWeek)
            const hourMatch = currentHour >= window.startHour && currentHour < window.endHour
            return dayMatch && hourMatch
          })

          if (isInTimeWindow) {
            // Apply jitter to avoid predictable patterns
            const jitterFactor = schedule.jitterFactor || 0.2
            const jitterThreshold = Math.random() < jitterFactor ? 1 : 0

            if (jitterThreshold > 0) {
              shouldRotate = true
              this.logger.info(`Time window rotation triggered for schedule ${scheduleId}`, {
                currentHour,
                currentDayOfWeek,
                jitterFactor,
              })
            }
          }
        }

        // Check risk-based rotation
        if (schedule.strategy === "RISK_BASED" || schedule.strategy === "HYBRID") {
          if (schedule.riskThreshold) {
            // Calculate current risk based on proxy usage and detection attempts
            const domains = this.getDomainsForSchedule(schedule)
            let highestRisk = 0

            for (const domain of domains) {
              const proxyId = this.domainProxyMap.get(domain)

              if (proxyId) {
                const proxy = await proxyManager.getProxy(proxyId)

                if (proxy && proxy.detectionRisk > highestRisk) {
                  highestRisk = proxy.detectionRisk
                }
              }
            }

            if (highestRisk >= schedule.riskThreshold) {
              shouldRotate = true
              this.logger.info(`Risk-based rotation triggered for schedule ${scheduleId}`, {
                highestRisk,
                riskThreshold: schedule.riskThreshold,
              })
            }
          }
        }

        // Check entropy-based rotation
        if (schedule.strategy === "ENTROPY_BASED" || schedule.strategy === "HYBRID") {
          if (schedule.entropyThreshold) {
            // Calculate entropy of current proxy usage patterns
            const entropy = this.calculateUsageEntropy(schedule)

            if (entropy < schedule.entropyThreshold) {
              shouldRotate = true
              this.logger.info(`Entropy-based rotation triggered for schedule ${scheduleId}`, {
                entropy,
                entropyThreshold: schedule.entropyThreshold,
              })
            }
          }
        }

        // Check pattern-breaking rotation
        if (schedule.strategy === "PATTERN_BREAKING") {
          // Use a non-deterministic approach to break patterns
          // This is intentionally unpredictable
          const randomFactor = Math.random()
          const timeFactorWeight = 0.3
          const timeFactor = Math.min(1, timeSinceLastRotation / (24 * 60 * 60 * 1000)) * timeFactorWeight

          // Combine factors with some randomness
          if (randomFactor * 0.7 + timeFactor > 0.85) {
            shouldRotate = true
            this.logger.info(`Pattern-breaking rotation triggered for schedule ${scheduleId}`, {
              randomFactor,
              timeFactor,
            })
          }
        }

        // Perform rotation if needed
        if (shouldRotate) {
          await this.rotateProxiesForSchedule(schedule)

          // Update schedule
          schedule.lastRotation = now
          schedule.usageCount = 0
          this.schedules.set(scheduleId, schedule)
        }
      }
    } catch (error) {
      this.logger.error("Failed to check schedules", error)
    }
  }

  /**
   * Calculate entropy of proxy usage patterns
   */
  private calculateUsageEntropy(schedule: RotationSchedule): number {
    try {
      const domains = this.getDomainsForSchedule(schedule)

      if (domains.length === 0) {
        return 1 // Maximum entropy when no data
      }

      // Count proxy usage for domains
      const proxyUsageCounts: Record<string, number> = {}
      let totalCount = 0

      for (const domain of domains) {
        const proxyId = this.domainProxyMap.get(domain)

        if (proxyId) {
          proxyUsageCounts[proxyId] = (proxyUsageCounts[proxyId] || 0) + 1
          totalCount++
        }
      }

      if (totalCount === 0) {
        return 1 // Maximum entropy when no data
      }

      // Calculate Shannon entropy
      let entropy = 0
      for (const proxyId in proxyUsageCounts) {
        const probability = proxyUsageCounts[proxyId] / totalCount
        entropy -= probability * Math.log2(probability)
      }

      // Normalize entropy to 0-1 range
      const maxEntropy = Math.log2(Object.keys(proxyUsageCounts).length)
      const normalizedEntropy = maxEntropy > 0 ? entropy / maxEntropy : 1

      return normalizedEntropy
    } catch (error) {
      this.logger.error("Failed to calculate usage entropy", error)
      return 1 // Maximum entropy on error
    }
  }

  /**
   * Get domains for schedule
   */
  private getDomainsForSchedule(schedule: RotationSchedule): string[] {
    try {
      const domains: string[] = []

      // Match domains based on pattern
      for (const domain of this.domainProxyMap.keys()) {
        if (typeof schedule.domainPattern === "string") {
          if (domain.includes(schedule.domainPattern)) {
            domains.push(domain)
          }
        } else if (schedule.domainPattern instanceof RegExp) {
          if (schedule.domainPattern.test(domain)) {
            domains.push(domain)
          }
        }
      }

      return domains
    } catch (error) {
      this.logger.error("Failed to get domains for schedule", error)
      return []
    }
  }

  /**
   * Rotate proxies for schedule
   */
  private async rotateProxiesForSchedule(schedule: RotationSchedule): Promise<void> {
    try {
      const domains = this.getDomainsForSchedule(schedule)

      for (const domain of domains) {
        // Rotate proxy for domain
        await proxyManager.rotateProxy(domain, {
          region: schedule.region,
          tier: schedule.proxyTier,
          strategy: schedule.routingStrategy,
          forceRotation: true,
        })

        this.logger.info(`Rotated proxy for domain ${domain} based on schedule ${schedule.id}`)
      }
    } catch (error) {
      this.logger.error(`Failed to rotate proxies for schedule ${schedule.id}`, error)
    }
  }

  /**
   * Add rotation schedule
   */
  public addSchedule(schedule: Omit<RotationSchedule, "id" | "lastRotation" | "usageCount">): string {
    try {
      const scheduleId = uuidv4()

      const newSchedule: RotationSchedule = {
        id: scheduleId,
        ...schedule,
        lastRotation: Date.now(),
        usageCount: 0,
      }

      this.schedules.set(scheduleId, newSchedule)

      this.logger.info(`Added rotation schedule ${scheduleId}`, {
        domainPattern:
          typeof schedule.domainPattern === "string" ? schedule.domainPattern : schedule.domainPattern.toString(),
        strategy: schedule.strategy,
      })

      return scheduleId
    } catch (error) {
      this.logger.error("Failed to add rotation schedule", error)
      throw new Error(`ADD_SCHEDULE_FAILED: ${error.message}`)
    }
  }

  /**
   * Update rotation schedule
   */
  public updateSchedule(scheduleId: string, updates: Partial<Omit<RotationSchedule, "id">>): boolean {
    try {
      const schedule = this.schedules.get(scheduleId)

      if (!schedule) {
        throw new Error(`Schedule ${scheduleId} not found`)
      }

      const updatedSchedule: RotationSchedule = {
        ...schedule,
        ...updates,
      }

      this.schedules.set(scheduleId, updatedSchedule)

      this.logger.info(`Updated rotation schedule ${scheduleId}`)

      return true
    } catch (error) {
      this.logger.error(`Failed to update rotation schedule ${scheduleId}`, error)
      return false
    }
  }

  /**
   * Remove rotation schedule
   */
  public removeSchedule(scheduleId: string): boolean {
    try {
      const result = this.schedules.delete(scheduleId)

      if (result) {
        this.logger.info(`Removed rotation schedule ${scheduleId}`)
      }

      return result
    } catch (error) {
      this.logger.error(`Failed to remove rotation schedule ${scheduleId}`, error)
      return false
    }
  }

  /**
   * Get rotation schedule
   */
  public getSchedule(scheduleId: string): RotationSchedule | undefined {
    return this.schedules.get(scheduleId)
  }

  /**
   * Get all rotation schedules
   */
  public getAllSchedules(): RotationSchedule[] {
    return Array.from(this.schedules.values())
  }

  /**
   * Track domain proxy mapping
   */
  public trackDomainProxy(domain: string, proxyId: string): void {
    this.domainProxyMap.set(domain, proxyId)
  }

  /**
   * Increment usage count for matching schedules
   */
  public incrementUsageCount(domain: string): void {
    try {
      for (const [scheduleId, schedule] of this.schedules.entries()) {
        if (!schedule.enabled) {
          continue
        }

        let matches = false

        if (typeof schedule.domainPattern === "string") {
          matches = domain.includes(schedule.domainPattern)
        } else if (schedule.domainPattern instanceof RegExp) {
          matches = schedule.domainPattern.test(domain)
        }

        if (matches) {
          schedule.usageCount++
          this.schedules.set(scheduleId, schedule)
        }
      }
    } catch (error) {
      this.logger.error(`Failed to increment usage count for domain ${domain}`, error)
    }
  }

  /**
   * Create default schedules
   */
  public createDefaultSchedules(): void {
    try {
      // Time-based rotation every 6 hours for all domains
      this.addSchedule({
        domainPattern: /.*/,
        strategy: "TIME_BASED",
        interval: 6 * 60 * 60 * 1000, // 6 hours
        jitterFactor: 0.3, // 30% jitter
        enabled: true,
      })

      // Usage-based rotation after 100 uses for all domains
      this.addSchedule({
        domainPattern: /.*/,
        strategy: "USAGE_BASED",
        maxUsage: 100,
        enabled: true,
      })

      // Risk-based rotation for financial domains
      this.addSchedule({
        domainPattern: /bank|finance|payment|crypto|exchange/i,
        strategy: "RISK_BASED",
        riskThreshold: 0.3, // Lower threshold for sensitive domains
        proxyTier: "PHANTOM" as any,
        routingStrategy: "STEALTH",
        enabled: true,
      })

      // Entropy-based rotation for high-security domains
      this.addSchedule({
        domainPattern: /secure|login|account|admin/i,
        strategy: "ENTROPY_BASED",
        entropyThreshold: 0.7,
        proxyTier: "GHOST" as any,
        routingStrategy: "STEALTH",
        enabled: true,
      })

      // Pattern-breaking rotation for all domains
      this.addSchedule({
        domainPattern: /.*/,
        strategy: "PATTERN_BREAKING",
        enabled: true,
      })

      // Time window rotation during business hours
      this.addSchedule({
        domainPattern: /.*/,
        strategy: "TIME_BASED",
        timeWindows: [
          { startHour: 9, endHour: 17, dayOfWeek: [1, 2, 3, 4, 5] }, // Monday-Friday, 9 AM - 5 PM
        ],
        jitterFactor: 0.5, // 50% jitter
        enabled: true,
      })

      this.logger.info("Created default rotation schedules")
    } catch (error) {
      this.logger.error("Failed to create default schedules", error)
    }
  }

  /**
   * Clean up resources
   */
  public async cleanup(): Promise<void> {
    try {
      this.stopScheduler()
      this.schedules.clear()
      this.domainProxyMap.clear()
      this.initialized = false

      this.logger.info("Proxy Rotation Scheduler cleaned up")
    } catch (error) {
      this.logger.error("Failed to clean up Proxy Rotation Scheduler", error)
    }
  }
}

// Export singleton instance
export const proxyRotationScheduler = ProxyRotationScheduler.getInstance()

// Helper functions for easier access
export async function initializeProxyRotationScheduler(): Promise<void> {
  return proxyRotationScheduler.initialize()
}

export function addRotationSchedule(schedule: Omit<RotationSchedule, "id" | "lastRotation" | "usageCount">): string {
  return proxyRotationScheduler.addSchedule(schedule)
}

export function updateRotationSchedule(scheduleId: string, updates: Partial<Omit<RotationSchedule, "id">>): boolean {
  return proxyRotationScheduler.updateSchedule(scheduleId, updates)
}

export function removeRotationSchedule(scheduleId: string): boolean {
  return proxyRotationScheduler.removeSchedule(scheduleId)
}

export function getRotationSchedule(scheduleId: string): RotationSchedule | undefined {
  return proxyRotationScheduler.getSchedule(scheduleId)
}

export function getAllRotationSchedules(): RotationSchedule[] {
  return proxyRotationScheduler.getAllSchedules()
}

export function trackDomainProxy(domain: string, proxyId: string): void {
  return proxyRotationScheduler.trackDomainProxy(domain, proxyId)
}

export function incrementUsageCount(domain: string): void {
  return proxyRotationScheduler.incrementUsageCount(domain)
}

export function createDefaultSchedules(): void {
  return proxyRotationScheduler.createDefaultSchedules()
}

export async function cleanupProxyRotationScheduler(): Promise<void> {
  return proxyRotationScheduler.cleanup()
}
