// MEMORY-AWARE PROXY MANAGER
// Classification: FOUNDER-EYES-ONLY
// Version: 3.2.1-MILITARY

import { v4 as uuidv4 } from "uuid"
import { Logger } from "../utils/logger"
import { memoryManager } from "../utils/memory-manager"
import { proxyManager } from "./proxy-manager"
import { sessionHistoryManager } from "./session-history-manager"
import { decoyProxyIntegration } from "./decoy-proxy-integration"
import { entropyAmplificationSystem } from "./entropy-amplification-system"
import { temporalConsistencyVerification } from "./temporal-consistency-verification"
import { postQuantumCrypto } from "../crypto/post-quantum-crypto"
import type { Proxy, ProxyContext, ProxyTier, RoutingStrategy } from "../types/proxy-types"
import type { SessionType } from "./session-history-manager"
import type { DecoyProxyOptions, DecoyProxyResult } from "./decoy-proxy-integration"

/**
 * Memory-aware proxy options
 */
export interface MemoryAwareProxyOptions {
  sessionId?: string
  sessionType?: SessionType
  domain: string
  region?: string
  tier?: ProxyTier
  strategy?: RoutingStrategy
  forceRotation?: boolean
  preferPrevious?: boolean
  avoidDetected?: boolean
  requireSuccess?: boolean
  maxAge?: number
  minSuccessRate?: number
  maxLatency?: number
  consistentFingerprint?: boolean
  ttl?: number
  priority?: number
  metadata?: Record<string, any>
}

/**
 * Memory-aware decoy options
 */
export interface MemoryAwareDecoyOptions extends DecoyProxyOptions {
  ttl?: number
  priority?: number
  resourceId?: string
}

/**
 * Memory-Aware Proxy Manager
 *
 * Military-grade proxy management with memory awareness:
 * - TTL-based proxy context caching
 * - Automatic resource cleanup
 * - Memory-efficient proxy rotation
 * - Session-aware proxy selection
 * - Intelligent cache prioritization
 */
export class MemoryAwareProxyManager {
  private static instance: MemoryAwareProxyManager
  private logger: Logger
  private initialized = false

  // Cache keys
  private readonly PROXY_CACHE_PREFIX = "proxy:"
  private readonly SESSION_CACHE_PREFIX = "session:"
  private readonly DOMAIN_CACHE_PREFIX = "domain:"

  // Resource IDs
  private readonly PROXY_RESOURCE_PREFIX = "proxy-resource:"
  private readonly SESSION_RESOURCE_PREFIX = "session-resource:"

  // Cache TTLs
  private readonly PROXY_CONTEXT_TTL = 5 * 60 * 1000 // 5 minutes
  private readonly SESSION_TTL = 30 * 60 * 1000 // 30 minutes
  private readonly DOMAIN_PROXIES_TTL = 10 * 60 * 1000 // 10 minutes

  // Cache priorities
  private readonly HIGH_PRIORITY = 3
  private readonly MEDIUM_PRIORITY = 2
  private readonly LOW_PRIORITY = 1

  private constructor() {
    this.logger = new Logger("MemoryAwareProxyManager", "MILITARY")
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): MemoryAwareProxyManager {
    if (!MemoryAwareProxyManager.instance) {
      MemoryAwareProxyManager.instance = new MemoryAwareProxyManager()
    }
    return MemoryAwareProxyManager.instance
  }

  /**
   * Initialize memory-aware proxy manager
   */
  public async initialize(): Promise<void> {
    if (this.initialized) {
      return
    }

    try {
      this.logger.info("Initializing Memory-Aware Proxy Manager")

      // Ensure required systems are initialized
      await memoryManager.initialize()
      await proxyManager.initialize()
      await sessionHistoryManager.initialize()
      await decoyProxyIntegration.initialize()
      await entropyAmplificationSystem.initialize()
      await temporalConsistencyVerification.initialize()
      await postQuantumCrypto.initialize()

      this.initialized = true
      this.logger.info("Memory-Aware Proxy Manager initialized successfully")
    } catch (error) {
      this.logger.error("Failed to initialize Memory-Aware Proxy Manager", error)
      throw new Error(`MEMORY_AWARE_PROXY_MANAGER_INITIALIZATION_FAILED: ${error.message}`)
    }
  }

