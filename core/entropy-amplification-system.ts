// ENTROPY AMPLIFICATION SYSTEM
// Classification: FOUNDER-EYES-ONLY
// Version: 3.2.1-MILITARY

import { randomBytes, createHash, createHmac } from "crypto"
import { Logger } from "../utils/logger"

/**
 * Entropy quality
 */
export type EntropyQuality = "LOW" | "MEDIUM" | "HIGH" | "MILITARY"

/**
 * Entropy source type
 */
export type EntropySourceType = "system" | "hardware" | "quantum" | "behavioral" | "environmental" | "hybrid"

/**
 * Entropy result
 */
export interface EntropyResult {
  bytes: Buffer
  hex: string
  quality: EntropyQuality
  source: string
  timestamp: number
  signature: string
}

/**
 * Entropy source
 */
export interface EntropySource {
  id: string
  name: string
  type: EntropySourceType
  priority: number // 1-10, higher is better
  reliability: number // 0-1
  consecutiveFailures: number
  generate: () => Promise<string> // Returns hex string
}

/**
 * Entropy pool
 */
interface EntropyPool {
  id: string
  buffer: Buffer
  quality: EntropyQuality
  lastRefill: number
  size: number
  usageCount: number
  entropyRemaining: number
}

/**
 * Entropy generation options
 */
export interface EntropyGenerationOptions {
  size?: number
  quality?: EntropyQuality
  purpose?: string
  consistentWith?: string
  seed?: string
  driftFactor?: number
}

/**
 * Entropy verification result
 */
export interface EntropyVerificationResult {
  quality: EntropyQuality
  score: number // 0-1
  source: string
  timestamp: number
}

/**
 * Entropy Amplification System
 *
 * Military-grade entropy amplification system with:
 * - Multi-source entropy collection and mixing
 * - Quantum-resistant entropy generation
 * - Adaptive entropy pool management
 * - Entropy quality verification
 * - Consistent entropy derivation
 * - Entropy drift for non-deterministic behavior
 */
export class EntropyAmplificationSystem {
  private static instance: EntropyAmplificationSystem
  private logger: Logger
  private initialized = false

  // Entropy sources
  private entropySources: Map<string, EntropySource> = new Map()
  private sourceFailureThreshold = 5

  // Entropy pools
  private entropyPools: Map<string, EntropyPool> = new Map()
  private poolRefillThreshold = 0.3 // Refill when 30% remaining
  private poolSizes = {
    LOW: 1024, // 1 KB
    MEDIUM: 4096, // 4 KB
    HIGH: 16384, // 16 KB
    MILITARY: 65536, // 64 KB
  }

  // Entropy cache for consistent derivation
  private entropyCache: Map<string, { entropy: Buffer; expires: number }> = new Map()
  private entropyCacheTTL = 5 * 60 * 1000 // 5 minutes

  // Entropy mixing rounds
  private mixingRounds = {
    LOW: 2,
    MEDIUM: 4,
    HIGH: 8,
    MILITARY: 16,
  }

  // Entropy collection
  private collectionInterval: NodeJS.Timeout | null = null
  private collectionIntervalMs = 60 * 1000 // 1 minute

  // Entropy verification
  private verificationThresholds = {
    LOW: 0.3,
    MEDIUM: 0.5,
    HIGH: 0.7,
    MILITARY: 0.9,
  }

  // Entropy drift
  private driftFactors = {
    LOW: 0.05,
    MEDIUM: 0.1,
    HIGH: 0.15,
    MILITARY: 0.2,
  }

  // Entropy priority queue for critical operations
  private priorityQueue: Array<{
    priority: number
    operation: () => Promise<void>
    resolve: (value: any) => void
    reject: (error: any) => void
  }> = []
  private processingQueue = false

  private constructor() {
    this.logger = new Logger("EntropyAmplificationSystem", "MILITARY")
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): EntropyAmplificationSystem {
    if (!EntropyAmplificationSystem.instance) {
      EntropyAmplificationSystem.instance = new EntropyAmplificationSystem()
    }
    return EntropyAmplificationSystem.instance
  }

