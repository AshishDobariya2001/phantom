// SESSION HISTORY MANAGER
// Classification: FOUNDER-EYES-ONLY
// Version: 3.2.1-MILITARY

import { v4 as uuidv4 } from "uuid"
import { createHash } from "crypto"
import { Logger } from "../utils/logger"
import { entropyAmplificationSystem } from "./entropy-amplification-system"
import { temporalConsistencyVerification } from "./temporal-consistency-verification"
import { postQuantumCrypto } from "../crypto/post-quantum-crypto"
import type { Proxy, ProxyTier, RoutingStrategy } from "../types/proxy-types"

/**
 * Session type
 */
export type SessionType =
  | "STANDARD" // Standard session
  | "PERSISTENT" // Persistent session
  | "EPHEMERAL" // Ephemeral session
  | "STEALTH" // Stealth session
  | "GHOST" // Ghost session

/**
 * Session state
 */
export type SessionState =
  | "ACTIVE" // Active session
  | "IDLE" // Idle session
  | "EXPIRED" // Expired session
  | "COMPROMISED" // Compromised session
  | "TERMINATED" // Terminated session

/**
 * Session history entry
 */
export interface SessionHistoryEntry {
  timestamp: number
  domain: string
  proxyId: string
  success: boolean
  duration: number
  requestType: string
  responseCode?: number
  bytesSent?: number
  bytesReceived?: number
  tlsFingerprintUsed?: string
  detectionAttempt?: boolean
}

/**
 * Session proxy selection criteria
 */
export interface SessionProxySelectionCriteria {
  region?: string
  tier?: ProxyTier
  strategy?: RoutingStrategy
  preferPrevious?: boolean
  avoidDetected?: boolean
  requireSuccess?: boolean
  maxAge?: number // Maximum age in milliseconds
  minSuccessRate?: number // Minimum success rate (0-1)
  maxLatency?: number // Maximum latency in milliseconds
  consistentFingerprint?: boolean
}

/**
 * Session proxy selection result
 */
export interface SessionProxySelectionResult {
  proxyId: string
  isNewProxy: boolean
  previousSuccessRate: number
  selectionReason: string
  timestamp: number
  consistencyScore: number
  fingerprintConsistency: boolean
}

/**
 * Session
 */
export interface Session {
  id: string
  type: SessionType
  state: SessionState
  created: number
  lastActivity: number
  expiresAt: number
  domains: Set<string>
  proxies: Map<string, string[]> // domain -> proxyIds
  history: SessionHistoryEntry[]
  fingerprintId?: string
  behavioralProfile?: string
  consistencyKey?: string
  compromisedAt?: number
  terminatedAt?: number
  metadata: Record<string, any>
}

/**
 * Session History Manager
 *
 * Military-grade session history management with:
 * - Stateful proxy selection based on historical performance
 * - Session consistency enforcement
 * - Temporal pattern analysis
 * - Behavioral fingerprinting
 * - Compromise detection and mitigation
 */
export class SessionHistoryManager {
  private static instance: SessionHistoryManager
  private logger: Logger
  private initialized = false

  // Session storage
  private sessions: Map<string, Session> = new Map()

  // Domain-session mapping for quick lookup
  private domainSessions: Map<string, Set<string>> = new Map() // domain -> Set of sessionIds

  // Proxy-session mapping for quick lookup
  private proxySessions: Map<string, Set<string>> = new Map() // proxyId -> Set of sessionIds

  // Session expiration
  private expirationCheckInterval: NodeJS.Timeout | null = null
  private expirationCheckIntervalMs = 5 * 60 * 1000 // 5 minutes