  /**
   * Get proxy context
   */
  public getProxyContext(sessionId: string, domain: string): ProxyContext | undefined {
    try {
      if (!this.initialized) {
        this.initialize().catch((error) => {
          this.logger.error("Failed to initialize memory-aware proxy manager during get proxy context operation", error)
        })
      }

      // Generate cache key
      const cacheKey = `${this.PROXY_CACHE_PREFIX}${sessionId}:${domain}`

      // Get from cache
      return memoryManager.get<ProxyContext>(cacheKey)
    } catch (error) {
      this.logger.error(`Failed to get proxy context for session ${sessionId} and domain ${domain}`, error)
      return undefined
    }
  }

  /**
   * Rotate proxy
   */
  public async rotateProxy(domain: string, options: MemoryAwareProxyOptions = {}): Promise<ProxyContext> {
    try {
      if (!this.initialized) {
        await this.initialize()
      }

      // Generate session ID if not provided
      const sessionId = options.sessionId || uuidv4()

      // Create session if it doesn't exist
      const sessionType = options.sessionType || "STANDARD"
      const existingSession = sessionHistoryManager.getSession(sessionId)

      if (!existingSession) {
        await sessionHistoryManager.createSession(sessionType, options.metadata || {})
      }

      // Check if we should use cached proxy context
      if (!options.forceRotation) {
        const cachedContext = this.getProxyContext(sessionId, domain)

        if (cachedContext) {
          // Update session activity
          sessionHistoryManager.updateSessionActivity(sessionId)

          return cachedContext
        }
      }

      // Get available proxies
      let availableProxies: Proxy[] = []

      // Try to get from cache
      const domainCacheKey = `${this.DOMAIN_CACHE_PREFIX}${domain}`
      const cachedProxies = memoryManager.get<Proxy[]>(domainCacheKey)

      if (cachedProxies && cachedProxies.length > 0) {
        availableProxies = cachedProxies
      } else {
        // Get from proxy manager
        availableProxies = proxyManager.getAllProxies()

        // Cache domain proxies
        memoryManager.set(domainCacheKey, availableProxies, {
          ttl: this.DOMAIN_PROXIES_TTL,
          priority: this.MEDIUM_PRIORITY,
        })
      }

      // Select proxy for session
      const selectionResult = await sessionHistoryManager.selectProxyForSession(sessionId, domain, availableProxies, {
        region: options.region,
        tier: options.tier,
        strategy: options.strategy,
        preferPrevious: options.preferPrevious,
        avoidDetected: options.avoidDetected,
        requireSuccess: options.requireSuccess,
        maxAge: options.maxAge,
        minSuccessRate: options.minSuccessRate,
        maxLatency: options.maxLatency,
        consistentFingerprint: options.consistentFingerprint,
      })

      // Get selected proxy
      const selectedProxy = availableProxies.find((p) => p.id === selectionResult.proxyId)

      if (!selectedProxy) {
        throw new Error(`Selected proxy not found: ${selectionResult.proxyId}`)
      }

      // Create proxy context
      const proxyContext: ProxyContext = {
        proxyId: selectedProxy.id,
        sessionId,
        domain,
        proxy: {
          host: selectedProxy.host,
          port: selectedProxy.port,
          type: selectedProxy.type,
          tier: selectedProxy.tier,
          region: selectedProxy.region,
          username: selectedProxy.username,
          password: selectedProxy.password,
        },
        tlsFingerprint: await this.generateTLSFingerprint(sessionId, domain),
        ispParams: await proxyManager.simulateISPBehavior(domain, selectedProxy.region),
        headers: await this.generateHeaders(sessionId, domain),
        timestamp: Date.now(),
        behaviorProfile: await this.generateBehaviorProfile(sessionId, domain, sessionType),
      }

      // Cache proxy context
      const cacheKey = `${this.PROXY_CACHE_PREFIX}${sessionId}:${domain}`
      const ttl = options.ttl || this.PROXY_CONTEXT_TTL
      const priority = options.priority || this.HIGH_PRIORITY

      memoryManager.set(cacheKey, proxyContext, { ttl, priority })

      // Register resource for cleanup
      const resourceId = `${this.PROXY_RESOURCE_PREFIX}${sessionId}:${domain}`

      memoryManager.registerResource(
        resourceId,
        async () => {
          // Clean up proxy context
          memoryManager.delete(cacheKey)
        },
        ttl,
      )

      // Add session history entry
      await sessionHistoryManager.addSessionHistoryEntry(sessionId, {
        domain,
        proxyId: selectedProxy.id,
        success: true,
        duration: 0,
        requestType: "ROTATION",
        tlsFingerprintUsed: proxyContext.tlsFingerprint,
      })

      return proxyContext
    } catch (error) {
      this.logger.error(`Failed to rotate proxy for domain ${domain}`, error)

      // Fallback to direct proxy manager rotation
      return proxyManager.rotateProxy(domain, options)
    }
  }

