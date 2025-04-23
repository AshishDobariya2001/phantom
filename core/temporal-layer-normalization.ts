import type { Logger } from "./logger"
import type { StorageService } from "./storage-service"

export enum TimeOfDay {
  MORNING = "MORNING",
  AFTERNOON = "AFTERNOON",
  EVENING = "EVENING",
  NIGHT = "NIGHT",
}

export enum DayOfWeek {
  SUNDAY = "SUNDAY",
  MONDAY = "MONDAY",
  TUESDAY = "TUESDAY",
  WEDNESDAY = "WEDNESDAY",
  THURSDAY = "THURSDAY",
  FRIDAY = "FRIDAY",
  SATURDAY = "SATURDAY",
}

export interface TemporalNormalizationOptions {
  patternType?: "CIRCADIAN" | "WEEKLY"
  strictMode?: boolean
}

export interface TemporalNormalizationResult {
  shouldExecute: boolean
  recommendedDelay: number
  nextWindowStart: number
  nextWindowEnd: number
  currentActivityLevel: number
  timestamp: number
}

interface TemporalProfile {
  id: string
  sessionId: string
  domain: string
  patternType: "CIRCADIAN" | "WEEKLY"
  activityDistribution: { [key in TimeOfDay]: number }
  weekdayDistribution: { [key in DayOfWeek]: number }
  idleParameters: { minIdle: number; maxIdle: number }
  lastActivity: number
  nextActivity: number
  created: number
  updated: number
}

export class TemporalLayerNormalization {
  private profiles: Map<string, TemporalProfile> = new Map()
  private initialized = false

  constructor(
    private readonly storageService: StorageService,
    private readonly logger: Logger,
  ) {}

  public async initialize(): Promise<void> {
    // Load profiles from storage
    // For simplicity, let's assume there's no persistent storage for now
    this.initialized = true
  }

  private findProfileId(profileKey: string): string | undefined {
    for (const [id, profile] of this.profiles.entries()) {
      if (`${profile.sessionId}:${profile.domain}:${profile.patternType}` === profileKey) {
        return id
      }
    }
    return undefined
  }

  private async createTemporalProfile(
    sessionId: string,
    domain: string,
    options: TemporalNormalizationOptions = {},
  ): Promise<string> {
    const now = Date.now()
    const patternType = options.patternType || "CIRCADIAN"

    const profileId = `profile-${now}-${Math.random()}`

    // Default activity distribution (example)
    const activityDistribution = {
      [TimeOfDay.MORNING]: 0.8,
      [TimeOfDay.AFTERNOON]: 1.0,
      [TimeOfDay.EVENING]: 0.7,
      [TimeOfDay.NIGHT]: 0.2,
    }

    // Default weekday distribution (example)
    const weekdayDistribution = {
      [DayOfWeek.SUNDAY]: 0.6,
      [DayOfWeek.MONDAY]: 0.9,
      [DayOfWeek.TUESDAY]: 0.9,
      [DayOfWeek.WEDNESDAY]: 0.9,
      [DayOfWeek.THURSDAY]: 0.9,
      [DayOfWeek.FRIDAY]: 1.0,
      [DayOfWeek.SATURDAY]: 0.7,
    }

    // Default idle parameters (example)
    const idleParameters = {
      minIdle: 60 * 60 * 1000, // 1 hour
      maxIdle: 4 * 60 * 60 * 1000, // 4 hours
    }

    const profile: TemporalProfile = {
      id: profileId,
      sessionId,
      domain,
      patternType,
      activityDistribution,
      weekdayDistribution,
      idleParameters,
      lastActivity: now,
      nextActivity: this.calculateNextActivity(now, activityDistribution, weekdayDistribution, idleParameters),
      created: now,
      updated: now,
    }

    this.profiles.set(profileId, profile)
    return profileId
  }

  private calculateNextActivity(
    lastActivity: number,
    activityDistribution: { [key in TimeOfDay]: number },
    weekdayDistribution: { [key in DayOfWeek]: number },
    idleParameters: { minIdle: number; maxIdle: number },
  ): number {
    const minIdle = idleParameters.minIdle
    const maxIdle = idleParameters.maxIdle

    // Simple random idle time within the range
    const idleTime = minIdle + Math.random() * (maxIdle - minIdle)
    return lastActivity + idleTime
  }

  private getDayOfWeek(day: number): DayOfWeek {
    switch (day) {
      case 0:
        return DayOfWeek.SUNDAY
      case 1:
        return DayOfWeek.MONDAY
      case 2:
        return DayOfWeek.TUESDAY
      case 3:
        return DayOfWeek.WEDNESDAY
      case 4:
        return DayOfWeek.THURSDAY
      case 5:
        return DayOfWeek.FRIDAY
      case 6:
        return DayOfWeek.SATURDAY
      default:
        return DayOfWeek.SUNDAY
    }
  }

