// PHANTOM-GRADE PROXY TYPES
// Classification: FOUNDER-EYES-ONLY
// Version: 3.2.1-MILITARY

/**
 * Proxy types
 */
export enum ProxyType {
  HTTP = "HTTP",
  HTTPS = "HTTPS",
  SOCKS4 = "SOCKS4",
  SOCKS5 = "SOCKS5",
  RESIDENTIAL = "RESIDENTIAL",
  DATACENTER = "DATACENTER",
  MOBILE = "MOBILE",
  ROTATING = "ROTATING",
}

/**
 * Proxy status
 */
export enum ProxyStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  DEGRADED = "DEGRADED",
  BLOCKED = "BLOCKED",
}

/**
 * Proxy tier
 */
export enum ProxyTier {
  STANDARD = "STANDARD",
  PREMIUM = "PREMIUM",
  STEALTH = "STEALTH",
  PHANTOM = "PHANTOM",
  GHOST = "GHOST",
}

/**
 * Routing strategy
 */
export type RoutingStrategy = "PERFORMANCE" | "RELIABILITY" | "STEALTH" | "LOAD_BALANCE" | "RANDOM"

/**
 * Traffic pattern
 */
export type TrafficPattern = "NORMAL" | "BURST" | "HUMAN_LIKE" | "CORPORATE"

/**
 * Circuit breaker state
 */
export type CircuitBreakerState = {
  state: "CLOSED" | "OPEN" | "HALF_OPEN"
  failures: number
  lastFailure: number
  lastSuccess: number
  nextAttempt: number
}

/**
 * Proxy interface
 */
export interface Proxy {
  id: string
  host: string
  port: number
  type: ProxyType
  status: ProxyStatus
  tier: ProxyTier
  region: string
  username?: string
  password?: string
  lastUsed: number
  successCount: number
  failureCount: number
  detectionRisk: number
}

/**
 * Proxy health interface
 */
export interface ProxyHealth {
  status: ProxyStatus
  lastChecked: number
  responseTime: number
  successRate: number
  detectionAttempts: number
}

/**
 * ISP profile interface
 */
export interface ISPProfile {
  name: string
  region: string
  latencyBase: number
  latencyJitter: number
  packetLossRate: number
  bandwidthKbps: number
  timeOfDayCongestion: boolean
  useCacheBusters: boolean
  headerOrder?: string[]
}

/**
 * ISP spoof parameters
 */
export interface ISPSpoofParams extends ISPProfile {
  actualLatency: number
  packetLoss: boolean
  actualBandwidthKbps: number
  ttl: number
}

/**
 * TLS fingerprint
 */
export interface TLSFingerprint {
  fingerprint: string
  browserType: string
  majorVersion: number
  minorVersion: number
  platform: string
  created: number
}

/**
 * Behavioral profile
 */
export interface BehavioralProfile {
  type: "BOT" | "HUMAN" | "CORPORATE"
  actionDelay: [number, number] // Min and max delay in ms
  idleTimeout: [number, number] // Min and max timeout in ms
  scrollJitter: [number, number] // Min and max jitter in pixels
  submitDelay: [number, number] // Min and max delay in ms
}

/**
 * Proxy context
 */
export interface ProxyContext {
  proxyId: string
  sessionId: string
  domain: string
  proxy: {
    host: string
    port: number
    type: ProxyType
    tier: ProxyTier
    region: string
    username?: string
    password?: string
  }
  tlsFingerprint: string
  ispParams: ISPSpoofParams
  headers: Record<string, string>
  timestamp: number
  behaviorProfile?: BehavioralProfile
  timingSignature?: {
    actionDelay: number
    idleTimeout: number
    scrollJitter: number
    submitDelay: number
  }
}

/**
 * Request result
 */
export interface RequestResult {
  success: boolean
  isPrimary: boolean
  duration: number
  timestamp: number
  data?: any
  error?: string
}

/**
 * Decoy request result
 */
export interface DecoyRequestResult extends RequestResult {
  domain?: string
  proxyId?: string
  statusCode?: number
  noiseLevel?: "LOW" | "MEDIUM" | "HIGH"
}
