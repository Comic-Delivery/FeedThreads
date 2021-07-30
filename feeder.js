const { EventEmitter } = require('events');

class Feeder extends EventEmitter {
    constructor(uri, interval, latest) {
        super();
        this.initialize(uri, interval, latest);
            
    }

    async initialize(uri, interval, latest = {}) {
        console.log('Initializing Feed');
        try {
            this.parser = new (require('rss-parser'))();
        } catch (exception) {
            console.error("Feeder: Could not create rss-parser instance, did you install the dependencies?", exception);
            process.exit(1);
        }

        try {
            await this.parser.parseURL(uri);
        } catch (exception) {
            console.error(`Feeder: Could not access feed at passed URI (${uri})`, exception);
            process.exit(1);
        }
        this.uri = uri;

        try {
            this.cron = new (require('cron-converter'))();
        } catch (exception) {
            console.error("Feeder: Could not create cron-converter instance, did you install the dependencies?", exception);
            process.exit(1);
        }

        try {
            this.interval = this.cron.fromString(interval);
        } catch (exception) {
            console.error(`Feeder: Invalid Cron string (${this.interval})`);
            process.exit(1);
        }

        this.schedule = this.interval.schedule();
        this.latest = latest;
        this.loop();
    }

    loop() {
        this.checkFeed();
        let now = new Date();
        let next;
        do {
            next = this.interval.schedule().next();
        } while(next.valueOf() < now.getTime());
        setTimeout(this.loop.bind(this), next.diff(now));
    }

    checkFeed() {
        console.log('Checking Feed')
        this.parser.parseURL(this.uri)
            .then(feed => {
                // assuming the feed is ordered newest to oldest
                let newItems = [];
                for (let item of feed.items) {
                    if (item.title == this.latest?.title) break;
                    newItems.push(item);
                }

                this.latest = feed.items[0];
                newItems.reverse().forEach(item => {
                    console.log(`New Feed Item: ${item.title}`)
                    this.emit("new", item)
                });

            })
            .catch(console.error);
    }
}

module.exports = Feeder;