  /**
   * Initialize entropy amplification system
   */
  public async initialize(): Promise<void> {
    if (this.initialized) {
      return
    }

    try {
      this.logger.info("Initializing Entropy Amplification System")

      // Register default entropy sources
      this.registerDefaultEntropySources()

      // Register drand distributed randomness beacon
      this.registerEntropySource({
        id: "drand-v1",
        name: "Distributed Randomness Beacon",
        type: "quantum",
        priority: 10, // Highest priority
        reliability: 0.99,
        consecutiveFailures: 0,
        generate: async () => {
          try {
            const res = await fetch("https://api.drand.sh/public/latest")
            if (!res.ok) {
              throw new Error(`Drand API returned status ${res.status}`)
            }
            const data = await res.json()
            return createHash("sha256").update(data.randomness).digest("hex")
          } catch (error) {
            this.logger.error("Failed to fetch entropy from drand beacon", error)
            throw error
          }
        },
      })

      // Initialize entropy pools
      await this.initializeEntropyPools()

      // Start entropy collection
      this.startEntropyCollection()

      this.initialized = true
      this.logger.info("Entropy Amplification System initialized successfully")
    } catch (error) {
      this.logger.error("Failed to initialize Entropy Amplification System", error)
      throw new Error(`ENTROPY_AMPLIFICATION_INITIALIZATION_FAILED: ${error.message}`)
    }
  }

  /**
   * Register default entropy sources
   */
  private registerDefaultEntropySources(): void {
    try {
      // System entropy source (Node.js crypto.randomBytes)
      this.registerEntropySource({
        id: "system-crypto",
        name: "System Cryptographic RNG",
        type: "system",
        priority: 5,
        reliability: 0.95,
        consecutiveFailures: 0,
        generate: async () => {
          return randomBytes(64).toString("hex")
        },
      })

      // Hardware entropy source (simulated)
      this.registerEntropySource({
        id: "hardware-rng",
        name: "Hardware RNG",
        type: "hardware",
        priority: 7,
        reliability: 0.9,
        consecutiveFailures: 0,
        generate: async () => {
          // Simulate hardware RNG
          // In a real implementation, this would use a hardware RNG
          return new Promise((resolve) => {
            setTimeout(() => {
              resolve(randomBytes(64).toString("hex"))
            }, 50)
          })
        },
      })

      // Environmental entropy source (simulated)
      this.registerEntropySource({
        id: "environmental",
        name: "Environmental Entropy",
        type: "environmental",
        priority: 3,
        reliability: 0.7,
        consecutiveFailures: 0,
        generate: async () => {
          // Simulate environmental entropy
          // In a real implementation, this would use environmental factors
          const envData = {
            timestamp: Date.now(),
            processInfo: {
              pid: process.pid,
              ppid: process.ppid,
              title: process.title,
              arch: process.arch,
              platform: process.platform,
              version: process.version,
              memoryUsage: process.memoryUsage(),
              uptime: process.uptime(),
            },
          }

          return createHash("sha256").update(JSON.stringify(envData)).digest("hex")
        },
      })

      // Behavioral entropy source (simulated)
      this.registerEntropySource({
        id: "behavioral",
        name: "Behavioral Entropy",
        type: "behavioral",
        priority: 2,
        reliability: 0.6,
        consecutiveFailures: 0,
        generate: async () => {
          // Simulate behavioral entropy
          // In a real implementation, this would use behavioral factors
          const behavioralData = {
            timestamp: Date.now(),
            timingJitter: Math.random() * 100,
            operationSequence: Math.floor(Math.random() * 1000000),
          }

          return createHash("sha256").update(JSON.stringify(behavioralData)).digest("hex")
        },
      })

      // Hybrid entropy source (combination of other sources)
      this.registerEntropySource({
        id: "hybrid",
        name: "Hybrid Entropy",
        type: "hybrid",
        priority: 6,
        reliability: 0.85,
        consecutiveFailures: 0,
        generate: async () => {
          // Combine multiple sources
          const systemEntropy = await this.entropySources.get("system-crypto")?.generate()
          const envEntropy = await this.entropySources.get("environmental")?.generate()

          if (!systemEntropy || !envEntropy) {
            throw new Error("Required entropy sources not available")
          }

          // Mix entropy sources
          return createHash("sha512")
            .update(systemEntropy)
            .update(envEntropy)
            .update(Date.now().toString())
            .digest("hex")
        },
      })

      this.logger.info("Registered default entropy sources")
    } catch (error) {
      this.logger.error("Failed to register default entropy sources", error)
      throw error
    }
  }

