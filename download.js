
const startDate = new Date(Date.UTC(2021, 0, 1));

const dataStore = {
    tags: {},
    exams: {},
    organisations: {},
    events: {}
};

let urls = [];
const MONTH_LIST = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

function findDayOfYear(now) {
    if (!now.getUTCFullYear) debugger;
    const start = new Date(Date.UTC(now.getUTCFullYear(), 0, 0));
    const diff = now - start;
    const oneDay = 1000 * 60 * 60 * 24;
    return Math.floor(diff / oneDay);
}

let request = (interval_name, date, baseURL, urls) => {

    const year = date.getUTCFullYear();
    const month = date.getUTCMonth();
    const dayOfYear = findDayOfYear(date);
    const hours = date.getUTCHours();
    const jsonPath = baseURL;

    if (interval_name == 'year') {
        const filename = `/y/${year}.json`;
        urls.push(jsonPath + filename);
    }
    else if (interval_name == 'month') {
        const filename = `/m/${year}-${month + 1}.json`;
        const name = MONTH_LIST[month];
        urls.push(jsonPath + filename);
    }
    else if (interval_name == 'day') {
        const filename = `/d/${year}-${dayOfYear}.json`;
        urls.push(jsonPath + filename);

    }
    else if (interval_name == 'hour') {
        const filename = `/h/${year}-${dayOfYear}-${hours + 1}.json`;
        // urls.push(jsonPath + filename);
    }
    else {
        console.log('Unknown case', interval_name, 'found');
    }
};
function daysInMonth(month, year) {
    return new Date(year, month, 0).getUTCDate();
}

function forward(dateItr, currentDate, baseURL, urls) {

    while (dateItr.getUTCFullYear() < currentDate.getUTCFullYear() && dateItr < currentDate) {
        request('year', dateItr, baseURL, urls);
        dateItr.setUTCFullYear(dateItr.getUTCFullYear() + 1);
    }
    while (dateItr.getUTCMonth() < currentDate.getUTCMonth() && dateItr < currentDate) {
        request('month', dateItr, baseURL, urls);
        dateItr.setUTCMonth(dateItr.getUTCMonth() + 1);
    }
    while (dateItr.getUTCDate() < currentDate.getUTCDate() && dateItr < currentDate) {
        request('day', dateItr, baseURL, urls);
        dateItr.setUTCDate(dateItr.getUTCDate() + 1);
    }
    while (dateItr.getUTCHours() < currentDate.getUTCHours() && dateItr < currentDate) {
        request('hour', dateItr, baseURL, urls);
        dateItr.setUTCHours(dateItr.getUTCHours() + 1);
    }
}

function mergeEvents(data) {
    mergeTags({ events: data })
}
function mergeTags(data) {
    // for Tags
    if (data.tags)
        Object.keys(data.tags).forEach(key => {
            const oldValues = dataStore[key] ? dataStore[key].values : {};
            const tagObject = {
                id: data.tags[key].id,
                type: data.tags[key].type,
                lang: data.tags[key].lang,
                values: { ...oldValues, ...data.tags[key].values },
            }
            dataStore.tags[key] = tagObject;
        })

    // for Organisations
    if (data.organisations)
        dataStore.organisations = { ...dataStore.organisations, ...data.organisations };

    // for exams
    if (data.exams)
        dataStore.exams = { ...dataStore.exams, ...data.exams };

    // for exams
    if (data.events)
        dataStore.events = { ...dataStore.events, ...data.events };
}

class Downloader {

    constructor(urls, poolSize, mergeHandler, completionHandler) {
        this.urls = urls;
        this.poolSize = poolSize
        this.downloaded = new Array(urls.length);
        this.downloadPool = new DownloadPool(this);
        this.sentFileIndex = 0;
        this.mergeHandler = mergeHandler;
        this.requestsCompleted = 0;
        this.completionHandler = completionHandler;
        this.isReady = false;
    }
    start() {
        for (let i = 0; i < this.poolSize; ++i) {
            this.downloadPool.enqueue(this.urls[this.sentFileIndex], this.sentFileIndex++);
        }
    }
    applyMerging(url, index, file) {
        this.downloaded[index] = file;
        let undefinedFound = false;

        // Find if any previous index file isn't downloaded yet
        for (let i = 0; i < index; ++i) {
            if (this.downloaded[i] === undefined) {
                undefinedFound = true;
                break;
            }
        }
        // Merge this file
        if (!undefinedFound) {
            console.log(`Merging - ${index}`);
            this.mergeHandler(file)
        }

        // Merge next files
        if (this.downloaded[index + 1] !== undefined) {
            let cnt = index + 1;

            while (this.downloaded[cnt] !== undefined) {
                console.log(`Merging - ${cnt}`);
                this.mergeHandler(this.downloaded[cnt])
                cnt++
            }
        }
        if (this.sentFileIndex < this.urls.length) {
            this.downloadPool.enqueue(this.urls[this.sentFileIndex], this.sentFileIndex++);
        }
    }
    checkCompleted() {
        // console.log( this.requestsCompleted, this.urls.length );
        if (this.requestsCompleted == this.urls.length) {
            this.setReadyState();
            this.downloadPool.clearTimeouts();
            this.completionHandler();
        }
    }
    setReadyState() {
        let i = 0;
        for (; i < this.urls.length; ++i) {
            if (this.downloaded[i] === undefined) break;
        }

        // index of first failed file
        let index = i;
        if (index == this.urls.length) {
            this.isReady = true;
            return;
        }
        let url = this.urls[index];

        // // if the failed file is an hour file
        // if (url.includes("/h/")) {
        //     this.isReady = true;
        //     return;
        // }

        // if the failed file is a day file
        if (url.includes("/d/")) {
            let failedDayNumber = parseInt(url.split("-")[1].split(".")[0]);
            let todayDayNumber = findDayOfYear(new Date());
            console.log({ failedDayNumber, todayDayNumber });

            // if the failed day is less than the currrent day, worker is not ready
            // Else worker is ready
            this.isReady = !(failedDayNumber < todayDayNumber);
            return;
        }

        // Else - Worker is not ready
        this.isReady = false;
    }
}