  private getTimeOfDay(hour: number): TimeOfDay {
    if (hour >= 6 && hour < 12) {
      return TimeOfDay.MORNING
    } else if (hour >= 12 && hour < 18) {
      return TimeOfDay.AFTERNOON
    } else if (hour >= 18 && hour < 22) {
      return TimeOfDay.EVENING
    } else {
      return TimeOfDay.NIGHT
    }
  }

  private async getPersistentProfileId(sessionId: string, domain: string): Promise<string | undefined> {
    try {
      // Retrieve persistent profile ID from storage
      const profileKey = `persistent-profile:${sessionId}:${domain}`
      const profileId = await this.storageService.get(profileKey)
      return profileId || undefined
    } catch (error) {
      this.logger.error("Failed to get persistent profile ID", error)
      return undefined
    }
  }

  private async storePersistentProfile(sessionId: string, domain: string, profileId: string): Promise<void> {
    try {
      // Store persistent profile ID in storage
      const profileKey = `persistent-profile:${sessionId}:${domain}`
      await this.storageService.set(profileKey, profileId)
    } catch (error) {
      this.logger.error("Failed to store persistent profile ID", error)
    }
  }

  private async isRecurringSession(sessionId: string): Promise<boolean> {
    try {
      // Check if session has occurred before
      const sessionKey = `session-history:${sessionId}`
      const sessionData = await this.storageService.get(sessionKey)

      if (sessionData) {
        // Session has occurred before
        return true
      } else {
        // Mark session as occurred
        await this.storageService.set(sessionKey, Date.now().toString())
        return false
      }
    } catch (error) {
      this.logger.error("Failed to check if session is recurring", error)
      return false
    }
  }

  private async getBehavioralLearningModel(sessionId: string, domain: string): Promise<any> {
    try {
      // Retrieve model from persistent storage
      const modelKey = `behavioral:${sessionId}:${domain}`
      const modelData = await this.storageService.get(modelKey)

      if (!modelData) {
        return null
      }

      return JSON.parse(modelData)
    } catch (error) {
      this.logger.error("Failed to get behavioral learning model", error)
      return null
    }
  }

  private async updateBehavioralLearningModel(
    sessionId: string,
    domain: string,
    timeOfDay: TimeOfDay,
    dayOfWeek: DayOfWeek,
    wasActive: boolean,
  ): Promise<void> {
    try {
      // Get existing model or create new one
      const modelKey = `behavioral:${sessionId}:${domain}`
      const existingModelData = await this.storageService.get(modelKey)

      const model = existingModelData
        ? JSON.parse(existingModelData)
        : {
            timePatterns: {},
            domainPatterns: {},
            lastUpdated: Date.now(),
          }

      // Update time pattern
      const timeKey = `${timeOfDay}:${dayOfWeek}`
      if (!model.timePatterns[timeKey]) {
        model.timePatterns[timeKey] = {
          activeCount: 0,
          inactiveCount: 0,
        }
      }

      if (wasActive) {
        model.timePatterns[timeKey].activeCount++
      } else {
        model.timePatterns[timeKey].inactiveCount++
      }

      // Update domain pattern
      if (!model.domainPatterns[domain]) {
        model.domainPatterns[domain] = {
          visitCount: 0,
          lastVisit: 0,
        }
      }

      model.domainPatterns[domain].visitCount++
      model.domainPatterns[domain].lastVisit = Date.now()

      // Update model
      model.lastUpdated = Date.now()

      // Store updated model
      await this.storageService.set(modelKey, JSON.stringify(model))
    } catch (error) {
      this.logger.error("Failed to update behavioral learning model", error)
    }
  }

  private async applyCrossSessionConsistency(
    sessionId: string,
    domain: string,
    timeOfDay: TimeOfDay,
    dayOfWeek: DayOfWeek,
  ): Promise<number> {
    try {
      // Get behavioral learning model
      const model = await this.getBehavioralLearningModel(sessionId, domain)

      if (!model) {
        return 1.0 // No model, no adjustment
      }

      // Check if current time matches historical patterns
      const timeKey = `${timeOfDay}:${dayOfWeek}`
      const timePattern = model.timePatterns[timeKey]

      if (!timePattern) {
        return 1.0 // No pattern for this time, no adjustment
      }

      // Calculate consistency factor based on historical activity
      const activityRatio = timePattern.activeCount / (timePattern.activeCount + timePattern.inactiveCount)

      // Apply non-linear transformation to create more natural behavior
      // Higher historical activity = higher consistency factor
      return 0.7 + activityRatio * 0.6 // Range: 0.7-1.3
    } catch (error) {
      this.logger.error("Failed to apply cross-session consistency", error)
      return 1.0 // No adjustment on error
    }
  }

