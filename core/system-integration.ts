// SYSTEM INTEGRATION
// Classification: FOUNDER-EYES-ONLY
// Version: 3.2.1-MILITARY

import { Logger } from "../utils/logger"
import { memoryManager } from "../utils/memory-manager"
import { proxyManager } from "./proxy-manager"
import { sessionHistoryManager } from "./session-history-manager"
import { decoyProxyIntegration } from "./decoy-proxy-integration"
import { memoryAwareProxyManager } from "./memory-aware-proxy-manager"
import { entropyAmplificationSystem } from "./entropy-amplification-system"
import { temporalConsistencyVerification } from "./temporal-consistency-verification"
import { postQuantumCrypto } from "../crypto/post-quantum-crypto"
import { performSystemAudit } from "../audit/system-audit"
import { generateSystemReport } from "../audit/system-report"

/**
 * System integration status
 */
export type SystemIntegrationStatus = "INITIALIZING" | "OPERATIONAL" | "DEGRADED" | "CRITICAL" | "SHUTDOWN"

/**
 * System integration
 */
export class SystemIntegration {
  private static instance: SystemIntegration
  private logger: Logger
  private initialized = false
  private status: SystemIntegrationStatus = "INITIALIZING"

  // System health check
  private healthCheckInterval: NodeJS.Timeout | null = null
  private healthCheckIntervalMs = 5 * 60 * 1000 // 5 minutes

  // Component initialization status
  private componentStatus: Record<string, boolean> = {
    memoryManager: false,
    proxyManager: false,
    sessionHistoryManager: false,
    decoyProxyIntegration: false,
    memoryAwareProxyManager: false,
    entropyAmplificationSystem: false,
    temporalConsistencyVerification: false,
    postQuantumCrypto: false,
  }

  private constructor() {
    this.logger = new Logger("SystemIntegration", "MILITARY")
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): SystemIntegration {
    if (!SystemIntegration.instance) {
      SystemIntegration.instance = new SystemIntegration()
    }
    return SystemIntegration.instance
  }

  /**
   * Initialize system integration
   */
  public async initialize(): Promise<void> {
    if (this.initialized) {
      return
    }

    try {
      this.logger.info("Initializing System Integration")

      // Initialize components
      await this.initializeComponents()

      // Start health check
      this.startHealthCheck()

      this.initialized = true
      this.status = "OPERATIONAL"

      this.logger.info("System Integration initialized successfully")

      // Perform initial system audit
      const auditResults = await performSystemAudit()
      const passCount = auditResults.filter((r) => r.status === "PASS").length
      const warnCount = auditResults.filter((r) => r.status === "WARN").length
      const failCount = auditResults.filter((r) => r.status === "FAIL").length

      this.logger.info(
        `Initial system audit completed: ${passCount} passed, ${warnCount} warnings, ${failCount} failures`,
      )

      // Generate system report
      const report = await generateSystemReport()

      this.logger.info(`Initial system report generated: Status ${report.systemStatus}`, {
        securityScore: report.securityScore,
        performanceScore: report.performanceScore,
        integrityScore: report.integrityScore,
      })

      // Update status based on report
      if (report.systemStatus === "CRITICAL") {
        this.status = "CRITICAL"
      } else if (report.systemStatus === "DEGRADED") {
        this.status = "DEGRADED"
      }
    } catch (error) {
      this.logger.error("Failed to initialize System Integration", error)
      this.status = "CRITICAL"
      throw new Error(`SYSTEM_INTEGRATION_INITIALIZATION_FAILED: ${error.message}`)
    }
  }

  /**
   * Initialize components
   */
  private async initializeComponents(): Promise<void> {
    try {
      // Initialize memory manager first
      await this.initializeComponent("memoryManager", async () => {
        await memoryManager.initialize()
      })

      // Initialize entropy amplification system
      await this.initializeComponent("entropyAmplificationSystem", async () => {
        await entropyAmplificationSystem.initialize()
      })

      // Initialize post-quantum crypto
      await this.initializeComponent("postQuantumCrypto", async () => {
        await postQuantumCrypto.initialize()
      })

      // Initialize temporal consistency verification
      await this.initializeComponent("temporalConsistencyVerification", async () => {
        await temporalConsistencyVerification.initialize()
      })

      // Initialize proxy manager
      await this.initializeComponent("proxyManager", async () => {
        await proxyManager.initialize()
      })

      // Initialize session history manager
      await this.initializeComponent("sessionHistoryManager", async () => {
        await sessionHistoryManager.initialize()
      })

      // Initialize decoy proxy integration
      await this.initializeComponent("decoyProxyIntegration", async () => {
        await decoyProxyIntegration.initialize()
      })

      // Initialize memory-aware proxy manager
      await this.initializeComponent("memoryAwareProxyManager", async () => {
        await memoryAwareProxyManager.initialize()
      })
    } catch (error) {
      this.logger.error("Failed to initialize components", error)
      throw error
    }
  }

  /**
   * Initialize component
   */
  private async initializeComponent(name: string, initializer: () => Promise<void>): Promise<void> {
    try {
      this.logger.info(`Initializing component: ${name}`)
      await initializer()
      this.componentStatus[name] = true
      this.logger.info(`Component initialized successfully: ${name}`)
    } catch (error) {
      this.logger.error(`Failed to initialize component: ${name}`, error)
      this.componentStatus[name] = false
      throw error
    }
  }