  // Session type parameters
  private sessionParameters: Record<
    SessionType,
    {
      defaultTTL: number // Time-to-live in milliseconds
      maxHistory: number // Maximum history entries
      consistencyEnforcement: number // 0-1, higher means stricter consistency
      fingerprintRequired: boolean
      proxyRotationFrequency: number // 0-1, higher means more frequent rotation
    }
  > = {
    STANDARD: {
      defaultTTL: 24 * 60 * 60 * 1000, // 24 hours
      maxHistory: 1000,
      consistencyEnforcement: 0.5,
      fingerprintRequired: false,
      proxyRotationFrequency: 0.3,
    },
    PERSISTENT: {
      defaultTTL: 7 * 24 * 60 * 60 * 1000, // 7 days
      maxHistory: 5000,
      consistencyEnforcement: 0.7,
      fingerprintRequired: true,
      proxyRotationFrequency: 0.1,
    },
    EPHEMERAL: {
      defaultTTL: 30 * 60 * 1000, // 30 minutes
      maxHistory: 100,
      consistencyEnforcement: 0.3,
      fingerprintRequired: false,
      proxyRotationFrequency: 0.7,
    },
    STEALTH: {
      defaultTTL: 60 * 60 * 1000, // 1 hour
      maxHistory: 200,
      consistencyEnforcement: 0.8,
      fingerprintRequired: true,
      proxyRotationFrequency: 0.5,
    },
    GHOST: {
      defaultTTL: 15 * 60 * 1000, // 15 minutes
      maxHistory: 50,
      consistencyEnforcement: 0.9,
      fingerprintRequired: true,
      proxyRotationFrequency: 0.9,
    },
  }

  private constructor() {
    this.logger = new Logger("SessionHistoryManager", "MILITARY")
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): SessionHistoryManager {
    if (!SessionHistoryManager.instance) {
      SessionHistoryManager.instance = new SessionHistoryManager()
    }
    return SessionHistoryManager.instance
  }

  /**
   * Initialize session history manager
   */
  public async initialize(): Promise<void> {
    if (this.initialized) {
      return
    }

    try {
      this.logger.info("Initializing Session History Manager")

      // Ensure required systems are initialized
      await entropyAmplificationSystem.initialize()
      await temporalConsistencyVerification.initialize()
      await postQuantumCrypto.initialize()

      // Start session expiration check
      this.startExpirationCheck()

      this.initialized = true
      this.logger.info("Session History Manager initialized successfully")
    } catch (error) {
      this.logger.error("Failed to initialize Session History Manager", error)
      throw new Error(`SESSION_HISTORY_MANAGER_INITIALIZATION_FAILED: ${error.message}`)
    }
  }

  /**
   * Start session expiration check
   */
  private startExpirationCheck(): void {
    try {
      // Clear existing interval if any
      if (this.expirationCheckInterval) {
        clearInterval(this.expirationCheckInterval)
      }

      // Start expiration check interval
      this.expirationCheckInterval = setInterval(() => {
        try {
          this.checkExpiredSessions()
        } catch (error) {
          this.logger.error("Error in session expiration check", error)
        }
      }, this.expirationCheckIntervalMs)

      this.logger.info(`Started session expiration check interval (${this.expirationCheckIntervalMs}ms)`)
    } catch (error) {
      this.logger.error("Failed to start session expiration check", error)
      throw error
    }
  }

  /**
   * Check expired sessions
   */
  private checkExpiredSessions(): void {
    try {
      const now = Date.now()
      let expiredCount = 0

      // Check each session
      for (const [sessionId, session] of this.sessions.entries()) {
        if (session.state === "ACTIVE" || session.state === "IDLE") {
          if (now >= session.expiresAt) {
            // Expire session
            session.state = "EXPIRED"
            this.sessions.set(sessionId, session)
            expiredCount++

            this.logger.info(`Session expired: ${sessionId}`, {
              type: session.type,
              created: new Date(session.created).toISOString(),
              lastActivity: new Date(session.lastActivity).toISOString(),
              expiresAt: new Date(session.expiresAt).toISOString(),
            })
          }
        }
      }

      if (expiredCount > 0) {
        this.logger.info(`Expired ${expiredCount} sessions`)
      }
    } catch (error) {
      this.logger.error("Failed to check expired sessions", error)
    }
  }

