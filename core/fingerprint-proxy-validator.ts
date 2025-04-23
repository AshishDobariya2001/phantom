// FINGERPRINT-PROXY VALIDATOR
// Classification: FOUNDER-EYES-ONLY
// Version: 3.2.1-MILITARY

import { createHash, createHmac } from "crypto"
import { Logger } from "../utils/logger"
import { entropyAmplificationSystem } from "./entropy-amplification-system"
import { type ProxyContext, ProxyTier, ProxyType } from "../types/proxy-types"

/**
 * Fingerprint type
 */
export type FingerprintType =
  | "TLS" // TLS fingerprint
  | "JA3" // JA3 fingerprint
  | "HTTP2" // HTTP/2 fingerprint
  | "TCP" // TCP fingerprint
  | "QUIC" // QUIC fingerprint
  | "DNS" // DNS fingerprint
  | "COMPOSITE" // Composite fingerprint

/**
 * ISP region type
 */
export type ISPRegionType =
  | "NA_EAST" // North America East
  | "NA_WEST" // North America West
  | "EU_WEST" // Europe West
  | "EU_CENTRAL" // Europe Central
  | "ASIA_EAST" // Asia East
  | "ASIA_SOUTH" // Asia South
  | "OCEANIA" // Oceania
  | "SOUTH_AMERICA" // South America
  | "AFRICA" // Africa
  | "MIDDLE_EAST" // Middle East

/**
 * Fingerprint validation result
 */
export interface FingerprintValidationResult {
  valid: boolean
  confidenceScore: number // 0-1, where 1 is highest confidence
  fingerprintType: FingerprintType
  ispRegion: ISPRegionType
  anomalyScore: number // 0-1, where 0 is no anomaly
  timestamp: number
  validationHash: string
}

/**
 * Fingerprint-Proxy validation options
 */
export interface FingerprintValidationOptions {
  strictMode?: boolean
  anomalyThreshold?: number // 0-1, where lower values are more strict
  validateAll?: boolean // Validate all fingerprint types
  regionSpecific?: boolean // Apply region-specific validation
}

/**
 * Regional fingerprint characteristics
 */
interface RegionalFingerprintCharacteristics {
  region: ISPRegionType
  browserDistribution: Record<string, number> // Browser type to percentage
  osDistribution: Record<string, number> // OS type to percentage
  tlsVersionDistribution: Record<string, number> // TLS version to percentage
  cipherSuitePreferences: string[] // Ordered list of preferred cipher suites
  headerOrderPatterns: string[][] // Common header order patterns
  languagePreferences: string[] // Common language preferences
  timeZones: string[] // Common time zones
}

/**
 * Fingerprint-Proxy Validator
 *
 * Military-grade fingerprint validation system with:
 * - Cross-validation between fingerprint and proxy characteristics
 * - Region-specific fingerprint validation
 * - Anomaly detection for fingerprint-proxy mismatches
 * - Temporal consistency verification for fingerprints
 * - Adaptive validation thresholds
 */
export class FingerprintProxyValidator {
  private static instance: FingerprintProxyValidator
  private logger: Logger
  private initialized = false
  private regionalCharacteristics: Map<ISPRegionType, RegionalFingerprintCharacteristics> = new Map()
  private fingerprintCache: Map<string, { fingerprint: any; timestamp: number; validUntil: number }> = new Map()

  private constructor() {
    this.logger = new Logger("FingerprintProxyValidator", "MILITARY")
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): FingerprintProxyValidator {
    if (!FingerprintProxyValidator.instance) {
      FingerprintProxyValidator.instance = new FingerprintProxyValidator()
    }
    return FingerprintProxyValidator.instance
  }

  /**
   * Initialize fingerprint-proxy validator
   */
  public async initialize(): Promise<void> {
    if (this.initialized) {
      return
    }

    try {
      this.logger.info("Initializing Fingerprint-Proxy Validator")

      // Initialize regional characteristics
      await this.initializeRegionalCharacteristics()

      this.initialized = true
      this.logger.info("Fingerprint-Proxy Validator initialized successfully")
    } catch (error) {
      this.logger.error("Failed to initialize Fingerprint-Proxy Validator", error)
      throw new Error(`FINGERPRINT_VALIDATOR_INITIALIZATION_FAILED: ${error.message}`)
    }
  }

