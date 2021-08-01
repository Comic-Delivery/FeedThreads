class ThreadHandler {
    constructor(apiBase, authorization) {
        try {
            this.axios = (require('axios')).default.create({
                baseURL: apiBase,
                headers : {
                    common: {
                        'Authorization': authorization,
                        'User-Agent': 'FeedThreads (https://github.com/JulianWebb/feedthread, 0.1.0)'
                    }
                }
            });
        } catch (exception) {
            console.error("Could not create axios instance, did you install the dependencies?", exception);
            process.exit(1);
        }
    }

    postToChannel(channel, message) {
        return new Promise((resolve, reject) => {
            this.axios.post(`/channels/${channel}/messages`, message)
                .then(response => {
                console.log(response.status, `Sucessfully posted to channel (${channel})`)
                resolve(response.data.id)
            })  .catch(reason => {
                console.error(reason.response.status, `Failed to post to channel (${channel})`)
                console.error(JSON.stringify(reason.response.data))
                reject(reason);
            })
        })
    }

    createThreadOnMessage(channel, message, title, duration) {
        this.axios.post(`/channels/${channel}/messages/${message}/threads`, {
            name: title,
            duration: duration
        }).then(response => console.log(response.status, `Successfully created thread (${response.data.id})`))
        .catch(reason => {
            console.error(reason.response.status, `Failed to create thread`)
            console.error(JSON.stringify(reason.response.data));
        })
    }

    crosspostMessage(channel, message) {
        this.axios.post(`/channels/${channel}/messages/${message}/crosspost`)
            .then(response => console.log(response.status, `Successfully crossposted message (${response.data.id})`))
            .catch(reason => {
                console.error(reason.response.status, `Failed to crosspost`)
                console.error(JSON.stringify(reason.response.data));
            })
    }
}

module.exports = { ThreadHandler };