  /**
   * Create session
   */
  public async createSession(type: SessionType = "STANDARD", metadata: Record<string, any> = {}): Promise<string> {
    try {
      if (!this.initialized) {
        await this.initialize()
      }

      // Generate session ID
      const sessionId = await this.generateSessionId()

      // Get session parameters
      const params = this.sessionParameters[type]

      // Create session
      const session: Session = {
        id: sessionId,
        type,
        state: "ACTIVE",
        created: Date.now(),
        lastActivity: Date.now(),
        expiresAt: Date.now() + params.defaultTTL,
        domains: new Set<string>(),
        proxies: new Map<string, string[]>(),
        history: [],
        metadata: {
          ...metadata,
          createdAt: new Date().toISOString(),
          sessionType: type,
        },
      }

      // Generate consistency key if needed
      if (params.consistencyEnforcement > 0.5) {
        session.consistencyKey = await this.generateConsistencyKey(sessionId)
      }

      // Store session
      this.sessions.set(sessionId, session)

      this.logger.info(`Created session: ${sessionId}`, {
        type,
        expiresAt: new Date(session.expiresAt).toISOString(),
      })

      return sessionId
    } catch (error) {
      this.logger.error("Failed to create session", error)
      throw error
    }
  }

  /**
   * Generate session ID
   */
  private async generateSessionId(): Promise<string> {
    try {
      // Generate entropy
      const entropy = await entropyAmplificationSystem.generateEntropyForPurpose("session-id", {
        quality: "HIGH",
        size: 16,
      })

      // Create session ID
      return entropy.hex.substring(0, 32)
    } catch (error) {
      this.logger.error("Failed to generate session ID", error)
      return uuidv4() // Fallback
    }
  }

  /**
   * Generate consistency key
   */
  private async generateConsistencyKey(sessionId: string): Promise<string> {
    try {
      // Generate entropy
      const entropy = await entropyAmplificationSystem.generateEntropyForPurpose("consistency-key", {
        quality: "MILITARY",
        size: 32,
        consistentWith: sessionId,
      })

      // Create consistency key
      return entropy.hex
    } catch (error) {
      this.logger.error("Failed to generate consistency key", error)
      return createHash("sha256").update(sessionId).digest("hex") // Fallback
    }
  }

  /**
   * Get session
   */
  public getSession(sessionId: string): Session | undefined {
    return this.sessions.get(sessionId)
  }

  /**
   * Update session activity
   */
  public updateSessionActivity(sessionId: string): boolean {
    try {
      // Get session
      const session = this.sessions.get(sessionId)

      if (!session) {
        return false
      }

      // Update last activity
      session.lastActivity = Date.now()

      // Update state if needed
      if (session.state === "IDLE") {
        session.state = "ACTIVE"
      }

      // Store updated session
      this.sessions.set(sessionId, session)

      return true
    } catch (error) {
      this.logger.error("Failed to update session activity", error)
      return false
    }
  }

  /**
   * Add session history entry
   */
  public async addSessionHistoryEntry(
    sessionId: string,
    entry: Omit<SessionHistoryEntry, "timestamp">,
  ): Promise<boolean> {
    try {
      // Get session
      const session = this.sessions.get(sessionId)

      if (!session) {
        return false
      }

      // Create history entry
      const historyEntry: SessionHistoryEntry = {
        ...entry,
        timestamp: Date.now(),
      }

      // Add to history
      session.history.push(historyEntry)

      // Trim history if needed
      const maxHistory = this.sessionParameters[session.type].maxHistory
      if (session.history.length > maxHistory) {
        session.history = session.history.slice(-maxHistory)
      }

      // Update domain set
      session.domains.add(entry.domain)

      // Update proxy mapping
      const domainProxies = session.proxies.get(entry.domain) || []
      if (!domainProxies.includes(entry.proxyId)) {
        domainProxies.push(entry.proxyId)
        session.proxies.set(entry.domain, domainProxies)
      }

      // Update domain-session mapping
      let domainSessions = this.domainSessions.get(entry.domain)
      if (!domainSessions) {
        domainSessions = new Set<string>()
        this.domainSessions.set(entry.domain, domainSessions)
      }
      domainSessions.add(sessionId)

      // Update proxy-session mapping
      let proxySessions = this.proxySessions.get(entry.proxyId)
      if (!proxySessions) {
        proxySessions = new Set<string>()
        this.proxySessions.set(entry.proxyId, proxySessions)
      }
      proxySessions.add(sessionId)

      // Update session activity
      session.lastActivity = Date.now()

      // Store updated session
      this.sessions.set(sessionId, session)

      // Record temporal event
      await temporalConsistencyVerification.recordTemporalEvent(sessionId, entry.domain, "SESSION_BEHAVIOR")

      return true
    } catch (error) {
      this.logger.error("Failed to add session history entry", error)
      return false
    }
  }

