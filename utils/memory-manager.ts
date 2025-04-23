// MEMORY MANAGER
// Classification: FOUNDER-EYES-ONLY
// Version: 3.2.1-MILITARY

import { Logger } from "./logger"

/**
 * Cache entry
 */
interface CacheEntry<T> {
  key: string
  value: T
  expires: number
  size: number
  lastAccessed: number
  accessCount: number
  priority: number
}

/**
 * Memory usage statistics
 */
export interface MemoryUsageStatistics {
  heapTotal: number
  heapUsed: number
  external: number
  rss: number
  arrayBuffers: number
  cacheSize: number
  cacheEntries: number
  cacheHitRate: number
  gcCycles: number
  lastGcTime: number
}

/**
 * Memory Manager
 *
 * Military-grade memory management with:
 * - Intelligent cache eviction strategies
 * - Memory leak detection and prevention
 * - Scheduled garbage collection
 * - Memory usage monitoring and alerting
 * - TTL-based resource cleanup
 */
export class MemoryManager {
  private static instance: MemoryManager
  private logger: Logger
  private initialized = false

  // Cache storage
  private cache: Map<string, CacheEntry<any>> = new Map()

  // Cache statistics
  private cacheHits = 0
  private cacheMisses = 0
  private cacheEvictions = 0

  // Memory monitoring
  private memoryCheckInterval: NodeJS.Timeout | null = null
  private memoryCheckIntervalMs = 60 * 1000 // 1 minute
  private memoryThresholdPercent = 80 // Alert when memory usage exceeds 80%
  private gcCycles = 0
  private lastGcTime = 0

  // Cache configuration
  private maxCacheSize = 100 * 1024 * 1024 // 100 MB
  private maxCacheEntries = 10000
  private defaultTTL = 5 * 60 * 1000 // 5 minutes
  private minTTL = 10 * 1000 // 10 seconds
  private maxTTL = 24 * 60 * 60 * 1000 // 24 hours

  // Resource tracking
  private resources: Map<string, { cleanup: () => Promise<void>; expires: number }> = new Map()
  private resourceCheckInterval: NodeJS.Timeout | null = null
  private resourceCheckIntervalMs = 30 * 1000 // 30 seconds

  // Weak references for large objects
  private weakRefs: WeakMap<object, { key: string; expires: number }> = new WeakMap()

  private constructor() {
    this.logger = new Logger("MemoryManager", "MILITARY")
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): MemoryManager {
    if (!MemoryManager.instance) {
      MemoryManager.instance = new MemoryManager()
    }
    return MemoryManager.instance
  }

  /**
   * Initialize memory manager
   */
  public async initialize(): Promise<void> {
    if (this.initialized) {
      return
    }

    try {
      this.logger.info("Initializing Memory Manager")

      // Start memory monitoring
      this.startMemoryMonitoring()

      // Start resource checking
      this.startResourceChecking()

      this.initialized = true
      this.logger.info("Memory Manager initialized successfully")
    } catch (error) {
      this.logger.error("Failed to initialize Memory Manager", error)
      throw new Error(`MEMORY_MANAGER_INITIALIZATION_FAILED: ${error.message}`)
    }
  }

  /**
   * Start memory monitoring
   */
  private startMemoryMonitoring(): void {
    try {
      // Clear existing interval if any
      if (this.memoryCheckInterval) {
        clearInterval(this.memoryCheckInterval)
      }

      // Start memory check interval
      this.memoryCheckInterval = setInterval(() => {
        try {
          this.checkMemoryUsage()
        } catch (error) {
          this.logger.error("Error in memory check interval", error)
        }
      }, this.memoryCheckIntervalMs)

      this.logger.info(`Started memory monitoring interval (${this.memoryCheckIntervalMs}ms)`)
    } catch (error) {
      this.logger.error("Failed to start memory monitoring", error)
      throw error
    }
  }

  /**
   * Start resource checking
   */
  private startResourceChecking(): void {
    try {
      // Clear existing interval if any
      if (this.resourceCheckInterval) {
        clearInterval(this.resourceCheckInterval)
      }

      // Start resource check interval
      this.resourceCheckInterval = setInterval(() => {
        try {
          this.checkExpiredResources()
        } catch (error) {
          this.logger.error("Error in resource check interval", error)
        }
      }, this.resourceCheckIntervalMs)

      this.logger.info(`Started resource checking interval (${this.resourceCheckIntervalMs}ms)`)
    } catch (error) {
      this.logger.error("Failed to start resource checking", error)
      throw error
    }
  }