class DownloadPool {
    constructor(downloader) {
        this.queue = [];
        this.downloader = downloader;
        this.counts = this.downloader.urls.map(item => 0);
        this.timeouts = [];
    }
    clearTimeouts() {
        this.timeouts.forEach(timeout => {
            clearTimeout(timeout);
        })
    }
    enqueue(url, index) {
        this.queue.push(url);
        let fileDownloaded = false;
        const controller = new AbortController();

        fetch(url, { signal: controller.signal })
            .then((data) => {
                data.json().then(res => {
                    console.log(`Downloaded File ${this.downloader.urls.indexOf(url)}`);
                    fileDownloaded = true;
                    this.queue.splice(this.queue.indexOf(url), 1);
                    this.downloader.applyMerging(url, index, res);
                    this.downloader.requestsCompleted += 1;
                    console.log("Requests Completed", { Result: "Successfully Merged" }, this.downloader.requestsCompleted, { url, index });
                    this.downloader.checkCompleted();

                }).catch((jsonErr) => {
                    fileDownloaded = false;
                    console.log(jsonErr);
                })

            }).catch((err) => {
                fileDownloaded = false;
                console.log("Failed ", { err });
            })

        const timeout = setTimeout(() => {
            let counter = this.counts[index];
            this.counts[index] += 1;

            if (!fileDownloaded && counter < 2) {
                controller.abort();
                this.enqueue(url, index)
                console.log("Re-trying", { url, index });

            } else if (!fileDownloaded && counter >= 2) {
                controller.abort();
                this.downloader.requestsCompleted += 1;
                console.log("Requests Completed", { Result: "Failure" }, this.downloader.requestsCompleted, { url, index });
                this.downloader.checkCompleted();
            }
        }, 2000);

        this.timeouts.push(timeout);
    }
}

function initialSync() {

    return new Promise((resolve, reject) => {

        const currentDate = new Date(Date.now())
        currentDate.setDate(currentDate.getDate() - 5);
        let dateItr = new Date(startDate.getTime());

        const eventUrls = [];
        const tagUrls = [];
        const eventsBaseURL = "https://dyncdn.exampathfinder.com/tempjsons/event";
        const tagsBaseURL = "https://dyncdn.exampathfinder.com/tempjsons/tag";

        // forward(dateItr, currentDate, eventsBaseURL, eventUrls); 
        dateItr = new Date(startDate.getTime());
        forward(dateItr, currentDate, tagsBaseURL, tagUrls);

        let downloadsCompleted = 0;
        let totalDownloads = 1;
        console.log({ tagUrls, eventUrls });

        // const events_downloader = new Downloader(eventUrls, 5, mergeEvents, () => { resolver() });
        // events_downloader.start()
        const tags_downloader = new Downloader(tagUrls, 5, mergeTags, () => { resolver() });
        tags_downloader.start()

        // let resolver = () => {
        //     downloadsCompleted += 1;
        //     if (downloadsCompleted == 2) {
        //         if (!events_downloader.isReady || !tags_downloader.isReady) reject();
        //         else resolve();
        //     }
        // }

        let resolver = () => {
            downloadsCompleted += 1;
            if (downloadsCompleted == totalDownloads) {
                if (!tags_downloader.isReady) reject();
                else resolve();
            }
        }
    })
}

// =========================================
//               Driver Code
// =========================================
initialSync().then(() => {
    console.log("Worker is Ready", dataStore);
}).catch(err => {
    console.log("Worker is Not Ready, Use API instead");
})