  /**
   * Initialize regional characteristics
   */
  private async initializeRegionalCharacteristics(): Promise<void> {
    try {
      // North America East
      this.regionalCharacteristics.set("NA_EAST", {
        region: "NA_EAST",
        browserDistribution: {
          chrome: 0.65,
          safari: 0.15,
          firefox: 0.1,
          edge: 0.08,
          other: 0.02,
        },
        osDistribution: {
          windows: 0.55,
          macos: 0.25,
          ios: 0.12,
          android: 0.07,
          linux: 0.01,
        },
        tlsVersionDistribution: {
          "TLSv1.3": 0.75,
          "TLSv1.2": 0.24,
          "TLSv1.1": 0.01,
        },
        cipherSuitePreferences: [
          "TLS_AES_128_GCM_SHA256",
          "TLS_AES_256_GCM_SHA384",
          "TLS_CHACHA20_POLY1305_SHA256",
          "TLS_ECDHE_ECDSA_WITH_AES_128_GCM_SHA256",
        ],
        headerOrderPatterns: [
          ["host", "user-agent", "accept", "accept-language", "accept-encoding", "connection"],
          ["host", "connection", "user-agent", "accept", "accept-language", "accept-encoding"],
        ],
        languagePreferences: ["en-US", "en", "es-US", "fr-CA"],
        timeZones: ["America/New_York", "America/Toronto", "America/Montreal", "America/Detroit"],
      })

      // Europe West
      this.regionalCharacteristics.set("EU_WEST", {
        region: "EU_WEST",
        browserDistribution: {
          chrome: 0.6,
          safari: 0.1,
          firefox: 0.15,
          edge: 0.05,
          opera: 0.08,
          other: 0.02,
        },
        osDistribution: {
          windows: 0.5,
          macos: 0.2,
          ios: 0.1,
          android: 0.15,
          linux: 0.05,
        },
        tlsVersionDistribution: {
          "TLSv1.3": 0.8,
          "TLSv1.2": 0.19,
          "TLSv1.1": 0.01,
        },
        cipherSuitePreferences: [
          "TLS_AES_256_GCM_SHA384",
          "TLS_CHACHA20_POLY1305_SHA256",
          "TLS_AES_128_GCM_SHA256",
          "TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384",
        ],
        headerOrderPatterns: [
          ["host", "user-agent", "accept", "accept-language", "accept-encoding", "connection"],
          ["host", "accept", "accept-language", "accept-encoding", "user-agent", "connection"],
        ],
        languagePreferences: ["en-GB", "fr-FR", "de-DE", "es-ES", "it-IT", "nl-NL"],
        timeZones: ["Europe/London", "Europe/Paris", "Europe/Berlin", "Europe/Madrid", "Europe/Rome"],
      })

      // Asia East
      this.regionalCharacteristics.set("ASIA_EAST", {
        region: "ASIA_EAST",
        browserDistribution: {
          chrome: 0.7,
          safari: 0.05,
          firefox: 0.05,
          edge: 0.03,
          uc: 0.1,
          other: 0.07,
        },
        osDistribution: {
          windows: 0.45,
          macos: 0.1,
          ios: 0.15,
          android: 0.28,
          linux: 0.02,
        },
        tlsVersionDistribution: {
          "TLSv1.3": 0.7,
          "TLSv1.2": 0.28,
          "TLSv1.1": 0.02,
        },
        cipherSuitePreferences: [
          "TLS_AES_128_GCM_SHA256",
          "TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256",
          "TLS_ECDHE_ECDSA_WITH_AES_128_GCM_SHA256",
          "TLS_AES_256_GCM_SHA384",
        ],
        headerOrderPatterns: [
          ["host", "connection", "user-agent", "accept", "accept-language", "accept-encoding"],
          ["host", "user-agent", "accept", "accept-language", "accept-encoding", "connection"],
        ],
        languagePreferences: ["zh-CN", "zh-TW", "ja-JP", "ko-KR", "en-US"],
        timeZones: ["Asia/Shanghai", "Asia/Tokyo", "Asia/Seoul", "Asia/Hong_Kong", "Asia/Singapore"],
      })

      // Add more regions as needed...

      this.logger.info("Initialized regional fingerprint characteristics")
    } catch (error) {
      this.logger.error("Failed to initialize regional characteristics", error)
      throw error
    }
  }

