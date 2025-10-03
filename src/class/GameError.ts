// Use it when error happens while bot is in game and error message is intended to be printed in chat
export class GameError extends Error {
  public readonly playerId: number | null

  // If playerId is provided, error is intended to be sent as private chat message to that player
  constructor(message: string, playerId: number | null = null) {
    super(message)
    this.name = this.constructor.name
    this.playerId = playerId
  }
}