  /**
   * Register entropy source
   */
  public registerEntropySource(source: EntropySource): void {
    try {
      this.entropySources.set(source.id, source)
      this.logger.info(`Registered entropy source: ${source.name} (${source.type})`)
    } catch (error) {
      this.logger.error(`Failed to register entropy source: ${source.name}`, error)
      throw error
    }
  }

  /**
   * Initialize entropy pools
   */
  private async initializeEntropyPools(): Promise<void> {
    try {
      // Create entropy pools for each quality level
      for (const quality of ["LOW", "MEDIUM", "HIGH", "MILITARY"] as EntropyQuality[]) {
        const poolSize = this.poolSizes[quality]
        const poolId = `pool-${quality.toLowerCase()}`

        // Initialize pool with random data
        const initialEntropy = await this.collectEntropyFromSources(poolSize, quality)

        const pool: EntropyPool = {
          id: poolId,
          buffer: initialEntropy,
          quality,
          lastRefill: Date.now(),
          size: poolSize,
          usageCount: 0,
          entropyRemaining: poolSize,
        }

        this.entropyPools.set(poolId, pool)
        this.logger.info(`Initialized entropy pool: ${poolId} (${poolSize} bytes)`)
      }
    } catch (error) {
      this.logger.error("Failed to initialize entropy pools", error)
      throw error
    }
  }

  /**
   * Start entropy collection
   */
  private startEntropyCollection(): void {
    try {
      // Clear existing interval if any
      if (this.collectionInterval) {
        clearInterval(this.collectionInterval)
      }

      // Start collection interval
      this.collectionInterval = setInterval(async () => {
        try {
          await this.refillEntropyPoolsIfNeeded()
        } catch (error) {
          this.logger.error("Error in entropy collection interval", error)
        }
      }, this.collectionIntervalMs)

      this.logger.info(`Started entropy collection interval (${this.collectionIntervalMs}ms)`)
    } catch (error) {
      this.logger.error("Failed to start entropy collection", error)
      throw error
    }
  }

  /**
   * Refill entropy pools if needed
   */
  private async refillEntropyPoolsIfNeeded(): Promise<void> {
    try {
      for (const [poolId, pool] of this.entropyPools.entries()) {
        // Check if pool needs refill
        const remainingRatio = pool.entropyRemaining / pool.size
        if (remainingRatio <= this.poolRefillThreshold) {
          this.logger.info(`Refilling entropy pool: ${poolId} (${Math.round(remainingRatio * 100)}% remaining)`)

          // Collect new entropy
          const newEntropy = await this.collectEntropyFromSources(pool.size, pool.quality)

          // Mix new entropy with existing entropy
          const mixedEntropy = await this.mixEntropy(pool.buffer, newEntropy, pool.quality)

          // Update pool
          pool.buffer = mixedEntropy
          pool.lastRefill = Date.now()
          pool.entropyRemaining = pool.size
          this.entropyPools.set(poolId, pool)

          this.logger.info(`Refilled entropy pool: ${poolId}`)
        }
      }
    } catch (error) {
      this.logger.error("Failed to refill entropy pools", error)
      throw error
    }
  }