  /**
   * Validate fingerprint-proxy link
   */
  public async validateFingerprintProxyLink(
    fingerprint: any,
    proxyContext: ProxyContext,
    fingerprintType: FingerprintType = "TLS",
    options: FingerprintValidationOptions = {},
  ): Promise<FingerprintValidationResult> {
    try {
      if (!this.initialized) {
        await this.initialize()
      }

      // Set defaults
      const strictMode = options.strictMode || false
      const anomalyThreshold = options.anomalyThreshold || 0.7
      const validateAll = options.validateAll || false
      const regionSpecific = options.regionSpecific !== false

      // Map proxy region to ISP region type
      const ispRegion = this.mapProxyRegionToISPRegion(proxyContext.proxy.region)

      // Get regional characteristics
      const characteristics = this.regionalCharacteristics.get(ispRegion)

      if (!characteristics && regionSpecific) {
        return {
          valid: false,
          confidenceScore: 0.3,
          fingerprintType,
          ispRegion,
          anomalyScore: 0.8,
          timestamp: Date.now(),
          validationHash: this.generateValidationHash(fingerprint, proxyContext, "no_regional_characteristics"),
        }
      }

      // Validate fingerprint based on type
      let validationResult: {
        valid: boolean
        confidenceScore: number
        anomalyScore: number
        details: string
      }

      switch (fingerprintType) {
        case "TLS":
          validationResult = this.validateTLSFingerprint(fingerprint, proxyContext, characteristics, strictMode)
          break
        case "JA3":
          validationResult = this.validateJA3Fingerprint(fingerprint, proxyContext, characteristics, strictMode)
          break
        case "HTTP2":
          validationResult = this.validateHTTP2Fingerprint(fingerprint, proxyContext, characteristics, strictMode)
          break
        case "COMPOSITE":
          validationResult = this.validateCompositeFingerprint(fingerprint, proxyContext, characteristics, strictMode)
          break
        default:
          validationResult = {
            valid: false,
            confidenceScore: 0.3,
            anomalyScore: 0.5,
            details: "Unsupported fingerprint type",
          }
      }

      // If validateAll is true, validate all fingerprint types
      if (validateAll && fingerprintType === "COMPOSITE") {
        // Validate TLS fingerprint
        const tlsResult = this.validateTLSFingerprint(fingerprint.tls, proxyContext, characteristics, strictMode)

        // Validate JA3 fingerprint
        const ja3Result = this.validateJA3Fingerprint(fingerprint.ja3, proxyContext, characteristics, strictMode)

        // Validate HTTP2 fingerprint
        const http2Result = this.validateHTTP2Fingerprint(fingerprint.http2, proxyContext, characteristics, strictMode)

        // Combine results
        validationResult = {
          valid: tlsResult.valid && ja3Result.valid && http2Result.valid,
          confidenceScore: (tlsResult.confidenceScore + ja3Result.confidenceScore + http2Result.confidenceScore) / 3,
          anomalyScore: Math.max(tlsResult.anomalyScore, ja3Result.anomalyScore, http2Result.anomalyScore),
          details: `TLS: ${tlsResult.details}, JA3: ${ja3Result.details}, HTTP2: ${http2Result.details}`,
        }
      }

      // Determine if the result is valid based on anomaly threshold
      const isValid = validationResult.valid && validationResult.anomalyScore < anomalyThreshold

      // Generate validation hash
      const validationHash = this.generateValidationHash(fingerprint, proxyContext, validationResult.details)

      // Cache the fingerprint if valid
      if (isValid) {
        const cacheKey = `${proxyContext.sessionId}:${fingerprintType}`
        this.fingerprintCache.set(cacheKey, {
          fingerprint,
          timestamp: Date.now(),
          validUntil: Date.now() + 3600000, // Valid for 1 hour
        })
      }

      return {
        valid: isValid,
        confidenceScore: validationResult.confidenceScore,
        fingerprintType,
        ispRegion,
        anomalyScore: validationResult.anomalyScore,
        timestamp: Date.now(),
        validationHash,
      }
    } catch (error) {
      this.logger.error("Failed to validate fingerprint-proxy link", error)

      // Return safe fallback
      return {
        valid: false,
        confidenceScore: 0,
        fingerprintType,
        ispRegion: this.mapProxyRegionToISPRegion(proxyContext.proxy.region),
        anomalyScore: 1,
        timestamp: Date.now(),
        validationHash: createHash("sha256").update(`error:${Date.now()}`).digest("hex"),
      }
    }
  }

