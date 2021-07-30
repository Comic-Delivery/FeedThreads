const EventEmitter = require('events');
const Feeder = require('./feeder');
const Threader = require('./threader');

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
        this.thread = new Threader(API, this.discord.authorization);
        
        this.rss = {
            uri: CheckParameter(rssConfig.uri, "Missing RSS URI"),
            interval: CheckParameter(rssConfig.interval, "Missing RSS Interval"),
            latest: rssConfig.latest || null
        }        
    }

    start() {
        this.feed = new Feeder(this.rss.uri, this.rss.interval, this.rss.latest);
        this.feed.on("new", (item) => {
            this.emit("newItem", item, this.submit.bind(this));
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