  /**
   * Collect entropy from sources
   */
  private async collectEntropyFromSources(size: number, quality: EntropyQuality): Promise<Buffer> {
    try {
      // Get minimum quality threshold
      const qualityThreshold = this.getQualityThreshold(quality)

      // Get sources that meet quality threshold
      const eligibleSources = Array.from(this.entropySources.values()).filter(
        (source) => source.reliability >= qualityThreshold,
      )

      if (eligibleSources.length === 0) {
        throw new Error(`No entropy sources meet quality threshold for ${quality}`)
      }

      // Sort sources by priority (highest first)
      eligibleSources.sort((a, b) => b.priority - a.priority)

      // Collect entropy from each source
      const entropyPromises = eligibleSources.map(async (source) => {
        try {
          const entropy = await source.generate()

          // Reset consecutive failures on success
          const updatedSource = this.entropySources.get(source.id)
          if (updatedSource) {
            updatedSource.consecutiveFailures = 0
            this.entropySources.set(source.id, updatedSource)
          }

          return {
            source: source.id,
            entropy: Buffer.from(entropy, "hex"),
            priority: source.priority,
          }
        } catch (error) {
          // Increment consecutive failures
          const updatedSource = this.entropySources.get(source.id)
          if (updatedSource) {
            updatedSource.consecutiveFailures++
            this.entropySources.set(source.id, updatedSource)

            // Log warning if source is failing consistently
            if (updatedSource.consecutiveFailures >= this.sourceFailureThreshold) {
              this.logger.warn(
                `Entropy source ${source.id} has failed ${updatedSource.consecutiveFailures} times consecutively`,
              )
            }
          }

          // Return empty buffer for failed source
          return {
            source: source.id,
            entropy: Buffer.alloc(0),
            priority: 0, // Lower priority for failed source
          }
        }
      })

      // Wait for all promises to resolve
      const results = await Promise.all(entropyPromises)

      // Filter out empty results and sort by priority
      const validResults = results.filter((result) => result.entropy.length > 0).sort((a, b) => b.priority - a.priority)

      if (validResults.length === 0) {
        throw new Error("All entropy sources failed")
      }

      // Combine entropy from all sources
      let combinedEntropy = Buffer.alloc(0)
      for (const result of validResults) {
        combinedEntropy = Buffer.concat([combinedEntropy, result.entropy])
      }

      // If we don't have enough entropy, repeat the combined entropy
      while (combinedEntropy.length < size) {
        combinedEntropy = Buffer.concat([combinedEntropy, combinedEntropy])
      }

      // Truncate to requested size
      return combinedEntropy.slice(0, size)
    } catch (error) {
      this.logger.error("Failed to collect entropy from sources", error)

      // Fallback to system entropy in case of failure
      this.logger.warn("Using fallback system entropy")
      return randomBytes(size)
    }
  }

  /**
   * Mix entropy
   */
  private async mixEntropy(entropy1: Buffer, entropy2: Buffer, quality: EntropyQuality): Promise<Buffer> {
    try {
      // Ensure buffers are the same size
      const size = Math.max(entropy1.length, entropy2.length)
      const buf1 = Buffer.alloc(size)
      const buf2 = Buffer.alloc(size)

      entropy1.copy(buf1)
      entropy2.copy(buf2)

      // Get number of mixing rounds based on quality
      const rounds = this.mixingRounds[quality]

      // Initialize result buffer
      let result = Buffer.alloc(size)

      // Apply multiple mixing rounds with different algorithms
      for (let round = 0; round < rounds; round++) {
        // Select mixing algorithm based on round
        switch (round % 4) {
          case 0:
            // XOR mixing
            for (let i = 0; i < size; i++) {
              result[i] = buf1[i] ^ buf2[i]
            }
            break

          case 1:
            // Addition with carry mixing
            let carry = 0
            for (let i = 0; i < size; i++) {
              const sum = buf1[i] + buf2[i] + carry
              result[i] = sum & 0xff
              carry = sum >> 8
            }
            break

          case 2:
            // Multiplication mixing (with modulo to prevent overflow)
            for (let i = 0; i < size; i++) {
              result[i] = (buf1[i] * buf2[i]) % 256
            }
            break

          case 3:
            // Non-linear transformation
            for (let i = 0; i < size; i++) {
              const a = buf1[i]
              const b = buf2[i]
              // Non-linear operation: (a * b + a) ^ b
              result[i] = ((a * b + a) & 0xff) ^ b
            }
            break
        }

        // Apply cryptographic hash between rounds
        if (round < rounds - 1) {
          // Use different hash algorithms for different rounds
          const hashAlgo = ["sha256", "sha512", "sha3-256", "sha3-512"][round % 4]
          const hashed = createHash(hashAlgo).update(result).digest()

          // Copy hashed result back to result buffer
          const copySize = Math.min(hashed.length, size)
          hashed.copy(result, 0, 0, copySize)

          // If hash is smaller than size, repeat it
          for (let offset = copySize; offset < size; offset += copySize) {
            hashed.copy(result, offset, 0, Math.min(copySize, size - offset))
          }

          // Swap buffers for next round
          const temp = buf1
          const buf1_mutable = result
          result = temp
          buf1 = buf1_mutable
        }
      }

      return result
    } catch (error) {
      this.logger.error("Failed to mix entropy", error)

      // Fallback to simple XOR in case of failure
      const size = Math.max(entropy1.length, entropy2.length)
      const result = Buffer.alloc(size)

      for (let i = 0; i < size; i++) {
        const a = i < entropy1.length ? entropy1[i] : 0
        const b = i < entropy2.length ? entropy2[i] : 0
        result[i] = a ^ b
      }

      return result
    }
  }