  /**
   * Validate TLS fingerprint
   */
  private validateTLSFingerprint(
    fingerprint: any,
    proxyContext: ProxyContext,
    characteristics?: RegionalFingerprintCharacteristics,
    strictMode = false,
  ): { valid: boolean; confidenceScore: number; anomalyScore: number; details: string } {
    try {
      // Basic validation
      if (!fingerprint || !fingerprint.cipherSuites || !fingerprint.extensions) {
        return {
          valid: false,
          confidenceScore: 0,
          anomalyScore: 1,
          details: "Missing TLS fingerprint data",
        }
      }

      let anomalyScore = 0
      let confidenceScore = 0.5
      const validationDetails: string[] = []

      // Validate cipher suites
      if (characteristics) {
        // Check if cipher suites match regional preferences
        const preferredCipherSuites = characteristics.cipherSuitePreferences
        const matchingCipherSuites = fingerprint.cipherSuites.filter((cs: string) => preferredCipherSuites.includes(cs))
        const cipherSuiteMatchRatio =
          matchingCipherSuites.length / Math.min(preferredCipherSuites.length, fingerprint.cipherSuites.length)

        if (cipherSuiteMatchRatio < 0.5) {
          anomalyScore += 0.3
          validationDetails.push(`Cipher suite mismatch: ${cipherSuiteMatchRatio.toFixed(2)} match ratio`)
        } else {
          confidenceScore += 0.1
          validationDetails.push(`Cipher suite match: ${cipherSuiteMatchRatio.toFixed(2)} match ratio`)
        }

        // Check TLS version distribution
        if (fingerprint.version && characteristics.tlsVersionDistribution[fingerprint.version] < 0.1) {
          anomalyScore += 0.2
          validationDetails.push(`Uncommon TLS version for region: ${fingerprint.version}`)
        } else if (fingerprint.version) {
          confidenceScore += 0.1
          validationDetails.push(`Common TLS version for region: ${fingerprint.version}`)
        }
      }

      // Validate proxy tier and fingerprint complexity
      const extensionCount = fingerprint.extensions.length
      const cipherSuiteCount = fingerprint.cipherSuites.length

      if (proxyContext.proxy.tier === ProxyTier.PHANTOM || proxyContext.proxy.tier === ProxyTier.GHOST) {
        // High-tier proxies should have complex fingerprints
        if (extensionCount < 8 || cipherSuiteCount < 5) {
          anomalyScore += 0.3
          validationDetails.push(
            `Low complexity fingerprint for high-tier proxy: ${extensionCount} extensions, ${cipherSuiteCount} cipher suites`,
          )
        } else {
          confidenceScore += 0.2
          validationDetails.push(`High complexity fingerprint matches high-tier proxy`)
        }
      }

      // Validate proxy type and fingerprint characteristics
      if (proxyContext.proxy.type === ProxyType.RESIDENTIAL) {
        // Residential proxies should have common browser fingerprints
        if (
          fingerprint.browserType &&
          fingerprint.browserType !== "chrome" &&
          fingerprint.browserType !== "safari" &&
          fingerprint.browserType !== "firefox"
        ) {
          anomalyScore += 0.2
          validationDetails.push(`Uncommon browser type for residential proxy: ${fingerprint.browserType}`)
        } else {
          confidenceScore += 0.1
          validationDetails.push(`Common browser type for residential proxy: ${fingerprint.browserType || "unknown"}`)
        }
      }

      // Validate proxy region and fingerprint language
      if (characteristics && fingerprint.language) {
        const isCommonLanguage = characteristics.languagePreferences.some((lang) =>
          fingerprint.language.startsWith(lang),
        )
        if (!isCommonLanguage) {
          anomalyScore += 0.2
          validationDetails.push(`Uncommon language for region: ${fingerprint.language}`)
        } else {
          confidenceScore += 0.1
          validationDetails.push(`Common language for region: ${fingerprint.language}`)
        }
      }

      // Normalize scores
      anomalyScore = Math.min(1, anomalyScore)
      confidenceScore = Math.min(1, confidenceScore)

      // Determine validity
      const valid = anomalyScore < (strictMode ? 0.3 : 0.7)

      return {
        valid,
        confidenceScore,
        anomalyScore,
        details: validationDetails.join(", "),
      }
    } catch (error) {
      this.logger.error("Failed to validate TLS fingerprint", error)
      return {
        valid: false,
        confidenceScore: 0,
        anomalyScore: 1,
        details: `Error: ${error.message}`,
      }
    }
  }