  /**
   * Select proxy for session
   */
  public async selectProxyForSession(
    sessionId: string,
    domain: string,
    availableProxies: Proxy[],
    criteria: SessionProxySelectionCriteria = {},
  ): Promise<SessionProxySelectionResult> {
    try {
      if (!this.initialized) {
        await this.initialize()
      }

      // Get session
      const session = this.sessions.get(sessionId)

      if (!session) {
        throw new Error(`Session not found: ${sessionId}`)
      }

      // Check if session is active
      if (session.state !== "ACTIVE" && session.state !== "IDLE") {
        throw new Error(`Session is not active: ${sessionId}, state: ${session.state}`)
      }

      // Update session activity
      session.lastActivity = Date.now()

      // Get session parameters
      const params = this.sessionParameters[session.type]

      // Filter available proxies based on criteria
      let eligibleProxies = [...availableProxies]

      // Filter by region if specified
      if (criteria.region) {
        eligibleProxies = eligibleProxies.filter((p) => p.region === criteria.region)
      }

      // Filter by tier if specified
      if (criteria.tier) {
        eligibleProxies = eligibleProxies.filter((p) => p.tier === criteria.tier)
      }

      // If no eligible proxies after filtering, use all available proxies
      if (eligibleProxies.length === 0) {
        eligibleProxies = [...availableProxies]
      }

      // Get previously used proxies for this domain
      const previousProxies = session.proxies.get(domain) || []

      // Get proxy history for this domain
      const domainHistory = session.history.filter((h) => h.domain === domain)

      // Calculate success rates for previously used proxies
      const proxySuccessRates = new Map<string, number>()
      const proxyLatencies = new Map<string, number>()
      const proxyLastUsed = new Map<string, number>()
      const proxyDetectionAttempts = new Map<string, number>()

      for (const proxyId of previousProxies) {
        const proxyHistory = domainHistory.filter((h) => h.proxyId === proxyId)

        if (proxyHistory.length > 0) {
          // Calculate success rate
          const successCount = proxyHistory.filter((h) => h.success).length
          const successRate = successCount / proxyHistory.length
          proxySuccessRates.set(proxyId, successRate)

          // Calculate average latency
          const totalDuration = proxyHistory.reduce((sum, h) => sum + h.duration, 0)
          const avgLatency = totalDuration / proxyHistory.length
          proxyLatencies.set(proxyId, avgLatency)

          // Get last used timestamp
          const lastUsed = Math.max(...proxyHistory.map((h) => h.timestamp))
          proxyLastUsed.set(proxyId, lastUsed)

          // Count detection attempts
          const detectionAttempts = proxyHistory.filter((h) => h.detectionAttempt).length
          proxyDetectionAttempts.set(proxyId, detectionAttempts)
        }
      }

      // Determine if we should use a previous proxy or select a new one
      let selectedProxyId: string | undefined
      let selectionReason: string
      let isNewProxy = false
      let previousSuccessRate = 0

      // Check if we should prefer previous proxies
      if (criteria.preferPrevious && previousProxies.length > 0) {
        // Filter previous proxies based on criteria
        let candidateProxies = [...previousProxies]

        // Filter by success rate if specified
        if (criteria.minSuccessRate !== undefined) {
          candidateProxies = candidateProxies.filter((id) => {
            const successRate = proxySuccessRates.get(id) || 0
            return successRate >= criteria.minSuccessRate!
          })
        }

        // Filter by max age if specified
        if (criteria.maxAge !== undefined) {
          const minTimestamp = Date.now() - criteria.maxAge
          candidateProxies = candidateProxies.filter((id) => {
            const lastUsed = proxyLastUsed.get(id) || 0
            return lastUsed >= minTimestamp
          })
        }

        // Filter by max latency if specified
        if (criteria.maxLatency !== undefined) {
          candidateProxies = candidateProxies.filter((id) => {
            const latency = proxyLatencies.get(id) || Number.POSITIVE_INFINITY
            return latency <= criteria.maxLatency!
          })
        }

        // Filter out detected proxies if specified
        if (criteria.avoidDetected) {
          candidateProxies = candidateProxies.filter((id) => {
            const detectionAttempts = proxyDetectionAttempts.get(id) || 0
            return detectionAttempts === 0
          })
        }

        // Filter by require success if specified
        if (criteria.requireSuccess) {
          candidateProxies = candidateProxies.filter((id) => {
            const successRate = proxySuccessRates.get(id) || 0
            return successRate > 0
          })
        }

        if (candidateProxies.length > 0) {
          // Select the proxy with the highest success rate
          let bestProxyId = candidateProxies[0]
          let bestSuccessRate = proxySuccessRates.get(bestProxyId) || 0

          for (const proxyId of candidateProxies) {
            const successRate = proxySuccessRates.get(proxyId) || 0
            if (successRate > bestSuccessRate) {
              bestProxyId = proxyId
              bestSuccessRate = successRate
            }
          }

          selectedProxyId = bestProxyId
          previousSuccessRate = bestSuccessRate
          selectionReason = "previous_proxy_with_highest_success_rate"
        }
      }

      // If no proxy selected yet, check if we should rotate based on session type
      if (!selectedProxyId && previousProxies.length > 0) {
        // Determine if we should rotate based on rotation frequency
        const shouldRotate = Math.random() < params.proxyRotationFrequency

        if (!shouldRotate) {
          // Use the most recently used proxy
          let mostRecentProxyId = previousProxies[0]
          let mostRecentTimestamp = proxyLastUsed.get(mostRecentProxyId) || 0

          for (const proxyId of previousProxies) {
            const lastUsed = proxyLastUsed.get(proxyId) || 0
            if (lastUsed > mostRecentTimestamp) {
              mostRecentProxyId = proxyId
              mostRecentTimestamp = lastUsed
            }
          }

          selectedProxyId = mostRecentProxyId
          previousSuccessRate = proxySuccessRates.get(selectedProxyId) || 0
          selectionReason = "most_recently_used_proxy"
        }
      }

      // If still no proxy selected, select a new one
      if (!selectedProxyId) {
        // Filter eligible proxies to exclude previously used ones
        const newProxies = eligibleProxies.filter((p) => !previousProxies.includes(p.id))

        if (newProxies.length > 0) {
          // Select a random new proxy
          const randomIndex = Math.floor(Math.random() * newProxies.length)
          selectedProxyId = newProxies[randomIndex].id
        } else {
          // If no new proxies, select a random eligible proxy
          const randomIndex = Math.floor(Math.random() * eligibleProxies.length)
          selectedProxyId = eligibleProxies[randomIndex].id
        }

        isNewProxy = true
        selectionReason = "new_proxy_selected"
      }

      // If still no proxy selected (should never happen), select the first available proxy
      if (!selectedProxyId && availableProxies.length > 0) {
        selectedProxyId = availableProxies[0].id
        isNewProxy = !previousProxies.includes(selectedProxyId)
        selectionReason = "fallback_selection"
      }

      // If still no proxy selected (no available proxies), throw error
      if (!selectedProxyId) {
        throw new Error("No proxies available for selection")
      }

      // Check fingerprint consistency if required
      let fingerprintConsistency = false
      if (criteria.consistentFingerprint && session.fingerprintId) {
        // In a real implementation, this would check if the selected proxy's fingerprint
        // is consistent with the session's fingerprint
        fingerprintConsistency = true
      }

      // Calculate consistency score
      const consistencyScore = await this.calculateConsistencyScore(sessionId, domain, selectedProxyId)

      // Update session state if needed
      if (session.state === "IDLE") {
        session.state = "ACTIVE"
      }

      // Store updated session
      this.sessions.set(sessionId, session)

      return {
        proxyId: selectedProxyId,
        isNewProxy,
        previousSuccessRate,
        selectionReason,
        timestamp: Date.now(),
        consistencyScore,
        fingerprintConsistency,
      }
    } catch (error) {
      this.logger.error("Failed to select proxy for session", error)

      // Fallback to random selection
      if (availableProxies.length > 0) {
        const randomIndex = Math.floor(Math.random() * availableProxies.length)
        const selectedProxyId = availableProxies[randomIndex].id

        return {
          proxyId: selectedProxyId,
          isNewProxy: true,
          previousSuccessRate: 0,
          selectionReason: "fallback_random_selection",
          timestamp: Date.now(),
          consistencyScore: 0,
          fingerprintConsistency: false,
        }
      }

      throw new Error(`Failed to select proxy for session: ${error.message}`)
    }
  }