  /**
   * Get quality threshold
   */
  private getQualityThreshold(quality: EntropyQuality): number {
    switch (quality) {
      case "LOW":
        return 0.5
      case "MEDIUM":
        return 0.7
      case "HIGH":
        return 0.8
      case "MILITARY":
        return 0.9
      default:
        return 0.7
    }
  }

  /**
   * Generate entropy
   */
  public async generateEntropy(options: EntropyGenerationOptions = {}): Promise<EntropyResult> {
    try {
      if (!this.initialized) {
        await this.initialize()
      }

      // Set defaults
      const size = options.size || 32 // Default to 32 bytes (256 bits)
      const quality = options.quality || "HIGH" // Default to HIGH quality
      const purpose = options.purpose || "general"

      // Get entropy from pool
      const entropy = await this.getEntropyFromPool(size, quality)

      // Apply entropy drift if specified
      let driftedEntropy = entropy
      if (options.driftFactor !== undefined) {
        driftedEntropy = await this.applyEntropyDrift(entropy, options.driftFactor)
      }

      // Apply seed if specified
      let finalEntropy = driftedEntropy
      if (options.seed) {
        finalEntropy = await this.applySeed(driftedEntropy, options.seed)
      }

      // Generate signature
      const signature = this.generateEntropySignature(finalEntropy, purpose)

      // Create result
      const result: EntropyResult = {
        bytes: finalEntropy,
        hex: finalEntropy.toString("hex"),
        quality,
        source: `entropy-amplification-system:${purpose}`,
        timestamp: Date.now(),
        signature,
      }

      return result
    } catch (error) {
      this.logger.error("Failed to generate entropy", error)

      // Fallback to system entropy in case of failure
      const fallbackEntropy = randomBytes(options.size || 32)

      return {
        bytes: fallbackEntropy,
        hex: fallbackEntropy.toString("hex"),
        quality: "LOW", // Downgrade quality for fallback
        source: "fallback",
        timestamp: Date.now(),
        signature: "fallback",
      }
    }
  }

  /**
   * Generate entropy for specific purpose
   */
  public async generateEntropyForPurpose(
    purpose: string,
    options: EntropyGenerationOptions = {},
  ): Promise<EntropyResult> {
    try {
      // Set purpose in options
      const entropyOptions = {
        ...options,
        purpose,
      }

      // Generate entropy
      return await this.generateEntropy(entropyOptions)
    } catch (error) {
      this.logger.error(`Failed to generate entropy for purpose: ${purpose}`, error)
      throw error
    }
  }

  /**
   * Generate consistent entropy
   */
  public async generateConsistentEntropy(
    sessionId: string,
    domain: string,
    purpose: string,
    options: EntropyGenerationOptions = {},
  ): Promise<EntropyResult> {
    try {
      if (!this.initialized) {
        await this.initialize()
      }

      // Create cache key
      const cacheKey = `${sessionId}:${domain}:${purpose}`

      // Check cache
      const cached = this.entropyCache.get(cacheKey)
      if (cached && cached.expires > Date.now()) {
        // Use cached entropy
        const cachedEntropy = cached.entropy

        return {
          bytes: cachedEntropy,
          hex: cachedEntropy.toString("hex"),
          quality: options.quality || "HIGH",
          source: `cache:${purpose}`,
          timestamp: Date.now(),
          signature: this.generateEntropySignature(cachedEntropy, purpose),
        }
      }

      // Set defaults
      const size = options.size || 32 // Default to 32 bytes (256 bits)
      const quality = options.quality || "HIGH" // Default to HIGH quality

      // Create seed from session ID, domain, and purpose
      const seed = createHash("sha256").update(sessionId).update(domain).update(purpose).digest("hex")

      // Generate entropy with seed
      const entropy = await this.generateEntropy({
        size,
        quality,
        purpose,
        seed,
      })

      // Cache entropy
      this.entropyCache.set(cacheKey, {
        entropy: entropy.bytes,
        expires: Date.now() + this.entropyCacheTTL,
      })

      return entropy
    } catch (error) {
      this.logger.error("Failed to generate consistent entropy", error)
      throw error
    }
  }