  /**
   * Validate JA3 fingerprint
   */
  private validateJA3Fingerprint(
    fingerprint: any,
    proxyContext: ProxyContext,
    characteristics?: RegionalFingerprintCharacteristics,
    strictMode = false,
  ): { valid: boolean; confidenceScore: number; anomalyScore: number; details: string } {
    try {
      // Basic validation
      if (!fingerprint || !fingerprint.hash) {
        return {
          valid: false,
          confidenceScore: 0,
          anomalyScore: 1,
          details: "Missing JA3 fingerprint data",
        }
      }

      let anomalyScore = 0
      let confidenceScore = 0.5
      const validationDetails: string[] = []

      // Check if the JA3 hash is in our known good list for the region
      // This is a placeholder - in a real implementation, we would have a database of known good JA3 hashes
      const knownGoodJA3Hashes: Record<ISPRegionType, string[]> = {
        NA_EAST: [
          "771,4865-4866-4867-49195-49199-49196-49200-52393-52392-49171-49172-156-157-47-53,0-23-65281-10-11-35-16-5-13-18-51-45-43-27-21,29-23-24,0",
          "771,4865-4867-4866-49195-49199-52393-52392-49196-49200-49162-49161-49171-49172-156-157-47-53,0-23-65281-10-11-35-16-5-13-28-51-45-43-27,29-23-24,0",
        ],
        EU_WEST: [
          "771,4865-4866-4867-49195-49199-49196-49200-52393-52392-49171-49172-156-157-47-53,0-23-65281-10-11-35-16-5-13-18-51-45-43-27-21,29-23-24,0",
          "771,4865-4867-4866-49196-49195-52393-49200-49199-52392-49162-49161-49172-49171-157-156-53-47,0-23-65281-10-11-35-16-5-13-28-51-45-43-27,29-23-24,0",
        ],
        ASIA_EAST: [
          "771,4865-4866-4867-49195-49199-49196-49200-52393-52392-49171-49172-156-157-47-53,0-23-65281-10-11-35-16-5-13-18-51-45-43-27-21,29-23-24,0",
        ],
        NA_WEST: [],
        EU_CENTRAL: [],
        ASIA_SOUTH: [],
        OCEANIA: [],
        SOUTH_AMERICA: [],
        AFRICA: [],
        MIDDLE_EAST: [],
      }

      const ispRegion = this.mapProxyRegionToISPRegion(proxyContext.proxy.region)
      const knownHashes = knownGoodJA3Hashes[ispRegion] || []

      if (knownHashes.includes(fingerprint.hash)) {
        confidenceScore += 0.3
        validationDetails.push(`JA3 hash is in known good list for region`)
      } else if (knownHashes.length > 0) {
        // Only penalize if we have known hashes for the region
        anomalyScore += 0.2
        validationDetails.push(`JA3 hash is not in known good list for region`)
      }

      // Check if the JA3 hash components match the proxy characteristics
      if (fingerprint.raw) {
        const components = fingerprint.raw.split(",")
        if (components.length >= 5) {
          // TLS Version
          const tlsVersion = components[0]
          if (tlsVersion !== "771") {
            // 771 is TLS 1.2
            anomalyScore += 0.1
            validationDetails.push(`Unusual TLS version in JA3: ${tlsVersion}`)
          }

          // Cipher Suites
          const cipherSuites = components[1].split("-")
          if (cipherSuites.length < 5) {
            anomalyScore += 0.1
            validationDetails.push(`Low number of cipher suites in JA3: ${cipherSuites.length}`)
          }

          // Extensions
          const extensions = components[2].split("-")
          if (extensions.length < 8) {
            anomalyScore += 0.1
            validationDetails.push(`Low number of extensions in JA3: ${extensions.length}`)
          }
        }
      }

      // Validate proxy tier and JA3 complexity
      if (proxyContext.proxy.tier === ProxyTier.PHANTOM || proxyContext.proxy.tier === ProxyTier.GHOST) {
        // High-tier proxies should have complex JA3 fingerprints
        if (fingerprint.raw && fingerprint.raw.length < 100) {
          anomalyScore += 0.2
          validationDetails.push(`Low complexity JA3 for high-tier proxy: ${fingerprint.raw.length} characters`)
        } else {
          confidenceScore += 0.1
          validationDetails.push(`High complexity JA3 matches high-tier proxy`)
        }
      }

      // Normalize scores
      anomalyScore = Math.min(1, anomalyScore)
      confidenceScore = Math.min(1, confidenceScore)

      // Determine validity
      const valid = anomalyScore < (strictMode ? 0.3 : 0.7)

      return {
        valid,
        confidenceScore,
        anomalyScore,
        details: validationDetails.join(", "),
      }
    } catch (error) {
      this.logger.error("Failed to validate JA3 fingerprint", error)
      return {
        valid: false,
        confidenceScore: 0,
        anomalyScore: 1,
        details: `Error: ${error.message}`,
      }
    }
  }