  /**
   * Calculate consistency score
   */
  private async calculateConsistencyScore(sessionId: string, domain: string, proxyId: string): Promise<number> {
    try {
      // Get session
      const session = this.sessions.get(sessionId)

      if (!session) {
        return 0
      }

      // Get session parameters
      const params = this.sessionParameters[session.type]

      // Base consistency score
      let consistencyScore = 0.5

      // Check temporal consistency
      const temporalResult = await temporalConsistencyVerification.verifyTemporalConsistency(
        sessionId,
        domain,
        "SESSION_BEHAVIOR",
      )

      if (temporalResult.consistent) {
        consistencyScore += 0.2 * temporalResult.confidenceScore
      } else {
        consistencyScore -= 0.1
      }

      // Check proxy history consistency
      const domainHistory = session.history.filter((h) => h.domain === domain)
      const proxyHistory = domainHistory.filter((h) => h.proxyId === proxyId)

      if (proxyHistory.length > 0) {
        // Previously used proxy increases consistency
        consistencyScore += 0.2

        // Success rate affects consistency
        const successCount = proxyHistory.filter((h) => h.success).length
        const successRate = successCount / proxyHistory.length

        consistencyScore += 0.1 * successRate
      }

      // Apply consistency enforcement factor
      consistencyScore *= params.consistencyEnforcement

      // Ensure score is in 0-1 range
      return Math.max(0, Math.min(1, consistencyScore))
    } catch (error) {
      this.logger.error("Failed to calculate consistency score", error)
      return 0.5 // Default to medium consistency
    }
  }

