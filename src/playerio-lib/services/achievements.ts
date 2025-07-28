/** @module Achievements */
import type HTTPChannel from '../channel.ts'
import PlayerIOError from '../error.ts'
const { PlayerIOErrorCode } = PlayerIOError

type onAchievementHandler = (arg0: Achievement) => any

/**
 * The Achievements service. This class is used to update the progress of an achievement for the
 * current user, and loading achievements of other users. All achievements have to be defined in the
 * admin panel first.
 */
export default class Achievements {
  protected channel: HTTPChannel

  private _list: Achievement[] = []

  onCompleteHandlers: onAchievementHandler[]

  /**
   * If null, the achievements has not been refreshed.
   */
  currentVersion: string | null

  constructor(channel: HTTPChannel) {
    this.channel = channel
    this.onCompleteHandlers = []

    this.currentVersion = null
  }

  /**
   * The list of achievements for the current user. You must call refresh() first to initialize this list.
   */
  get myAchievements() {
    if (this._list === undefined)
      throw Error(
        '[ERROR: You tried to access achievements.myAchievements before loading them. You have to call the refresh method first.]',
      )
    return this._list
  }

  addOnComplete(onCompleteHandler: onAchievementHandler) {
    if (typeof onCompleteHandler === 'function' && onCompleteHandler.length == 1) {
      this.onCompleteHandlers.push(onCompleteHandler)
    } else {
      throw new PlayerIOError(
        PlayerIOErrorCode.InvalidArgument,
        'Expects argument to be a function that takes an achievement as an argument.',
      )
    }
  }

  /**
   * Get an achievement by id
   * @param {string} achievementId Id of the achievement to get.
   */
  get(achievementId: string) {
    //if (typeof this.myAchievements === 'string') { return null; }
    for (var i = 0; i < this.myAchievements.length; i++) {
      if (this.myAchievements[i].id == achievementId) {
        return this.myAchievements[i]
      }
    }
    return null
  }

  /**
   * Refresh the list of achievements.
   */
  refresh(): Promise<Achievement[]> {
    return this.channel.achievementsRefresh(this.currentVersion).then((result) => {
      if (this.currentVersion == result.version) return this.myAchievements

      this.currentVersion = result.version
      if (result.achievements == null || result.achievements.length == 0) {
        this._list = []
        return []
      } else {
        let achs: Achievement[] = []
        for (let i = 0; i < result.achievements.length; i++) {
          let item = result.achievements[i]
          achs.push(
            new Achievement(
              item.identifier,
              item.title,
              item.description,
              item.imageurl,
              item.progress,
              item.progressgoal,
              item.lastupdated,
            ),
          )
        }

        this._list = achs
        return achs
      }
    })
  }

  /**
   * Load the achivements for multiple users by their connectUserId
   * @param {string[]} userIds The list of users to load achievements for.
   */
  load(userIds: string[]): Promise<{ [userId: string]: Achievement[] }> {
    if (!Array.isArray(userIds)) {
      throw Error(
        "The first argument to load should be an array: client.achievements.load(['user1', 'user2', ...], ...)",
      )
    }

    return this.channel.achievementsLoad(userIds).then((result) => {
      if (result == null || result.length == 0) {
        return {}
      }

      let users: { [userId: string]: Achievement[] } = {}

      for (let i = 0; i < result.userachievements.length; i++) {
        let user = result.userachievements[i]
        let achs: Achievement[] = []

        for (let j = 0; j < user.achievements.length; j++) {
          let item = user.achievements[j]
          achs.push(
            new Achievement(
              item.identifier,
              item.title,
              item.description,
              item.imageurl,
              item.progress,
              item.progressgoal,
              item.lastupdated,
            ),
          )
        }

        users[user.userid] = achs
      }
      return users
    })
  }

  /**
   * Sets the progress of the specified achievement
   * @param {string} achievementId The id of the achievement to set the progress for.
   * @param {number} progress The value to set the progress to
   */
  progressSet(achievementId: string, progress: number) {
    return this.channel.achievementsProgressSet(achievementId, progress).then((result) => {
      return this.update(result.achievement, result.completednow)
    })
  }

  /**
   * Adds the delta to the progress of the specified achievement
   * @param {string} achievementId The id of the achievement to add to the progress for.
   * @param {number} progressDelta The value to add to the progress.
   */
  progressAdd(achievementId: string, progressDelta: number) {
    return this.channel.achievementsProgressAdd(achievementId, progressDelta).then((result) => {
      return this.update(result.achievement, result.completednow)
    })
  }

  /**
   * Sets the progress of the specified achievement to the bigger value of the current value and the given value.
   * @param {string} achievementId The id of the achievement to set the progress for.
   * @param {number} progress The value to set the progress to, if it's bigger than the current value.
   */
  progressMax(achievementId: string, progress: number) {
    return this.channel.achievementsProgressMax(achievementId, progress).then((result) => {
      return this.update(result.achievement, result.completednow)
    })
  }

  /**
   * Completes the specified achievement by setting the progress to the progress goal.
   * @param {string} achievementId The id of the achievement to complete.
   */
  progressComplete(achievementId: string) {
    return this.channel.achievementsProgressComplete(achievementId).then((result) => {
      return this.update(result.achievement, result.completednow)
    })
  }

  /**
   * THIS IS FOR INTERNAL USE!
   * @returns {Achievement}
   */
  protected update(achievement: any, completednow: boolean): Achievement {
    // Convert received achievement data into client achievement object
    let ach = new Achievement(
      achievement.identifier,
      achievement.title,
      achievement.description,
      achievement.imageurl,
      achievement.progress,
      achievement.progressgoal,
      achievement.lastupdated,
    )

    if (typeof this.myAchievements !== 'string') {
      for (var i = 0; i < this.myAchievements.length; i++) {
        if (this.myAchievements[i].id == ach.id) {
          this.myAchievements[i] = ach
          //Clear version, because we can't be sure our current local state is the latest.
          this.currentVersion = null
        }
      }
    }

    if (completednow) {
      for (let i = 0; i < this.onCompleteHandlers.length; i++) {
        this.onCompleteHandlers[i](ach)
      }
    }

    return ach
  }
}

export class Achievement {
  /**
   * The id of this achievement.
   */
  id: string
  /**
   * The title of this achievement.
   */
  title: string
  /**
   * The description of this achievement.
   */
  description: string
  /**
   * The image url of this achievement.
   */
  imageUrl: string
  /**
   * The progress of this achievement.
   */
  progress: number
  /**
   * The progress goal of this achievement.
   */
  progressGoal: number
  /**
   * When this achievement was last updated.
   */
  lastUpdated: Date
  /**
   * The progress ratio of this achievement.
   */
  progressRatio: number
  /**
   * If this achievement is completed.
   */
  completed: boolean

  constructor(
    id: string,
    title: string,
    description: string,
    imageUrl: string,
    progress: number,
    progressGoal: number,
    lastUpdated: number,
  ) {
    this.id = id
    this.title = title
    this.description = description
    this.imageUrl = imageUrl
    this.progress = typeof progress === 'undefined' ? 0 : progress
    this.progressGoal = progressGoal
    this.lastUpdated = new Date(lastUpdated * 1000)
    this.progressRatio = this.progress / this.progressGoal
    this.completed = this.progress == this.progressGoal
  }
}
