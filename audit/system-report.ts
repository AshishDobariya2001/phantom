// PHANTOM-GRADE SYSTEM REPORT
// Classification: FOUNDER-EYES-ONLY
// Version: 3.2.1-MILITARY

import { Logger } from "../utils/logger"
import performSystemAudit, { type AuditResult } from "./system-audit"

/**
 * System report
 */
interface SystemReport {
  timestamp: number
  systemVersion: string
  auditResults: AuditResult[]
  systemStatus: "OPERATIONAL" | "DEGRADED" | "CRITICAL" | "UNKNOWN"
  securityScore: number // 0-100
  performanceScore: number // 0-100
  integrityScore: number // 0-100
  recommendations: string[]
  criticalIssues: string[]
  warnings: string[]
}

/**
 * Generate system report
 */
export async function generateSystemReport(): Promise<SystemReport> {
  const logger = new Logger("SystemReport", "MILITARY")

  try {
    logger.info("Generating comprehensive system report")

    // Perform system audit
    const auditResults = await performSystemAudit()

    // Calculate scores
    const securityScore = calculateSecurityScore(auditResults)
    const performanceScore = calculatePerformanceScore(auditResults)
    const integrityScore = calculateIntegrityScore(auditResults)

    // Determine system status
    const systemStatus = determineSystemStatus(auditResults, securityScore, performanceScore, integrityScore)

    // Collect recommendations, critical issues, and warnings
    const recommendations = collectRecommendations(auditResults)
    const criticalIssues = collectCriticalIssues(auditResults)
    const warnings = collectWarnings(auditResults)

    // Create report
    const report: SystemReport = {
      timestamp: Date.now(),
      systemVersion: "3.2.1-MILITARY",
      auditResults,
      systemStatus,
      securityScore,
      performanceScore,
      integrityScore,
      recommendations,
      criticalIssues,
      warnings,
    }

    logger.info("System report generated", {
      systemStatus,
      securityScore,
      performanceScore,
      integrityScore,
      criticalIssuesCount: criticalIssues.length,
      warningsCount: warnings.length,
    })

    return report
  } catch (error) {
    logger.error("Failed to generate system report", error)

    // Return basic report on error
    return {
      timestamp: Date.now(),
      systemVersion: "3.2.1-MILITARY",
      auditResults: [],
      systemStatus: "UNKNOWN",
      securityScore: 0,
      performanceScore: 0,
      integrityScore: 0,
      recommendations: ["Retry system report generation", "Check system initialization", "Verify audit process"],
      criticalIssues: [`System report generation failed: ${error.message}`],
      warnings: [],
    }
  }
}

/**
 * Calculate security score
 */
function calculateSecurityScore(auditResults: AuditResult[]): number {
  // Security-related components
  const securityComponents = [
    "SecurityHardening",
    "EntropyAmplificationSystem",
    "QuantumResistantIntegrityVerification",
  ]

  // Get security-related audit results
  const securityResults = auditResults.filter((result) => securityComponents.includes(result.component))

  if (securityResults.length === 0) {
    return 0
  }

  // Calculate score based on status
  const totalScore = securityResults.reduce((score, result) => {
    switch (result.status) {
      case "PASS":
        return score + 100
      case "WARN":
        return score + 50
      case "FAIL":
        return score + 0
      default:
        return score
    }
  }, 0)

  return Math.round(totalScore / securityResults.length)
}

/**
 * Calculate performance score
 */
function calculatePerformanceScore(auditResults: AuditResult[]): number {
  // Performance-related components
  const performanceComponents = ["Performance", "ProxyManager", "ProxyRotationScheduler"]

  // Get performance-related audit results
  const performanceResults = auditResults.filter((result) => performanceComponents.includes(result.component))

  if (performanceResults.length === 0) {
    return 0
  }

  // Calculate score based on status
  const totalScore = performanceResults.reduce((score, result) => {
    switch (result.status) {
      case "PASS":
        return score + 100
      case "WARN":
        return score + 60
      case "FAIL":
        return score + 0
      default:
        return score
    }
  }, 0)

  return Math.round(totalScore / performanceResults.length)
}

/**
 * Calculate integrity score
 */
function calculateIntegrityScore(auditResults: AuditResult[]): number {
  // Integrity-related components
  const integrityComponents = [
    "QuantumResistantIntegrityVerification",
    "TemporalConsistencyVerification",
    "SystemIntegration",
  ]

  // Get integrity-related audit results
  const integrityResults = auditResults.filter((result) => integrityComponents.includes(result.component))

  if (integrityResults.length === 0) {
    return 0
  }

  // Calculate score based on status
  const totalScore = integrityResults.reduce((score, result) => {
    switch (result.status) {
      case "PASS":
        return score + 100
      case "WARN":
        return score + 40
      case "FAIL":
        return score + 0
      default:
        return score
    }
  }, 0)

  return Math.round(totalScore / integrityResults.length)
}

/**
 * Determine system status
 */
function determineSystemStatus(
  auditResults: AuditResult[],
  securityScore: number,
  performanceScore: number,
  integrityScore: number,
): "OPERATIONAL" | "DEGRADED" | "CRITICAL" | "UNKNOWN" {
  // Count failures
  const failureCount = auditResults.filter((result) => result.status === "FAIL").length

  // Check for critical failures
  const criticalFailures = auditResults.filter(
    (result) =>
      result.status === "FAIL" &&
      ["SecurityHardening", "EntropyAmplificationSystem", "QuantumResistantIntegrityVerification"].includes(
        result.component,
      ),
  )

  if (failureCount > 2 || criticalFailures.length > 0) {
    return "CRITICAL"
  }

  // Check for degraded status
  const warningCount = auditResults.filter((result) => result.status === "WARN").length
  const averageScore = (securityScore + performanceScore + integrityScore) / 3

  if (warningCount > 3 || averageScore < 70) {
    return "DEGRADED"
  }

  // Check if we have enough data
  if (auditResults.length < 5) {
    return "UNKNOWN"
  }

  return "OPERATIONAL"
}

/**
 * Collect recommendations
 */
function collectRecommendations(auditResults: AuditResult[]): string[] {
  // Get all recommendations
  const allRecommendations = auditResults
    .filter((result) => result.recommendations && result.recommendations.length > 0)
    .flatMap((result) => result.recommendations || [])

  // Remove duplicates
  return [...new Set(allRecommendations)]
}

/**
 * Collect critical issues
 */
function collectCriticalIssues(auditResults: AuditResult[]): string[] {
  // Get all critical issues
  return auditResults
    .filter((result) => result.status === "FAIL")
    .map((result) => `${result.component}: ${result.details}`)
}

/**
 * Collect warnings
 */
function collectWarnings(auditResults: AuditResult[]): string[] {
  // Get all warnings
  return auditResults
    .filter((result) => result.status === "WARN")
    .map((result) => `${result.component}: ${result.details}`)
}

// Export report generation function
export default generateSystemReport