  /**
   * Mark session as compromised
   */
  public markSessionAsCompromised(sessionId: string, reason: string): boolean {
    try {
      // Get session
      const session = this.sessions.get(sessionId)

      if (!session) {
        return false
      }

      // Update session state
      session.state = "COMPROMISED"
      session.compromisedAt = Date.now()
      session.metadata.compromiseReason = reason
      session.metadata.compromisedAt = new Date().toISOString()

      // Store updated session
      this.sessions.set(sessionId, session)

      this.logger.warn(`Session marked as compromised: ${sessionId}`, {
        reason,
        compromisedAt: new Date(session.compromisedAt).toISOString(),
      })

      return true
    } catch (error) {
      this.logger.error("Failed to mark session as compromised", error)
      return false
    }
  }

  /**
   * Terminate session
   */
  public terminateSession(sessionId: string, reason: string): boolean {
    try {
      // Get session
      const session = this.sessions.get(sessionId)

      if (!session) {
        return false
      }

      // Update session state
      session.state = "TERMINATED"
      session.terminatedAt = Date.now()
      session.metadata.terminationReason = reason
      session.metadata.terminatedAt = new Date().toISOString()

      // Store updated session
      this.sessions.set(sessionId, session)

      this.logger.info(`Session terminated: ${sessionId}`, {
        reason,
        terminatedAt: new Date(session.terminatedAt).toISOString(),
      })

      return true
    } catch (error) {
      this.logger.error("Failed to terminate session", error)
      return false
    }
  }

  /**
   * Get session statistics
   */
  public getSessionStatistics(sessionId: string): {
    domainCount: number
    proxyCount: number
    historyCount: number
    successRate: number
    averageLatency: number
    detectionAttempts: number
    lastActivity: number
    age: number
  } {
    try {
      // Get session
      const session = this.sessions.get(sessionId)

      if (!session) {
        throw new Error(`Session not found: ${sessionId}`)
      }

      // Calculate statistics
      const domainCount = session.domains.size

      let proxyCount = 0
      for (const proxies of session.proxies.values()) {
        proxyCount += proxies.length
      }

      const historyCount = session.history.length

      const successCount = session.history.filter((h) => h.success).length
      const successRate = historyCount > 0 ? successCount / historyCount : 0

      const totalDuration = session.history.reduce((sum, h) => sum + h.duration, 0)
      const averageLatency = historyCount > 0 ? totalDuration / historyCount : 0

      const detectionAttempts = session.history.filter((h) => h.detectionAttempt).length

      const lastActivity = session.lastActivity
      const age = Date.now() - session.created

      return {
        domainCount,
        proxyCount,
        historyCount,
        successRate,
        averageLatency,
        detectionAttempts,
        lastActivity,
        age,
      }
    } catch (error) {
      this.logger.error("Failed to get session statistics", error)
      throw error
    }
  }