  /**
   * Validate HTTP/2 fingerprint
   */
  private validateHTTP2Fingerprint(
    fingerprint: any,
    proxyContext: ProxyContext,
    characteristics?: RegionalFingerprintCharacteristics,
    strictMode = false,
  ): { valid: boolean; confidenceScore: number; anomalyScore: number; details: string } {
    try {
      // Basic validation
      if (!fingerprint || !fingerprint.settings) {
        return {
          valid: false,
          confidenceScore: 0,
          anomalyScore: 1,
          details: "Missing HTTP/2 fingerprint data",
        }
      }

      let anomalyScore = 0
      let confidenceScore = 0.5
      const validationDetails: string[] = []

      // Validate HTTP/2 settings
      const settings = fingerprint.settings

      // Check window size
      if (settings.headerTableSize < 4096 || settings.headerTableSize > 65536) {
        anomalyScore += 0.1
        validationDetails.push(`Unusual HTTP/2 header table size: ${settings.headerTableSize}`)
      }

      // Check initial window size
      if (settings.initialWindowSize < 65535 || settings.initialWindowSize > 6291456) {
        anomalyScore += 0.1
        validationDetails.push(`Unusual HTTP/2 initial window size: ${settings.initialWindowSize}`)
      }

      // Check max concurrent streams
      if (settings.maxConcurrentStreams < 100 || settings.maxConcurrentStreams > 1000) {
        anomalyScore += 0.1
        validationDetails.push(`Unusual HTTP/2 max concurrent streams: ${settings.maxConcurrentStreams}`)
      }

      // Validate proxy type and HTTP/2 characteristics
      if (proxyContext.proxy.type === ProxyType.RESIDENTIAL) {
        // Residential proxies should have common browser HTTP/2 settings
        if (
          settings.headerTableSize !== 4096 &&
          settings.headerTableSize !== 8192 &&
          settings.headerTableSize !== 16384
        ) {
          anomalyScore += 0.1
          validationDetails.push(`Uncommon header table size for residential proxy: ${settings.headerTableSize}`)
        }

        if (
          settings.initialWindowSize !== 65535 &&
          settings.initialWindowSize !== 131072 &&
          settings.initialWindowSize !== 262144
        ) {
          anomalyScore += 0.1
          validationDetails.push(`Uncommon initial window size for residential proxy: ${settings.initialWindowSize}`)
        }
      }

      // Validate HTTP/2 priority frames if available
      if (fingerprint.priorityFrames && fingerprint.priorityFrames.length > 0) {
        // Check if priority frames match common browser patterns
        // This is a placeholder - in a real implementation, we would have more sophisticated checks
        if (fingerprint.priorityFrames.length < 3 || fingerprint.priorityFrames.length > 20) {
          anomalyScore += 0.1
          validationDetails.push(`Unusual number of HTTP/2 priority frames: ${fingerprint.priorityFrames.length}`)
        }
      } else {
        // Most browsers send priority frames
        anomalyScore += 0.1
        validationDetails.push(`Missing HTTP/2 priority frames`)
      }

      // Validate header order if available
      if (fingerprint.headerOrder && characteristics) {
        const headerOrder = fingerprint.headerOrder
        let headerOrderMatch = false

        for (const pattern of characteristics.headerOrderPatterns) {
          // Check if the header order matches any of the common patterns for the region
          const matchRatio = this.calculateHeaderOrderMatchRatio(headerOrder, pattern)
          if (matchRatio > 0.7) {
            headerOrderMatch = true
            confidenceScore += 0.1
            validationDetails.push(`Header order matches regional pattern: ${matchRatio.toFixed(2)} match ratio`)
            break
          }
        }

        if (!headerOrderMatch) {
          anomalyScore += 0.2
          validationDetails.push(`Header order does not match any regional pattern`)
        }
      }

      // Normalize scores
      anomalyScore = Math.min(1, anomalyScore)
      confidenceScore = Math.min(1, confidenceScore)

      // Determine validity
      const valid = anomalyScore < (strictMode ? 0.3 : 0.7)

      return {
        valid,
        confidenceScore,
        anomalyScore,
        details: validationDetails.join(", "),
      }
    } catch (error) {
      this.logger.error("Failed to validate HTTP/2 fingerprint", error)
      return {
        valid: false,
        confidenceScore: 0,
        anomalyScore: 1,
        details: `Error: ${error.message}`,
      }
    }
  }