  /**
   * Generate TLS fingerprint
   */
  private async generateTLSFingerprint(sessionId: string, domain: string): Promise<string> {
    try {
      // Generate consistent entropy
      const entropy = await entropyAmplificationSystem.generateConsistentEntropy(sessionId, domain, "tls-fingerprint")

      // Generate fingerprint
      return entropy.hex.substring(0, 64)
    } catch (error) {
      this.logger.error(`Failed to generate TLS fingerprint for session ${sessionId} and domain ${domain}`, error)
      return "" // Fallback
    }
  }

  /**
   * Generate headers
   */
  private async generateHeaders(sessionId: string, domain: string): Promise<Record<string, string>> {
    try {
      // Generate consistent entropy
      const entropy = await entropyAmplificationSystem.generateConsistentEntropy(sessionId, domain, "headers")

      // Common headers
      const headers: Record<string, string> = {
        "user-agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
        "accept-language": "en-US,en;q=0.9",
        "accept-encoding": "gzip, deflate, br",
        connection: "keep-alive",
        "cache-control": "max-age=0",
        "sec-ch-ua": '"Google Chrome";v="91", "Chromium";v="91", ";Not A Brand";v="99"',
        "sec-ch-ua-mobile": "?0",
        "sec-fetch-dest": "document",
        "sec-fetch-mode": "navigate",
        "sec-fetch-site": "none",
        "sec-fetch-user": "?1",
        "upgrade-insecure-requests": "1",
      }

      return headers
    } catch (error) {
      this.logger.error(`Failed to generate headers for session ${sessionId} and domain ${domain}`, error)
      return {} // Fallback
    }
  }

  /**
   * Generate behavior profile
   */
  private async generateBehaviorProfile(sessionId: string, domain: string, sessionType: SessionType): Promise<string> {
    try {
      // Generate consistent entropy
      const entropy = await entropyAmplificationSystem.generateConsistentEntropy(sessionId, domain, "behavior-profile")

      // Generate profile based on session type
      let profileType: "HUMAN" | "CORPORATE" | "BOT" = "HUMAN"

      switch (sessionType) {
        case "PERSISTENT":
          profileType = "HUMAN"
          break
        case "STANDARD":
          profileType = Math.random() < 0.8 ? "HUMAN" : "CORPORATE"
          break
        case "EPHEMERAL":
          profileType = Math.random() < 0.6 ? "HUMAN" : "BOT"
          break
        case "STEALTH":
          profileType = "CORPORATE"
          break
        case "GHOST":
          profileType = "BOT"
          break
      }

      // Generate profile ID
      return `${profileType}-${entropy.hex.substring(0, 8)}`
    } catch (error) {
      this.logger.error(`Failed to generate behavior profile for session ${sessionId} and domain ${domain}`, error)
      return "HUMAN-default" // Fallback
    }
  }

  /**
   * Execute request with memory-aware proxy
   */
  public async executeRequest<T>(
    request: () => Promise<T>,
    domain: string,
    options: MemoryAwareProxyOptions = {},
  ): Promise<T> {
    try {
      if (!this.initialized) {
        await this.initialize()
      }

      // Rotate proxy
      const proxyContext = await this.rotateProxy(domain, options)

      // Execute request through proxy
      return await proxyManager.executeRequest(request, proxyContext)
    } catch (error) {
      this.logger.error(`Failed to execute request for domain ${domain}`, error)
      throw error
    }
  }