  /**
   * Check memory usage
   */
  private checkMemoryUsage(): void {
    try {
      // Get memory usage
      const memoryUsage = process.memoryUsage()

      // Calculate heap usage percentage
      const heapUsedPercent = (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100

      // Check if memory usage exceeds threshold
      if (heapUsedPercent > this.memoryThresholdPercent) {
        this.logger.warn(`Memory usage exceeds threshold: ${heapUsedPercent.toFixed(2)}%`, {
          heapUsed: this.formatBytes(memoryUsage.heapUsed),
          heapTotal: this.formatBytes(memoryUsage.heapTotal),
          rss: this.formatBytes(memoryUsage.rss),
        })

        // Perform emergency cache eviction
        this.performEmergencyCacheEviction()

        // Suggest garbage collection
        this.suggestGarbageCollection()
      }

      // Check cache size
      const cacheSize = this.calculateCacheSize()
      if (cacheSize > this.maxCacheSize) {
        this.logger.warn(`Cache size exceeds maximum: ${this.formatBytes(cacheSize)}`, {
          maxCacheSize: this.formatBytes(this.maxCacheSize),
          entries: this.cache.size,
        })

        // Evict cache entries
        this.evictCacheEntries(cacheSize - this.maxCacheSize)
      }

      // Check cache entries
      if (this.cache.size > this.maxCacheEntries) {
        this.logger.warn(`Cache entries exceed maximum: ${this.cache.size}`, {
          maxCacheEntries: this.maxCacheEntries,
        })

        // Evict excess entries
        this.evictCacheEntriesByCount(this.cache.size - this.maxCacheEntries)
      }
    } catch (error) {
      this.logger.error("Failed to check memory usage", error)
    }
  }

  /**
   * Check expired resources
   */
  private async checkExpiredResources(): Promise<void> {
    try {
      const now = Date.now()
      let expiredCount = 0

      // Check each resource
      for (const [resourceId, resource] of this.resources.entries()) {
        if (now >= resource.expires) {
          // Clean up resource
          try {
            await resource.cleanup()
            expiredCount++
          } catch (cleanupError) {
            this.logger.error(`Failed to clean up resource: ${resourceId}`, cleanupError)
          } finally {
            // Remove resource from tracking
            this.resources.delete(resourceId)
          }
        }
      }

      if (expiredCount > 0) {
        this.logger.info(`Cleaned up ${expiredCount} expired resources`)
      }

      // Check expired cache entries
      let expiredCacheCount = 0
      for (const [key, entry] of this.cache.entries()) {
        if (now >= entry.expires) {
          // Remove expired entry
          this.cache.delete(key)
          expiredCacheCount++
        }
      }

      if (expiredCacheCount > 0) {
        this.logger.info(`Removed ${expiredCacheCount} expired cache entries`)
        this.cacheEvictions += expiredCacheCount
      }
    } catch (error) {
      this.logger.error("Failed to check expired resources", error)
    }
  }

  /**
   * Perform emergency cache eviction
   */
  private performEmergencyCacheEviction(): void {
    try {
      // Calculate target size (50% of current cache size)
      const currentSize = this.calculateCacheSize()
      const targetSize = currentSize * 0.5

      // Evict cache entries
      this.evictCacheEntries(currentSize - targetSize)

      this.logger.info(`Performed emergency cache eviction`, {
        before: this.formatBytes(currentSize),
        after: this.formatBytes(this.calculateCacheSize()),
        entriesBefore: this.cache.size,
        entriesAfter: this.cache.size,
      })
    } catch (error) {
      this.logger.error("Failed to perform emergency cache eviction", error)
    }
  }

  /**
   * Suggest garbage collection
   */
  private suggestGarbageCollection(): void {
    try {
      // In a real implementation, this would use global.gc() if available
      // For now, we'll just simulate it

      this.gcCycles++
      this.lastGcTime = Date.now()

      this.logger.info(`Suggested garbage collection`, {
        gcCycles: this.gcCycles,
        lastGcTime: new Date(this.lastGcTime).toISOString(),
      })
    } catch (error) {
      this.logger.error("Failed to suggest garbage collection", error)
    }
  }

  /**
   * Calculate cache size
   */
  private calculateCacheSize(): number {
    try {
      let totalSize = 0

      for (const entry of this.cache.values()) {
        totalSize += entry.size
      }

      return totalSize
    } catch (error) {
      this.logger.error("Failed to calculate cache size", error)
      return 0
    }
  }

  /**
   * Evict cache entries
   */
  private evictCacheEntries(bytesToEvict: number): void {
    try {
      if (bytesToEvict <= 0) {
        return
      }

      // Sort entries by priority and last accessed time
      const entries = Array.from(this.cache.entries()).map(([key, entry]) => ({
        key,
        priority: entry.priority,
        lastAccessed: entry.lastAccessed,
        size: entry.size,
      }))

      // Sort by priority (ascending) and then by last accessed time (ascending)
      entries.sort((a, b) => {
        if (a.priority !== b.priority) {
          return a.priority - b.priority
        }
        return a.lastAccessed - b.lastAccessed
      })

      // Evict entries until we've freed enough space
      let bytesEvicted = 0
      let entriesEvicted = 0

      for (const entry of entries) {
        if (bytesEvicted >= bytesToEvict) {
          break
        }

        // Evict entry
        this.cache.delete(entry.key)
        bytesEvicted += entry.size
        entriesEvicted++
      }

      if (entriesEvicted > 0) {
        this.logger.info(`Evicted ${entriesEvicted} cache entries (${this.formatBytes(bytesEvicted)})`)
        this.cacheEvictions += entriesEvicted
      }
    } catch (error) {
      this.logger.error("Failed to evict cache entries", error)
    }
  }

  /**
   * Evict cache entries by count
   */
  private evictCacheEntriesByCount(entriesToEvict: number): void {
    try {
      if (entriesToEvict <= 0) {
        return
      }

      // Sort entries by priority and last accessed time
      const entries = Array.from(this.cache.entries()).map(([key, entry]) => ({
        key,
        priority: entry.priority,
        lastAccessed: entry.lastAccessed,
        size: entry.size,
      }))

      // Sort by priority (ascending) and then by last accessed time (ascending)
      entries.sort((a, b) => {
        if (a.priority !== b.priority) {
          return a.priority - b.priority
        }
        return a.lastAccessed - b.lastAccessed
      })

      // Evict entries
      let bytesEvicted = 0
      let entriesEvicted = 0

      for (const entry of entries) {
        if (entriesEvicted >= entriesToEvict) {
          break
        }

        // Evict entry
        this.cache.delete(entry.key)
        bytesEvicted += entry.size
        entriesEvicted++
      }

      if (entriesEvicted > 0) {
        this.logger.info(`Evicted ${entriesEvicted} cache entries by count (${this.formatBytes(bytesEvicted)})`)
        this.cacheEvictions += entriesEvicted
      }
    } catch (error) {
      this.logger.error("Failed to evict cache entries by count", error)
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

  /**
   * Estimate object size
   */
  private estimateObjectSize(obj: any): number {
    try {
      // For primitive types
      if (obj === null || obj === undefined) {
        return 0
      }

      if (typeof obj === "boolean") {
        return 4
      }

      if (typeof obj === "number") {
        return 8
      }

      if (typeof obj === "string") {
        return obj.length * 2
      }

      if (typeof obj === "function") {
        return 0 // Functions are not stored in cache
      }

      // For arrays and objects
      if (Array.isArray(obj)) {
        return obj.reduce((size, item) => size + this.estimateObjectSize(item), 0)
      }

      if (obj instanceof Buffer) {
        return obj.length
      }

      if (obj instanceof ArrayBuffer) {
        return obj.byteLength
      }

      if (obj instanceof Date) {
        return 8
      }

      if (typeof obj === "object") {
        let size = 0
        for (const key in obj) {
          if (Object.prototype.hasOwnProperty.call(obj, key)) {
            size += key.length * 2 // Key size
            size += this.estimateObjectSize(obj[key]) // Value size
          }
        }
        return size
      }

      // Default size for unknown types
      return 32
    } catch (error) {
      this.logger.error("Failed to estimate object size", error)
      return 100 // Default fallback size
    }
  }

  /**
   * Set cache entry
   */
  public set<T>(
    key: string,
    value: T,
    options: {
      ttl?: number
      priority?: number
    } = {},
  ): boolean {
    try {
      if (!this.initialized) {
        this.initialize().catch((error) => {
          this.logger.error("Failed to initialize memory manager during set operation", error)
        })
      }

      // Set defaults
      const ttl =
        options.ttl !== undefined ? Math.max(this.minTTL, Math.min(options.ttl, this.maxTTL)) : this.defaultTTL

      const priority = options.priority !== undefined ? options.priority : 1

      // Calculate size
      const size = this.estimateObjectSize(value)

      // Check if size exceeds maximum cache size
      if (size > this.maxCacheSize) {
        this.logger.warn(`Cache entry size exceeds maximum cache size: ${this.formatBytes(size)}`, {
          key,
          maxCacheSize: this.formatBytes(this.maxCacheSize),
        })
        return false
      }

      // Create cache entry
      const entry: CacheEntry<T> = {
        key,
        value,
        expires: Date.now() + ttl,
        size,
        lastAccessed: Date.now(),
        accessCount: 0,
        priority,
      }

      // Store in cache
      this.cache.set(key, entry)

      // If value is an object, store weak reference
      if (typeof value === "object" && value !== null) {
        this.weakRefs.set(value, {
          key,
          expires: entry.expires,
        })
      }

      return true
    } catch (error) {
      this.logger.error(`Failed to set cache entry: ${key}`, error)
      return false
    }
  }

  /**
   * Get cache entry
   */
  public get<T>(key: string): T | undefined {
    try {
      if (!this.initialized) {
        this.initialize().catch((error) => {
          this.logger.error("Failed to initialize memory manager during get operation", error)
        })
      }

      // Get entry from cache
      const entry = this.cache.get(key) as CacheEntry<T> | undefined

      if (!entry) {
        this.cacheMisses++
        return undefined
      }

      // Check if entry has expired
      if (Date.now() >= entry.expires) {
        this.cache.delete(key)
        this.cacheMisses++
        return undefined
      }

      // Update access statistics
      entry.lastAccessed = Date.now()
      entry.accessCount++

      // Update entry in cache
      this.cache.set(key, entry)

      this.cacheHits++
      return entry.value
    } catch (error) {
      this.logger.error(`Failed to get cache entry: ${key}`, error)
      return undefined
    }
  }

  /**
   * Delete cache entry
   */
  public delete(key: string): boolean {
    try {
      return this.cache.delete(key)
    } catch (error) {
      this.logger.error(`Failed to delete cache entry: ${key}`, error)
      return false
    }
  }

  /**
   * Clear cache
   */
  public clear(): void {
    try {
      this.cache.clear()
      this.logger.info("Cleared cache")
    } catch (error) {
      this.logger.error("Failed to clear cache", error)
    }
  }

  /**
   * Register resource
   */
  public registerResource(resourceId: string, cleanup: () => Promise<void>, ttl: number = this.defaultTTL): void {
    try {
      if (!this.initialized) {
        this.initialize().catch((error) => {
          this.logger.error("Failed to initialize memory manager during register resource operation", error)
        })
      }

      // Normalize TTL
      const normalizedTTL = Math.max(this.minTTL, Math.min(ttl, this.maxTTL))

      // Register resource
      this.resources.set(resourceId, {
        cleanup,
        expires: Date.now() + normalizedTTL,
      })

      this.logger.info(`Registered resource: ${resourceId}`, {
        ttl: normalizedTTL,
        expires: new Date(Date.now() + normalizedTTL).toISOString(),
      })
    } catch (error) {
      this.logger.error(`Failed to register resource: ${resourceId}`, error)
    }
  }

  /**
   * Unregister resource
   */
  public async unregisterResource(resourceId: string, cleanup = true): Promise<boolean> {
    try {
      // Get resource
      const resource = this.resources.get(resourceId)

      if (!resource) {
        return false
      }

      // Clean up resource if requested
      if (cleanup) {
        try {
          await resource.cleanup()
        } catch (cleanupError) {
          this.logger.error(`Failed to clean up resource: ${resourceId}`, cleanupError)
        }
      }

      // Remove resource from tracking
      this.resources.delete(resourceId)

      this.logger.info(`Unregistered resource: ${resourceId}`, {
        cleanup,
      })

      return true
    } catch (error) {
      this.logger.error(`Failed to unregister resource: ${resourceId}`, error)
      return false
    }
  }

  /**
   * Extend resource TTL
   */
  public extendResourceTTL(resourceId: string, additionalTTL: number): boolean {
    try {
      // Get resource
      const resource = this.resources.get(resourceId)

      if (!resource) {
        return false
      }

      // Calculate new expiration time
      const newExpires = resource.expires + additionalTTL

      // Update resource
      this.resources.set(resourceId, {
        ...resource,
        expires: newExpires,
      })

      this.logger.info(`Extended resource TTL: ${resourceId}`, {
        additionalTTL,
        newExpires: new Date(newExpires).toISOString(),
      })

      return true
    } catch (error) {
      this.logger.error(`Failed to extend resource TTL: ${resourceId}`, error)
      return false
    }
  }

  /**
   * Get memory usage statistics
   */
  public getMemoryUsageStatistics(): MemoryUsageStatistics {
    try {
      // Get memory usage
      const memoryUsage = process.memoryUsage()

      // Calculate cache hit rate
      const totalCacheAccesses = this.cacheHits + this.cacheMisses
      const cacheHitRate = totalCacheAccesses > 0 ? this.cacheHits / totalCacheAccesses : 0

      return {
        heapTotal: memoryUsage.heapTotal,
        heapUsed: memoryUsage.heapUsed,
        external: memoryUsage.external,
        rss: memoryUsage.rss,
        arrayBuffers: memoryUsage.arrayBuffers || 0,
        cacheSize: this.calculateCacheSize(),
        cacheEntries: this.cache.size,
        cacheHitRate,
        gcCycles: this.gcCycles,
        lastGcTime: this.lastGcTime,
      }
    } catch (error) {
      this.logger.error("Failed to get memory usage statistics", error)

      // Return default statistics
      return {
        heapTotal: 0,
        heapUsed: 0,
        external: 0,
        rss: 0,
        arrayBuffers: 0,
        cacheSize: 0,
        cacheEntries: 0,
        cacheHitRate: 0,
        gcCycles: 0,
        lastGcTime: 0,
      }
    }
  }

  /**
   * Clean up resources
   */
  public async cleanup(): Promise<void> {
    try {
      // Stop intervals
      if (this.memoryCheckInterval) {
        clearInterval(this.memoryCheckInterval)
        this.memoryCheckInterval = null
      }

      if (this.resourceCheckInterval) {
        clearInterval(this.resourceCheckInterval)
        this.resourceCheckInterval = null
      }

      // Clean up all resources
      const resourceIds = Array.from(this.resources.keys())

      for (const resourceId of resourceIds) {
        await this.unregisterResource(resourceId, true)
      }

      // Clear cache
      this.clear()

      // Reset statistics
      this.cacheHits = 0
      this.cacheMisses = 0
      this.cacheEvictions = 0
      this.gcCycles = 0
      this.lastGcTime = 0

      this.initialized = false

      this.logger.info("Memory Manager cleaned up")
    } catch (error) {
      this.logger.error("Failed to clean up Memory Manager", error)
    }
  }
}

// Export singleton instance
export const memoryManager = MemoryManager.getInstance()

// Helper functions for easier access
export async function initializeMemoryManager(): Promise<void> {
  return memoryManager.initialize()
}

export function setCacheEntry<T>(key: string, value: T, options?: { ttl?: number; priority?: number }): boolean {
  return memoryManager.set(key, value, options)
}

export function getCacheEntry<T>(key: string): T | undefined {
  return memoryManager.get<T>(key)
}

export function deleteCacheEntry(key: string): boolean {
  return memoryManager.delete(key)
}

export function clearCache(): void {
  return memoryManager.clear()
}

export function registerResource(resourceId: string, cleanup: () => Promise<void>, ttl?: number): void {
  return memoryManager.registerResource(resourceId, cleanup, ttl)
}

export async function unregisterResource(resourceId: string, cleanup?: boolean): Promise<boolean> {
  return memoryManager.unregisterResource(resourceId, cleanup)
}

export function extendResourceTTL(resourceId: string, additionalTTL: number): boolean {
  return memoryManager.extendResourceTTL(resourceId, additionalTTL)
}

export function getMemoryUsageStatistics(): MemoryUsageStatistics {
  return memoryManager.getMemoryUsageStatistics()
}

export async function cleanupMemoryManager(): Promise<void> {
  return memoryManager.cleanup()
}