  /**
   * Get entropy from pool
   */
  private async getEntropyFromPool(size: number, quality: EntropyQuality): Promise<Buffer> {
    try {
      // Get pool for quality
      const poolId = `pool-${quality.toLowerCase()}`
      const pool = this.entropyPools.get(poolId)

      if (!pool) {
        throw new Error(`Entropy pool not found for quality: ${quality}`)
      }

      // Check if pool has enough entropy
      if (pool.entropyRemaining < size) {
        // Refill pool
        await this.refillEntropyPoolsIfNeeded()

        // Check again
        if (pool.entropyRemaining < size) {
          throw new Error(`Entropy pool ${poolId} does not have enough entropy`)
        }
      }

      // Get entropy from pool
      const startOffset = pool.size - pool.entropyRemaining
      const entropy = pool.buffer.slice(startOffset, startOffset + size)

      // Update pool
      pool.entropyRemaining -= size
      pool.usageCount++
      this.entropyPools.set(poolId, pool)

      return entropy
    } catch (error) {
      this.logger.error("Failed to get entropy from pool", error)

      // Fallback to collecting new entropy
      return this.collectEntropyFromSources(size, quality)
    }
  }

  /**
   * Apply entropy drift
   */
  private async applyEntropyDrift(entropy: Buffer, driftFactor: number): Promise<Buffer> {
    try {
      // Ensure drift factor is in valid range
      const normalizedDriftFactor = Math.max(0, Math.min(1, driftFactor))

      // Generate drift entropy
      const driftEntropy = await this.collectEntropyFromSources(entropy.length, "MEDIUM")

      // Create drifted entropy
      const driftedEntropy = Buffer.alloc(entropy.length)

      // Apply drift with non-linear transformation
      for (let i = 0; i < entropy.length; i++) {
        // Calculate drift amount using non-linear function
        const driftBase = Math.sin((driftEntropy[i] / 128) * Math.PI) * 0.5 + 0.5 // 0-1 range
        const drift = Math.floor(normalizedDriftFactor * 256 * driftBase)

        // Apply drift with wrapping and XOR for additional security
        driftedEntropy[i] = ((entropy[i] + drift) % 256) ^ (driftEntropy[i] & 0x0f)
      }

      return driftedEntropy
    } catch (error) {
      this.logger.error("Failed to apply entropy drift", error)
      return entropy // Return original entropy as fallback
    }
  }

  /**
   * Apply seed to entropy
   */
  private async applySeed(entropy: Buffer, seed: string): Promise<Buffer> {
    try {
      // Convert seed to buffer
      const seedBuffer = Buffer.from(seed, "hex")

      // Mix entropy with seed
      return this.mixEntropy(entropy, seedBuffer, "HIGH")
    } catch (error) {
      this.logger.error("Failed to apply seed to entropy", error)
      return entropy // Return original entropy as fallback
    }
  }

  /**
   * Generate entropy signature
   */
  private generateEntropySignature(entropy: Buffer, purpose: string): string {
    try {
      // Create signature using HMAC
      return createHmac("sha256", Buffer.from(purpose))
        .update(entropy)
        .update(Buffer.from(Date.now().toString()))
        .digest("hex")
    } catch (error) {
      this.logger.error("Failed to generate entropy signature", error)
      return createHash("sha256").update(entropy).digest("hex") // Fallback
    }
  }