  public async normalizeTemporalActivity(
    sessionId: string,
    domain: string,
    options: TemporalNormalizationOptions = {},
  ): Promise<TemporalNormalizationResult> {
    try {
      if (!this.initialized) {
        await this.initialize()
      }

      // Check for persistent profile
      const persistentProfileId = await this.getPersistentProfileId(sessionId, domain)
      let profileId: string

      if (persistentProfileId) {
        // Use existing persistent profile
        profileId = persistentProfileId
      } else {
        // Set defaults
        const patternType = options.patternType || "CIRCADIAN"

        // Find profile
        const profileKey = `${sessionId}:${domain}:${patternType}`
        profileId = this.findProfileId(profileKey)

        // Create profile if it doesn't exist
        if (!profileId) {
          profileId = await this.createTemporalProfile(sessionId, domain, options)

          // Store as persistent profile if this is a recurring session
          if (await this.isRecurringSession(sessionId)) {
            await this.storePersistentProfile(sessionId, domain, profileId)
          }
        }
      }

      const profile = this.profiles.get(profileId)

      if (!profile) {
        throw new Error(`Profile ${profileId} not found`)
      }

      // Get current time
      const now = Date.now()

      // Get current time of day and day of week
      const date = new Date(now)
      const hour = date.getHours()
      const dayOfWeek = this.getDayOfWeek(date.getDay())
      const timeOfDay = this.getTimeOfDay(hour)

      // Get activity level for current time
      const currentActivityLevel = profile.activityDistribution[timeOfDay] * profile.weekdayDistribution[dayOfWeek]

      // Check if we're in an idle period
      const inIdlePeriod = now < profile.nextActivity

      // Determine if we should execute now
      let shouldExecute = !inIdlePeriod

      // Apply cross-session consistency
      const crossSessionFactor = await this.applyCrossSessionConsistency(sessionId, domain, timeOfDay, dayOfWeek)

      // Adjust activity level based on cross-session consistency
      const adjustedActivityLevel = currentActivityLevel * crossSessionFactor

      // If in strict mode, apply additional constraints
      if (options.strictMode) {
        // In strict mode, we only execute if activity level is high enough
        shouldExecute = shouldExecute && adjustedActivityLevel > 0.5
      }

      // Calculate recommended delay if we shouldn't execute
      let recommendedDelay = 0
      if (!shouldExecute) {
        if (inIdlePeriod) {
          // If in idle period, delay until next activity
          recommendedDelay = profile.nextActivity - now
        } else {
          // Otherwise, calculate delay based on activity level
          const baseDelay = 60 * 60 * 1000 // 1 hour base
          const activityFactor = 1 - adjustedActivityLevel // Invert activity level
          const randomFactor = 0.5 + Math.random() // 0.5-1.5 random factor
          recommendedDelay = baseDelay * activityFactor * randomFactor
        }
      }

      // Calculate next window
      const nextWindowStart = inIdlePeriod ? profile.nextActivity : now
      const nextWindowEnd = this.calculateNextActivity(
        nextWindowStart,
        profile.activityDistribution,
        profile.weekdayDistribution,
        profile.idleParameters,
      )

      // Update profile
      if (shouldExecute) {
        profile.lastActivity = now
        profile.nextActivity = this.calculateNextActivity(
          now,
          profile.activityDistribution,
          profile.weekdayDistribution,
          profile.idleParameters,
        )
        profile.updated = now
        this.profiles.set(profileId, profile)

        // Update behavioral learning model
        await this.updateBehavioralLearningModel(sessionId, domain, timeOfDay, dayOfWeek, true)
      }

      return {
        shouldExecute,
        recommendedDelay,
        nextWindowStart,
        nextWindowEnd,
        currentActivityLevel: adjustedActivityLevel,
        timestamp: now,
      }
    } catch (error) {
      this.logger.error("Failed to normalize temporal activity", error)

      // Return safe fallback
      return {
        shouldExecute: true, // Default to allowing execution
        recommendedDelay: 0,
        nextWindowStart: Date.now(),
        nextWindowEnd: Date.now() + 60 * 60 * 1000, // 1 hour window
        currentActivityLevel: 0.5,
        timestamp: Date.now(),
      }
    }
  }
}
