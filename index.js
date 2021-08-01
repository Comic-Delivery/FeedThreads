const EventEmitter = require('events');
const { ThreadHandler } = require('./threadHandler');
const { FeedEvents } = require('feed-events');

class ParameterError extends Error {
    constructor(...params) {
        super(...params);
    }
}

function CheckParameter(parameter, errorMessage) {
    if (!parameter) throw new ParameterError(errorMessage);
    return parameter;
}

class FeedThreads extends EventEmitter {
    constructor(rssConfig = {}, discordConfig = {}) {
        super();
        this.discord = {
            version: discordConfig.version || 9,
            authorization: CheckParameter(discordConfig.authorization || "Missing Discord Authorization"),
            channel: CheckParameter(discordConfig.channel),
            duration: discordConfig.duration || 60
        }
        let API = `https://discord.com/api/v` + this.discord.version;
        this.thread = new ThreadHandler(API, this.discord.authorization);
        
        this.rss = {
            URL: CheckParameter(rssConfig.URL, "Missing RSS URI"),
            configuration: rssConfig.configuration || {},
            latest: rssConfig.latest || null
        }        
    }

    start() {
        FeedEvents(this.rss.URL, this.rss.configuration, this.rss.latest)
            .then(feed => {
                feed.on("item", item => {
                    this.emit("item", item, this.submit.bind(this));
                });

                feed.start();
            })
    }

    submit(title, message) {
        this.thread.postToChannel(this.discord.channel, message)
            .then(messageID => {
                this.thread.createThreadOnMessage(this.discord.channel, messageID, title, this.discord.duration )
            })
    }
}

module.exports = FeedThreads;