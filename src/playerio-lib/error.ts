/** @module PlayerIOError */

export default class PlayerIOError extends Error {
  /**
   * The PlayerIO error code for this error
   */
  code: string

  constructor(code: string, message: string) {
    super(message)

    this.code = code
  }

  /**
   * Get a string representation of the error
   */
  override toString(): string {
    return 'PlayerIOError[' + this.code + ']: ' + this.message
  }

  static PlayerIOErrorCode = {
    /** The method requested is not supported */
    UnsupportedMethod: 'UnsupportedMethod',
    /** A general error occurred */
    GeneralError: 'GeneralError',
    /** An unexpected error occurred inside the Player.IO webservice. Please try again. */
    InternalError: 'InternalError',
    /** Access is denied */
    AccessDenied: 'AccessDenied',
    /** The message is malformatted */
    InvalidMessageFormat: 'InvalidMessageFormat',
    /** A value is missing */
    MissingValue: 'MissingValue',
    /** A game is required to do this action */
    GameRequired: 'GameRequired',
    /** An error occurred while contacting an external service */
    ExternalError: 'ExternalError',
    /** The given argument value is outside the range of allowed values. */
    ArgumentOutOfRange: 'ArgumentOutOfRange',
    /** The game has been disabled, most likely because of missing payment. */
    GameDisabled: 'GameDisabled',
    /** The game requested is not known by the server */
    UnknownGame: 'UnknownGame',
    /** The connection requested is not known by the server */
    UnknownConnection: 'UnknownConnection',
    /** The auth given is invalid or malformatted */
    InvalidAuth: 'InvalidAuth',
    /** There is no server in any of the selected server clusters for the game that are eligible to start a new room in (they're all at full capacity or there are no servers in any of the clusters). Either change the selected clusters for your game in the admin panel, try again later or start some more servers for one of your clusters. */
    NoServersAvailable: 'NoServersAvailable',
    /** The room data for the room was over the allowed size limit */
    RoomDataTooLarge: 'RoomDataTooLarge',
    /** You are unable to create room because there is already a room with the specified id */
    RoomAlreadyExists: 'RoomAlreadyExists',
    /** The game you're connected to does not have a room type with the specified name */
    UnknownRoomType: 'UnknownRoomType',
    /** There is no room running with that id */
    UnknownRoom: 'UnknownRoom',
    /** You can't join the room when the RoomID is null or the empty string */
    MissingRoomId: 'MissingRoomId',
    /** The room already has the maxmium amount of users in it. */
    RoomIsFull: 'RoomIsFull',
    /** The key you specified is not set as searchable. You can change the searchable keys in the admin panel for the server type */
    NotASearchColumn: 'NotASearchColumn',
    /** The QuickConnect method (simple, facebook, kongregate...) is not enabled for the game. You can enable the various methods in the admin panel for the game */
    QuickConnectMethodNotEnabled: 'QuickConnectMethodNotEnabled',
    /** The user is unknown */
    UnknownUser: 'UnknownUser',
    /** The password supplied is incorrect */
    InvalidPassword: 'InvalidPassword',
    /** The supplied data is incorrect */
    InvalidRegistrationData: 'InvalidRegistrationData',
    /** The key given for the BigDB object is not a valid BigDB key. Keys must be between 1 and 50 characters. Only letters, numbers, hyphens, underbars, and spaces are allowed. */
    InvalidBigDBKey: 'InvalidBigDBKey',
    /** The object exceeds the maximum allowed size for BigDB objects. */
    BigDBObjectTooLarge: 'BigDBObjectTooLarge',
    /** Could not locate the database object. */
    BigDBObjectDoesNotExist: 'BigDBObjectDoesNotExist',
    /** The specified table does not exist. */
    UnknownTable: 'UnknownTable',
    /** The specified index does not exist. */
    UnknownIndex: 'UnknownIndex',
    /** The value given for the index, does not match the expected type. */
    InvalidIndexValue: 'InvalidIndexValue',
    /** The operation was aborted because the user attempting the operation was not the original creator of the object accessed. */
    NotObjectCreator: 'NotObjectCreator',
    /** The key is in use by another database object */
    KeyAlreadyUsed: 'KeyAlreadyUsed',
    /** BigDB object could not be saved using optimistic locks as it's out of date. */
    StaleVersion: 'StaleVersion',
    /** Cannot create circular references inside database objects */
    CircularReference: 'CircularReference',
    /** The server could not complete the heartbeat */
    HeartbeatFailed: 'HeartbeatFailed',
    /** The game code is invalid */
    InvalidGameCode: 'InvalidGameCode',
    /** Cannot access coins or items before vault has been loaded. Please refresh the vault first. */
    VaultNotLoaded: 'VaultNotLoaded',
    /** There is no PayVault provider with the specified id */
    UnknownPayVaultProvider: 'UnknownPayVaultProvider',
    /** The specified PayVault provider does not support direct purchase */
    DirectPurchaseNotSupportedByProvider: 'DirectPurchaseNotSupportedByProvider',
    /** The specified PayVault provider does not support buying coins */
    BuyingCoinsNotSupportedByProvider: 'BuyingCoinsNotSupportedByProvider',
    /** The user does not have enough coins in the PayVault to complete the purchase or debit. */
    NotEnoughCoins: 'NotEnoughCoins',
    /** The item does not exist in the vault. */
    ItemNotInVault: 'ItemNotInVault',
    /** The chosen provider rejected one or more of the purchase arguments */
    InvalidPurchaseArguments: 'InvalidPurchaseArguments',
    /** The chosen provider is not configured correctly in the admin panel */
    InvalidPayVaultProviderSetup: 'InvalidPayVaultProviderSetup',
    /** Unable to locate the custom PartnerPay action with the given key */
    UnknownPartnerPayAction: 'UnknownPartnerPayAction',
    /** The given type was invalid */
    InvalidType: 'InvalidType',
    /** The index was out of bounds from the range of acceptable values */
    IndexOutOfBounds: 'IndexOutOfBounds',
    /** The given identifier does not match the expected format */
    InvalidIdentifier: 'InvalidIdentifier',
    /** The given argument did not have the expected value */
    InvalidArgument: 'InvalidArgument',
    /** This client has been logged out */
    LoggedOut: 'LoggedOut',
    /** The given segment was invalid. */
    InvalidSegment: 'InvalidSegment',
    /** Cannot access requests before Refresh() has been called. */
    GameRequestsNotLoaded: 'GameRequestsNotLoaded',
    /** Cannot access achievements before Refresh() has been called. */
    AchievementsNotLoaded: 'AchievementsNotLoaded',
    /** Cannot find the achievement with the specified id. */
    UnknownAchievement: 'UnknownAchievement',
    /** Cannot access notification endpoints before Refresh() has been called. */
    NotificationsNotLoaded: 'NotificationsNotLoaded',
    /** The given notifications endpoint is invalid */
    InvalidNotificationsEndpoint: 'InvalidNotificationsEndpoint',
    /** There is an issue with the network */
    NetworkIssue: 'NetworkIssue',
    /** Cannot access OneScore before Refresh() has been called. */
    OneScoreNotLoaded: 'OneScoreNotLoaded',
    /** The Publishing Network features are only avaliable when authenticated to PlayerIO using Publishing Network authentication. Authentication methods are managed in the connections setting of your game in the admin panel on PlayerIO. */
    PublishingNetworkNotAvailable: 'PublishingNetworkNotAvailable',
    /** Cannot access profile, friends, ignored before Publishing Network has been loaded. Please refresh Publishing Network first. */
    PublishingNetworkNotLoaded: 'PublishingNetworkNotLoaded',
    /** The dialog was closed by the user */
    DialogClosed: 'DialogClosed',
    /** Check cookie required. */
    AdTrackCheckCookie: 'AdTrackCheckCookie',
    codes: {
      0: 'UnsupportedMethod',
      1: 'GeneralError',
      2: 'InternalError',
      3: 'AccessDenied',
      4: 'InvalidMessageFormat',
      5: 'MissingValue',
      6: 'GameRequired',
      7: 'ExternalError',
      8: 'ArgumentOutOfRange',
      9: 'GameDisabled',
      10: 'UnknownGame',
      11: 'UnknownConnection',
      12: 'InvalidAuth',
      13: 'NoServersAvailable',
      14: 'RoomDataTooLarge',
      15: 'RoomAlreadyExists',
      16: 'UnknownRoomType',
      17: 'UnknownRoom',
      18: 'MissingRoomId',
      19: 'RoomIsFull',
      20: 'NotASearchColumn',
      21: 'QuickConnectMethodNotEnabled',
      22: 'UnknownUser',
      23: 'InvalidPassword',
      24: 'InvalidRegistrationData',
      25: 'InvalidBigDBKey',
      26: 'BigDBObjectTooLarge',
      27: 'BigDBObjectDoesNotExist',
      28: 'UnknownTable',
      29: 'UnknownIndex',
      30: 'InvalidIndexValue',
      31: 'NotObjectCreator',
      32: 'KeyAlreadyUsed',
      33: 'StaleVersion',
      34: 'CircularReference',
      40: 'HeartbeatFailed',
      41: 'InvalidGameCode',
      50: 'VaultNotLoaded',
      51: 'UnknownPayVaultProvider',
      52: 'DirectPurchaseNotSupportedByProvider',
      54: 'BuyingCoinsNotSupportedByProvider',
      55: 'NotEnoughCoins',
      56: 'ItemNotInVault',
      57: 'InvalidPurchaseArguments',
      58: 'InvalidPayVaultProviderSetup',
      70: 'UnknownPartnerPayAction',
      80: 'InvalidType',
      81: 'IndexOutOfBounds',
      82: 'InvalidIdentifier',
      83: 'InvalidArgument',
      84: 'LoggedOut',
      90: 'InvalidSegment',
      100: 'GameRequestsNotLoaded',
      110: 'AchievementsNotLoaded',
      111: 'UnknownAchievement',
      120: 'NotificationsNotLoaded',
      121: 'InvalidNotificationsEndpoint',
      130: 'NetworkIssue',
      131: 'OneScoreNotLoaded',
      200: 'PublishingNetworkNotAvailable',
      201: 'PublishingNetworkNotLoaded',
      301: 'DialogClosed',
      302: 'AdTrackCheckCookie',
    },
  } as const
}