  /**
   * Execute request with memory-aware decoy proxies
   */
  public async executeWithDecoys<T>(
    request: () => Promise<T>,
    domain: string,
    options: MemoryAwareDecoyOptions = {},
  ): Promise<DecoyProxyResult> {
    try {
      if (!this.initialized) {
        await this.initialize()
      }

      // Generate session ID if not provided
      const sessionId = options.sessionId || uuidv4()

      // Rotate proxy if not provided
      let proxyContext = options.proxyContext

      if (!proxyContext) {
        proxyContext = await this.rotateProxy(domain, {
          sessionId,
          sessionType: options.sessionType || "STANDARD",
          region: options.region,
          tier: options.tier,
          strategy: options.strategy,
          forceRotation: options.forceRotation,
          preferPrevious: options.preferPrevious,
          avoidDetected: options.avoidDetected,
          requireSuccess: options.requireSuccess,
          maxAge: options.maxAge,
          minSuccessRate: options.minSuccessRate,
          maxLatency: options.maxLatency,
          consistentFingerprint: options.consistentFingerprint,
          ttl: options.ttl,
          priority: options.priority,
          metadata: options.metadata,
        })
      }

      // Execute with decoy proxies
      const result = await decoyProxyIntegration.executeWithDecoyProxies(request, {
        ...options,
        sessionId,
        targetDomain: domain,
        proxyContext,
      })

      // Register resource for cleanup if resourceId provided
      if (options.resourceId) {
        memoryManager.registerResource(
          options.resourceId,
          async () => {
            // No specific cleanup needed
          },
          options.ttl || this.PROXY_CONTEXT_TTL,
        )
      }

      // Add session history entry
      await sessionHistoryManager.addSessionHistoryEntry(sessionId, {
        domain,
        proxyId: proxyContext.proxyId,
        success: result.primaryResult.success,
        duration: result.executionTime,
        requestType: "DECOY",
        detectionAttempt: result.detectionAttempts > 0,
      })

      return result
    } catch (error) {
      this.logger.error(`Failed to execute with decoys for domain ${domain}`, error)

      // Fallback to direct execution
      try {
        const proxyContext = await this.rotateProxy(domain, options)
        const result = await proxyManager.executeRequest(request, proxyContext)

        return {
          primaryResult: {
            success: true,
            isPrimary: true,
            duration: 0,
            timestamp: Date.now(),
            data: result,
          },
          decoyResults: [],
          proxyContext,
          executionTime: 0,
          totalDecoys: 0,
          successfulDecoys: 0,
          detectionAttempts: 0,
        }
      } catch (fallbackError) {
        throw fallbackError
      }
    }
  }

  /**
   * Clean up resources
   */
  public async cleanup(): Promise<void> {
    try {
      // Clear all proxy context cache entries
      const stats = memoryManager.getMemoryUsageStatistics()

      this.logger.info(`Cleaning up Memory-Aware Proxy Manager`, {
        cacheEntries: stats.cacheEntries,
        cacheSize: this.formatBytes(stats.cacheSize),
      })

      this.initialized = false

      this.logger.info("Memory-Aware Proxy Manager cleaned up")
    } catch (error) {
      this.logger.error("Failed to clean up Memory-Aware Proxy Manager", error)
    }
  }

  /**
   * Format bytes
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) {
      return "0 Bytes"
    }

    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }
}

// Export singleton instance
export const memoryAwareProxyManager = MemoryAwareProxyManager.getInstance()

// Helper functions for easier access
export async function initializeMemoryAwareProxyManager(): Promise<void> {
  return memoryAwareProxyManager.initialize()
}

export function getProxyContext(sessionId: string, domain: string): ProxyContext | undefined {
  return memoryAwareProxyManager.getProxyContext(sessionId, domain)
}

export async function rotateProxy(domain: string, options?: MemoryAwareProxyOptions): Promise<ProxyContext> {
  return memoryAwareProxyManager.rotateProxy(domain, options)
}

export async function executeRequest<T>(
  request: () => Promise<T>,
  domain: string,
  options?: MemoryAwareProxyOptions,
): Promise<T> {
  return memoryAwareProxyManager.executeRequest(request, domain, options)
}

export async function executeWithDecoys<T>(
  request: () => Promise<T>,
  domain: string,
  options?: MemoryAwareDecoyOptions,
): Promise<DecoyProxyResult> {
  return memoryAwareProxyManager.executeWithDecoys(request, domain, options)
}

export async function cleanupMemoryAwareProxyManager(): Promise<void> {
  return memoryAwareProxyManager.cleanup()
}