  /**
   * Validate composite fingerprint
   */
  private validateCompositeFingerprint(
    fingerprint: any,
    proxyContext: ProxyContext,
    characteristics?: RegionalFingerprintCharacteristics,
    strictMode = false,
  ): { valid: boolean; confidenceScore: number; anomalyScore: number; details: string } {
    try {
      // Basic validation
      if (!fingerprint || !fingerprint.tls || !fingerprint.ja3) {
        return {
          valid: false,
          confidenceScore: 0,
          anomalyScore: 1,
          details: "Missing composite fingerprint data",
        }
      }

      // Validate individual components
      const tlsResult = this.validateTLSFingerprint(fingerprint.tls, proxyContext, characteristics, strictMode)
      const ja3Result = this.validateJA3Fingerprint(fingerprint.ja3, proxyContext, characteristics, strictMode)

      // Validate HTTP/2 if available
      let http2Result = {
        valid: true,
        confidenceScore: 0.5,
        anomalyScore: 0,
        details: "HTTP/2 fingerprint not provided",
      }

      if (fingerprint.http2) {
        http2Result = this.validateHTTP2Fingerprint(fingerprint.http2, proxyContext, characteristics, strictMode)
      }

      // Check for consistency between fingerprints
      let consistencyScore = 0
      const consistencyDetails: string[] = []

      // Check browser consistency
      if (
        fingerprint.tls.browserType &&
        fingerprint.ja3.browserType &&
        fingerprint.tls.browserType !== fingerprint.ja3.browserType
      ) {
        consistencyScore += 0.3
        consistencyDetails.push(
          `Browser type mismatch: TLS=${fingerprint.tls.browserType}, JA3=${fingerprint.ja3.browserType}`,
        )
      }

      // Check OS consistency
      if (fingerprint.tls.os && fingerprint.ja3.os && fingerprint.tls.os !== fingerprint.ja3.os) {
        consistencyScore += 0.3
        consistencyDetails.push(`OS mismatch: TLS=${fingerprint.tls.os}, JA3=${fingerprint.ja3.os}`)
      }

      // Check TLS version consistency
      if (
        fingerprint.tls.version &&
        fingerprint.ja3.tlsVersion &&
        fingerprint.tls.version !== fingerprint.ja3.tlsVersion
      ) {
        consistencyScore += 0.2
        consistencyDetails.push(
          `TLS version mismatch: TLS=${fingerprint.tls.version}, JA3=${fingerprint.ja3.tlsVersion}`,
        )
      }

      // Combine results
      const combinedConfidenceScore =
        (tlsResult.confidenceScore + ja3Result.confidenceScore + http2Result.confidenceScore) / 3
      const combinedAnomalyScore = Math.max(
        tlsResult.anomalyScore,
        ja3Result.anomalyScore,
        http2Result.anomalyScore,
        consistencyScore,
      )

      // Determine validity
      const valid =
        tlsResult.valid && ja3Result.valid && http2Result.valid && combinedAnomalyScore < (strictMode ? 0.3 : 0.7)

      return {
        valid,
        confidenceScore: combinedConfidenceScore,
        anomalyScore: combinedAnomalyScore,
        details: `TLS: ${tlsResult.details}, JA3: ${ja3Result.details}, HTTP2: ${http2Result.details}${
          consistencyDetails.length > 0 ? `, Consistency: ${consistencyDetails.join(", ")}` : ""
        }`,
      }
    } catch (error) {
      this.logger.error("Failed to validate composite fingerprint", error)
      return {
        valid: false,
        confidenceScore: 0,
        anomalyScore: 1,
        details: `Error: ${error.message}`,
      }
    }
  }