  /**
   * Get domain sessions
   */
  public getDomainSessions(domain: string): string[] {
    try {
      // Get sessions for domain
      const sessions = this.domainSessions.get(domain)

      if (!sessions) {
        return []
      }

      // Filter active sessions
      return Array.from(sessions).filter((sessionId) => {
        const session = this.sessions.get(sessionId)
        return session && (session.state === "ACTIVE" || session.state === "IDLE")
      })
    } catch (error) {
      this.logger.error("Failed to get domain sessions", error)
      return []
    }
  }

  /**
   * Get proxy sessions
   */
  public getProxySessions(proxyId: string): string[] {
    try {
      // Get sessions for proxy
      const sessions = this.proxySessions.get(proxyId)

      if (!sessions) {
        return []
      }

      // Filter active sessions
      return Array.from(sessions).filter((sessionId) => {
        const session = this.sessions.get(sessionId)
        return session && (session.state === "ACTIVE" || session.state === "IDLE")
      })
    } catch (error) {
      this.logger.error("Failed to get proxy sessions", error)
      return []
    }
  }

  /**
   * Clean up resources
   */
  public async cleanup(): Promise<void> {
    try {
      // Stop expiration check interval
      if (this.expirationCheckInterval) {
        clearInterval(this.expirationCheckInterval)
        this.expirationCheckInterval = null
      }

      // Clear session storage
      this.sessions.clear()

      // Clear mappings
      this.domainSessions.clear()
      this.proxySessions.clear()

      this.initialized = false

      this.logger.info("Session History Manager cleaned up")
    } catch (error) {
      this.logger.error("Failed to clean up Session History Manager", error)
    }
  }
}

// Export singleton instance
export const sessionHistoryManager = SessionHistoryManager.getInstance()

// Helper functions for easier access
export async function initializeSessionHistoryManager(): Promise<void> {
  return sessionHistoryManager.initialize()
}

export async function createSession(
  type: SessionType = "STANDARD",
  metadata: Record<string, any> = {},
): Promise<string> {
  return sessionHistoryManager.createSession(type, metadata)
}

export function getSession(sessionId: string): Session | undefined {
  return sessionHistoryManager.getSession(sessionId)
}

export function updateSessionActivity(sessionId: string): boolean {
  return sessionHistoryManager.updateSessionActivity(sessionId)
}

export async function addSessionHistoryEntry(
  sessionId: string,
  entry: Omit<SessionHistoryEntry, "timestamp">,
): Promise<boolean> {
  return sessionHistoryManager.addSessionHistoryEntry(sessionId, entry)
}

export async function selectProxyForSession(
  sessionId: string,
  domain: string,
  availableProxies: Proxy[],
  criteria: SessionProxySelectionCriteria = {},
): Promise<SessionProxySelectionResult> {
  return sessionHistoryManager.selectProxyForSession(sessionId, domain, availableProxies, criteria)
}

export function markSessionAsCompromised(sessionId: string, reason: string): boolean {
  return sessionHistoryManager.markSessionAsCompromised(sessionId, reason)
}

export function terminateSession(sessionId: string, reason: string): boolean {
  return sessionHistoryManager.terminateSession(sessionId, reason)
}

export function getSessionStatistics(sessionId: string): {
  domainCount: number
  proxyCount: number
  historyCount: number
  successRate: number
  averageLatency: number
  detectionAttempts: number
  lastActivity: number
  age: number
} {
  return sessionHistoryManager.getSessionStatistics(sessionId)
}

export function getDomainSessions(domain: string): string[] {
  return sessionHistoryManager.getDomainSessions(domain)
}

export function getProxySessions(proxyId: string): string[] {
  return sessionHistoryManager.getProxySessions(proxyId)
}

export async function cleanupSessionHistoryManager(): Promise<void> {
  return sessionHistoryManager.cleanup()
}