  /**
   * Start health check
   */
  private startHealthCheck(): void {
    try {
      // Clear existing interval if any
      if (this.healthCheckInterval) {
        clearInterval(this.healthCheckInterval)
      }

      // Start health check interval
      this.healthCheckInterval = setInterval(async () => {
        try {
          await this.performHealthCheck()
        } catch (error) {
          this.logger.error("Error in health check interval", error)
        }
      }, this.healthCheckIntervalMs)

      this.logger.info(`Started health check interval (${this.healthCheckIntervalMs}ms)`)
    } catch (error) {
      this.logger.error("Failed to start health check", error)
      throw error
    }
  }

  /**
   * Perform health check
   */
  private async performHealthCheck(): Promise<void> {
    try {
      this.logger.info("Performing system health check")

      // Check memory usage
      const memoryStats = memoryManager.getMemoryUsageStatistics()
      const heapUsedPercent = (memoryStats.heapUsed / memoryStats.heapTotal) * 100

      this.logger.info(`Memory usage: ${heapUsedPercent.toFixed(2)}%`, {
        heapUsed: this.formatBytes(memoryStats.heapUsed),
        heapTotal: this.formatBytes(memoryStats.heapTotal),
        rss: this.formatBytes(memoryStats.rss),
        cacheSize: this.formatBytes(memoryStats.cacheSize),
        cacheEntries: memoryStats.cacheEntries,
        cacheHitRate: memoryStats.cacheHitRate.toFixed(2),
      })

      // Perform system audit
      const auditResults = await performSystemAudit()
      const passCount = auditResults.filter((r) => r.status === "PASS").length
      const warnCount = auditResults.filter((r) => r.status === "WARN").length
      const failCount = auditResults.filter((r) => r.status === "FAIL").length

      this.logger.info(`System audit completed: ${passCount} passed, ${warnCount} warnings, ${failCount} failures`)

      // Generate system report
      const report = await generateSystemReport()

      this.logger.info(`System report generated: Status ${report.systemStatus}`, {
        securityScore: report.securityScore,
        performanceScore: report.performanceScore,
        integrityScore: report.integrityScore,
      })

      // Update status based on report
      if (report.systemStatus === "CRITICAL") {
        this.status = "CRITICAL"
        this.logger.critical("System status is CRITICAL", {
          criticalIssues: report.criticalIssues,
        })
      } else if (report.systemStatus === "DEGRADED") {
        this.status = "DEGRADED"
        this.logger.warn("System status is DEGRADED", {
          warnings: report.warnings,
        })
      } else {
        this.status = "OPERATIONAL"
      }

      // Check if any components need reinitialization
      for (const [name, status] of Object.entries(this.componentStatus)) {
        if (!status) {
          this.logger.warn(`Component ${name} needs reinitialization`)

          // Attempt to reinitialize component
          try {
            switch (name) {
              case "memoryManager":
                await memoryManager.initialize()
                break
              case "proxyManager":
                await proxyManager.initialize()
                break
              case "sessionHistoryManager":
                await sessionHistoryManager.initialize()
                break
              case "decoyProxyIntegration":
                await decoyProxyIntegration.initialize()
                break
              case "memoryAwareProxyManager":
                await memoryAwareProxyManager.initialize()
                break
              case "entropyAmplificationSystem":
                await entropyAmplificationSystem.initialize()
                break
              case "temporalConsistencyVerification":
                await temporalConsistencyVerification.initialize()
                break
              case "postQuantumCrypto":
                await postQuantumCrypto.initialize()
                break
            }

            this.componentStatus[name] = true
            this.logger.info(`Component ${name} reinitialized successfully`)
          } catch (error) {
            this.logger.error(`Failed to reinitialize component ${name}`, error)
          }
        }
      }
    } catch (error) {
      this.logger.error("Failed to perform health check", error)
    }
  }

  /**
   * Get system status
   */
  public getStatus(): SystemIntegrationStatus {
    return this.status
  }

  /**
   * Get component status
   */
  public getComponentStatus(): Record<string, boolean> {
    return { ...this.componentStatus }
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

  /**
   * Shutdown system
   */
  public async shutdown(): Promise<void> {
    try {
      this.logger.info("Shutting down System Integration")

      this.status = "SHUTDOWN"

      // Stop health check
      if (this.healthCheckInterval) {
        clearInterval(this.healthCheckInterval)
        this.healthCheckInterval = null
      }

      // Clean up components in reverse order
      await memoryAwareProxyManager.cleanup()
      await decoyProxyIntegration.cleanup()
      await sessionHistoryManager.cleanup()
      await proxyManager.cleanup()
      await temporalConsistencyVerification.cleanup()
      await postQuantumCrypto.cleanup()
      await entropyAmplificationSystem.cleanup()
      await memoryManager.cleanup()

      // Reset component status
      for (const name in this.componentStatus) {
        this.componentStatus[name] = false
      }

      this.initialized = false

      this.logger.info("System Integration shut down successfully")
    } catch (error) {
      this.logger.error("Failed to shut down System Integration", error)
      throw error
    }
  }
}

// Export singleton instance
export const systemIntegration = SystemIntegration.getInstance()

// Helper functions for easier access
export async function initializeSystemIntegration(): Promise<void> {
  return systemIntegration.initialize()
}

export function getSystemStatus(): SystemIntegrationStatus {
  return systemIntegration.getStatus()
}

export function getComponentStatus(): Record<string, boolean> {
  return systemIntegration.getComponentStatus()
}

export async function shutdownSystem(): Promise<void> {
  return systemIntegration.shutdown()
}