  /**
   * Verify entropy quality
   */
  public verifyEntropyQuality(entropy: Buffer): EntropyQuality {
    try {
      // Calculate entropy quality score
      const score = this.calculateEntropyQualityScore(entropy)

      // Determine quality based on score
      if (score >= this.verificationThresholds.MILITARY) {
        return "MILITARY"
      } else if (score >= this.verificationThresholds.HIGH) {
        return "HIGH"
      } else if (score >= this.verificationThresholds.MEDIUM) {
        return "MEDIUM"
      } else {
        return "LOW"
      }
    } catch (error) {
      this.logger.error("Failed to verify entropy quality", error)
      return "LOW" // Fallback to LOW quality
    }
  }

  /**
   * Calculate entropy quality score
   */
  private calculateEntropyQualityScore(entropy: Buffer): number {
    try {
      // Minimum size for quality calculation
      if (entropy.length < 16) {
        return 0.1 // Very low quality for small entropy
      }

      // Calculate byte frequency distribution
      const frequencies = new Array(256).fill(0)
      for (const byte of entropy) {
        frequencies[byte]++
      }

      // Calculate Shannon entropy
      let shannonEntropy = 0
      for (const freq of frequencies) {
        if (freq > 0) {
          const p = freq / entropy.length
          shannonEntropy -= p * Math.log2(p)
        }
      }

      // Normalize Shannon entropy (max is 8 bits for byte distribution)
      const normalizedShannon = shannonEntropy / 8

      // Calculate run length distribution
      let currentRun = 1
      let maxRun = 1
      let runCount = 0

      for (let i = 1; i < entropy.length; i++) {
        if (entropy[i] === entropy[i - 1]) {
          currentRun++
        } else {
          maxRun = Math.max(maxRun, currentRun)
          runCount++
          currentRun = 1
        }
      }

      // Account for the last run
      maxRun = Math.max(maxRun, currentRun)
      runCount++

      // Penalize for long runs (indicates poor randomness)
      const runPenalty = Math.min(1, maxRun / 32)

      // Calculate run distribution score (higher is better)
      const expectedRuns = entropy.length / 2 // Ideal case
      const runRatio = Math.min(runCount / expectedRuns, 1)

      // Combine metrics with weights
      const shannonWeight = 0.7
      const runWeight = 0.3

      return normalizedShannon * shannonWeight + runRatio * (1 - runPenalty) * runWeight
    } catch (error) {
      this.logger.error("Failed to calculate entropy quality score", error)
      return 0.1 // Fallback to very low quality
    }
  }

  /**
   * Clean up resources
   */
  public async cleanup(): Promise<void> {
    try {
      // Stop collection interval
      if (this.collectionInterval) {
        clearInterval(this.collectionInterval)
        this.collectionInterval = null
      }

      // Clear entropy pools
      this.entropyPools.clear()

      // Clear entropy cache
      this.entropyCache.clear()

      this.initialized = false

      this.logger.info("Entropy Amplification System cleaned up")
    } catch (error) {
      this.logger.error("Failed to clean up Entropy Amplification System", error)
    }
  }
}

// Export singleton instance
export const entropyAmplificationSystem = EntropyAmplificationSystem.getInstance()

// Helper functions for easier access
export async function initializeEntropyAmplificationSystem(): Promise<void> {
  return entropyAmplificationSystem.initialize()
}

export async function generateEntropy(options?: EntropyGenerationOptions): Promise<EntropyResult> {
  return entropyAmplificationSystem.generateEntropy(options)
}

export async function generateEntropyForPurpose(
  purpose: string,
  options?: EntropyGenerationOptions,
): Promise<EntropyResult> {
  return entropyAmplificationSystem.generateEntropyForPurpose(purpose, options)
}

export async function generateConsistentEntropy(
  sessionId: string,
  domain: string,
  purpose: string,
  options?: EntropyGenerationOptions,
): Promise<EntropyResult> {
  return entropyAmplificationSystem.generateConsistentEntropy(sessionId, domain, purpose, options)
}

export function verifyEntropyQuality(entropy: Buffer): EntropyQuality {
  return entropyAmplificationSystem.verifyEntropyQuality(entropy)
}

export async function cleanupEntropyAmplificationSystem(): Promise<void> {
  return entropyAmplificationSystem.cleanup()
}
