const EventEmitter = require('events');
const { ThreadHandler } = require('./threadHandler');
const { FeedEvents } = require('feed-events');

class ParameterError extends Error {
  constructor(...params) {
    super(...params);
  }
}

class FeedThreadsHandler extends EventEmitter {
  /**
   * @param {rssConfiguratiom} rss 
   * @param {discordConfiguration} discord 
   */
  constructor(rss, discord) {
    super();
    this.rss = rss;
    this.discord = discord;

    this.thread = new ThreadHandler(
      `https://discord.com/api/v` + this.discord.version, 
      this.discord.authorization);
        
  }

  /**
   * Starts FeedThreads 
   * @returns {Promise} 
   */
  async start() {
    return FeedEvents(
            this.rss.feedLocation,
            this.rss.fetchSchedule,
            this.rss.configuration, 
            this.rss.latest)
              .then(feed => {
                feed.on("item", item => this.emit("item", item, this.submit.bind(this)));
                feed.start();
                this.feed = feed;
              })
  }


  /**
   * Submit a message object to predefined channel and create thread on it
   * @param {string} threadTitle Title to use on the Discord Thread
   * @param {Object} messageObject Discord Message Object
   */
  submit(threadTitle, messageObject) {
    this.thread.postToChannel(this.discord.channelID, messageObject)
      .then(messageID => {
        this.thread.createThreadOnMessage(
          this.discord.channelID,
          messageID,
          threadTitle,
          this.discord.autoArchiveDuration )
      })
  }
}

/**
 * @typedef {Object} rssConfiguration
 * @property {string} feedLocation URL of the RSS Feed
 * @property {string} fetchSchedule Cron expression of fetch interval
 * @property {Object} [configuration] Passthrough configuration for RSS-Parser
 * @property {Object} [latest] Last item to have been previously proccessed
 */

/**
 * @typedef {Object} discordConfiguration
 * @property {string} authorization Authorization Token for the Discord API
 * @property {string} channelID Snowflake for the channel in which to post messages
 * @property {number} [autoArchiveDuration] Duration in minutes to automatically archive the thread after recent activity
 * @property {number} [apiVersion] Version of the Discord API to use
 */

/**
 * Create a FeedThreads Instance
 * @param {rssConfiguration} rss 
 * @param {discordConfiguration} discord 
 * @returns {Promise<FeedThreadsHandler>} new FeedThreads instance
 */
async function FeedThreads(rss, discord) {
  // Required parameters
  if (!rss.feedLocation) throw new ParameterError("Missing Requred Parameter: rss.feedLocation");
  if (!discord.authorization) throw new ParameterError("Missing Required Parameter: discord.authorization");
  if (!discord.channelID) throw new ParameterError("Missing Required Parameter: discord.channelID");

  // Optional parameters
  rss.fetchSchedule = rss.fetchSchedule || "*/15 * * * *";
  rss.configuration = rss.configuration || {};
  rss.latest = rss.latest || {};
  discord.apiVersion = discord.apiVersion || 9;
  discord.autoArchiveDuration = discord.activeDuration || 60; // minutes

  // Type checking
  if (typeof rss.feedLocation != "string") throw new ParameterError(`Incorrect Parameter Type for 'rss.feedLocation': Expected 'string', got '${typeof rss.feedLocation}' instead.`);
  if (typeof discord.authorization != "string")  throw new ParameterError(`Incorrect Parameter Type for 'discord.authorization': Expected 'string', got '${typeof discord.authorization}' instead.`);
  if (typeof discord.channelID != "string")  throw new ParameterError(`Incorrect Parameter Type for 'discord.channelID': Expected 'string', got '${typeof discord.channelID}' instead.`);

  return new FeedThreadsHandler(rss, discord);
}

module.exports = { FeedThreads };