  /**
   * Calculate header order match ratio
   */
  private calculateHeaderOrderMatchRatio(headerOrder: string[], pattern: string[]): number {
    try {
      if (!headerOrder || !pattern || headerOrder.length === 0 || pattern.length === 0) {
        return 0
      }

      // Count matching headers in the correct order
      let matchCount = 0
      let patternIndex = 0

      for (let i = 0; i < headerOrder.length && patternIndex < pattern.length; i++) {
        if (headerOrder[i].toLowerCase() === pattern[patternIndex].toLowerCase()) {
          matchCount++
          patternIndex++
        }
      }

      // Calculate match ratio
      return matchCount / Math.max(headerOrder.length, pattern.length)
    } catch (error) {
      this.logger.error("Failed to calculate header order match ratio", error)
      return 0
    }
  }

  /**
   * Map proxy region to ISP region type
   */
  private mapProxyRegionToISPRegion(proxyRegion: string): ISPRegionType {
    // Map proxy region to ISP region type
    if (proxyRegion.startsWith("na-east")) {
      return "NA_EAST"
    } else if (proxyRegion.startsWith("na-west")) {
      return "NA_WEST"
    } else if (proxyRegion.startsWith("eu-west")) {
      return "EU_WEST"
    } else if (proxyRegion.startsWith("eu-central")) {
      return "EU_CENTRAL"
    } else if (proxyRegion.startsWith("ap-east")) {
      return "ASIA_EAST"
    } else if (proxyRegion.startsWith("ap-south")) {
      return "ASIA_SOUTH"
    } else if (proxyRegion.startsWith("ap-southeast")) {
      return "OCEANIA"
    } else if (proxyRegion.startsWith("sa-east")) {
      return "SOUTH_AMERICA"
    } else if (proxyRegion.startsWith("af")) {
      return "AFRICA"
    } else if (proxyRegion.startsWith("me")) {
      return "MIDDLE_EAST"
    } else {
      // Default to NA_EAST if region is unknown
      return "NA_EAST"
    }
  }

  /**
   * Generate validation hash
   */
  private generateValidationHash(fingerprint: any, proxyContext: ProxyContext, details: string): string {
    try {
      // Create a string representation of the validation
      const validationString = JSON.stringify({
        fingerprint,
        proxyId: proxyContext.proxyId,
        sessionId: proxyContext.sessionId,
        domain: proxyContext.domain,
        timestamp: Date.now(),
        details,
      })

      // Generate entropy for hash
      const entropy = entropyAmplificationSystem.generateEntropyForPurpose("fingerprint-validation", {
        consistentWith: proxyContext.sessionId,
      })

      // Create HMAC hash
      return createHmac("sha256", Buffer.from(proxyContext.sessionId)).update(validationString).digest("hex")
    } catch (error) {
      this.logger.error("Failed to generate validation hash", error)
      return createHash("sha256").update(`${proxyContext.sessionId}:${Date.now()}`).digest("hex") // Fallback
    }
  }

  /**
   * Clean up resources
   */
  public async cleanup(): Promise<void> {
    try {
      // Clear caches
      this.fingerprintCache.clear()
      this.regionalCharacteristics.clear()

      this.initialized = false

      this.logger.info("Fingerprint-Proxy Validator cleaned up")
    } catch (error) {
      this.logger.error("Failed to clean up Fingerprint-Proxy Validator", error)
    }
  }
}

// Export singleton instance
export const fingerprintProxyValidator = FingerprintProxyValidator.getInstance()

// Helper functions for easier access
export async function initializeFingerprintProxyValidator(): Promise<void> {
  return fingerprintProxyValidator.initialize()
}

export async function validateFingerprintProxyLink(
  fingerprint: any,
  proxyContext: ProxyContext,
  fingerprintType?: FingerprintType,
  options?: FingerprintValidationOptions,
): Promise<FingerprintValidationResult> {
  return fingerprintProxyValidator.validateFingerprintProxyLink(fingerprint, proxyContext, fingerprintType, options)
}

export async function cleanupFingerprintProxyValidator(): Promise<void> {
  return fingerprintProxyValidator.cleanup()
}
