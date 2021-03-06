/* eslint-disable max-classes-per-file */

const ARE_LOGS_ON = false;

const startDate = new Date(Date.UTC(2021, 0, 1));

const dataStore = {
    tags: {},
    exams: {},
    organisations: {},
    events: {},
};

function findDayOfYear(now) {
    const start = new Date(Date.UTC(now.getUTCFullYear(), 0, 0));
    const diff = now - start;
    const oneDay = 1000 * 60 * 60 * 24;
    return Math.floor(diff / oneDay);
}

const generateFilePath = (intervalName, date, baseURL) => {
    const year = date.getUTCFullYear();
    const month = date.getUTCMonth();
    const dayOfYear = findDayOfYear(date);
    const hours = date.getUTCHours();

    if (intervalName === "year") return baseURL + `/y/${year}.json`;
    else if (intervalName === "month") return baseURL + `/m/${year}-${month + 1}.json`;
    else if (intervalName === "day") return baseURL + `/d/${year}-${dayOfYear}.json`;
    else if (intervalName === "hour") return baseURL + `/h/${year}-${dayOfYear}-${hours}.json`;
    else {
        throw new Error(`Unknown interval ${intervalName} found`);
    }
};

function daysInMonth(month, year) {
    const d = new Date(year, month);
    d.setUTCFullYear(year);
    d.setUTCMonth(month);
    d.setUTCDate(0);
    return d.getUTCDate();
}

/**
 * Genrates URLs for files starting from datItr upto currentDate in forward fashion
 *
 * @param {Date} dateItr The date to start from
 * @param {Date} currentDate The ending date
 * @param {String} baseURL The URL to be prepended in every URL
 * @param {String[]} urls Array of URLs (All generated urls are pushed to this array)
 */
function generateInitialURLs(dateItr, currentDate, baseURL, urls, type) {
    while (dateItr.getUTCFullYear() < currentDate.getUTCFullYear() && dateItr < currentDate) {
        urls.push(generateFilePath("year", dateItr, baseURL));
        dateItr.setUTCFullYear(dateItr.getUTCFullYear() + 1);
    }
    while (dateItr.getUTCMonth() < currentDate.getUTCMonth() && dateItr < currentDate) {
        urls.push(generateFilePath("month", dateItr, baseURL));
        dateItr.setUTCMonth(dateItr.getUTCMonth() + 1);
    }
    while (dateItr.getUTCDate() < currentDate.getUTCDate() && dateItr < currentDate) {
        urls.push(generateFilePath("day", dateItr, baseURL));
        dateItr.setUTCDate(dateItr.getUTCDate() + 1);
    }
    if (type == "tags") return;
    while (dateItr.getUTCHours() < currentDate.getUTCHours() && dateItr < currentDate) {
        urls.push(generateFilePath("hour", dateItr, baseURL));
        dateItr.setUTCHours(dateItr.getUTCHours() + 1);
    }
}

function mergeTags(data) {
    // for Tags
    if (data.tags) {
        Object.keys(data.tags).forEach((key) => {
            const oldValues = dataStore[key] ? dataStore[key].values : {};
            const tagObject = {
                id: data.tags[key].id,
                type: data.tags[key].type,
                lang: data.tags[key].lang,
                values: { ...oldValues, ...data.tags[key].values },
            };
            dataStore.tags[key] = tagObject;
        });
    }

    // for Organisations
    if (data.organisations) { dataStore.organisations = { ...dataStore.organisations, ...data.organisations }; }

    // for exams
    if (data.exams) { dataStore.exams = { ...dataStore.exams, ...data.exams }; }

    // for exams
    if (data.events) { dataStore.events = { ...dataStore.events, ...data.events }; }
}

function mergeEvents(data) {
    mergeTags({ events: data });
}

class DownloadPool {
    constructor(downloader) {
        this.queue = [];
        this.downloader = downloader;
        this.counts = [];
        this.timeouts = [];
    }

    clearTimeouts() {
        this.timeouts.forEach((timeout) => {
            clearTimeout(timeout);
        });
        this.queue = [];
        this.counts = [];
        this.timeouts = [];
    }

    enqueue(url, index) {
        this.queue.push(url);
        let fileDownloaded = false;
        const controller = new AbortController();

        fetch(url, { signal: controller.signal })
            .then((data) => {
                data.json().then((res) => {
                    if (ARE_LOGS_ON) console.log(`Downloaded File`, { index: this.downloader.urls.indexOf(url), url });
                    fileDownloaded = true;
                    this.queue.splice(this.queue.indexOf(url), 1);
                    this.downloader.applyMerging(url, index, res);
                    this.downloader.requestsCompleted.success += 1;
                    if (ARE_LOGS_ON) console.log("Requests Completed", { Result: "Successfully Merged" }, this.downloader.requestsCompleted, { url, index });
                    this.downloader.checkCompleted();
                }).catch((jsonErr) => {
                    fileDownloaded = false;
                    // if (ARE_LOGS_ON) console.log(jsonErr);
                });
            }).catch((err) => {
                fileDownloaded = false;
                if (ARE_LOGS_ON) console.log("Failed ", { err });
            });

        const timeout = setTimeout(() => {
            if (this.counts[index] === undefined) this.counts[index] = 0;
            const counter = this.counts[index];
            this.counts[index] += 1;

            if (!fileDownloaded && counter < 2) {
                controller.abort();
                this.enqueue(url, index);
                if (ARE_LOGS_ON) console.log("Re-trying", { url, index });
            } else if (!fileDownloaded && counter >= 2) {
                controller.abort();
                this.downloader.requestsCompleted.fails += 1;
                if (ARE_LOGS_ON) console.log("Requests Completed", { Result: "Failure" }, this.downloader.requestsCompleted, { url, index });
                this.downloader.checkCompleted();
            }
        }, 2000);

        this.timeouts.push(timeout);
    }
}

class Downloader {
    constructor(poolSize, mergeHandler, type) {
        this.type = type;
        this.urls = [];
        this.poolSize = poolSize;
        this.downloaded = new Array(this.urls.length);
        this.sentFileIndex = 0;
        this.mergeHandler = mergeHandler;
        this.requestsCompleted = { fails: 0, success: 0 };
        this.isReady = false;
    }

    start(completionHandler) {
        this.completionHandler = completionHandler;
        this.downloadPool = new DownloadPool(this);
        for (let i = 0; i < Math.min(this.poolSize, this.urls.length); i += 1) {
            this.downloadPool.enqueue(this.urls[this.sentFileIndex], this.sentFileIndex);
            this.sentFileIndex += 1;
        }
    }

    clearFinishedDownloads() {
        let i = 0;
        for (; i < this.urls.length; i += 1) {
            if (this.downloaded[i] === undefined) break;
        }

        // index of first failed file
        const index = i;
        this.urls.splice(0, index);
        this.downloaded.splice(0, index);

        this.sentFileIndex = 0;
        this.requestsCompleted.fails = 0;
        this.requestsCompleted.success -= index;
        this.isReady = false;
        this.downloadPool.clearTimeouts();
    }

    addFiles(urls) {
        this.urls = [...this.urls, ...urls];
    }

    resume(completionHandler) {
        this.start(completionHandler);
    }

    applyMerging(url, index, file) {
        this.downloaded[index] = file;
        let undefinedFound = false;

        // Find if any previous index file isn't downloaded yet
        for (let i = 0; i < index; i += 1) {
            if (this.downloaded[i] === undefined) {
                undefinedFound = true;
                break;
            }
        }
        // Merge this file
        if (!undefinedFound) {
            if (ARE_LOGS_ON) console.log(`Merging`, { index, url: this.urls[index] });
            this.mergeHandler(file);
        }

        // Merge next files
        if (this.downloaded[index + 1] !== undefined) {
            let cnt = index + 1;

            while (this.downloaded[cnt] !== undefined) {
                if (ARE_LOGS_ON) console.log(`Merging`, { index: cnt, url: this.urls[cnt] });
                this.mergeHandler(this.downloaded[cnt]);
                cnt += 1;
            }
        }
    }

    checkCompleted() {
        if (this.sentFileIndex < this.urls.length) {
            this.downloadPool.enqueue(this.urls[this.sentFileIndex], this.sentFileIndex);
            this.sentFileIndex += 1;
        }
        if (this.requestsCompleted.fails + this.requestsCompleted.success === this.urls.length) {
            this.setReadyState();
            this.downloadPool.clearTimeouts();
            this.completionHandler();
        }
    }

    setReadyState() {
        let i = 0;
        for (; i < this.urls.length; i += 1) {
            if (this.downloaded[i] === undefined) break;
        }

        // index of first failed file
        const index = i;
        if (index === this.urls.length) {
            this.isReady = true;
            return;
        }
        const url = this.urls[index];

        if (this.type === "events") {
            // ================================= Hour Block =================================

            // if the failed file is an hour file
            if (url.includes("/h/")) {
                const failedDayNumber = parseInt(url.split("-")[1].split(".")[0], 10);
                const todayDayNumber = findDayOfYear(new Date());
                this.isReady = (failedDayNumber === todayDayNumber);
                return;
            }

            // ==============================================================================
        } else if (this.type === "tags") {
            // ================================= Day Block ==================================

            // if the failed file is a day file
            if (url.includes("/d/")) {
                const failedDayNumber = parseInt(url.split("-")[1].split(".")[0], 10);
                const todayDayNumber = findDayOfYear(new Date());
                if (ARE_LOGS_ON) console.log({ failedDayNumber, todayDayNumber });

                // if the failed day is less than the currrent day, worker is not ready
                // Else worker is ready
                this.isReady = !(failedDayNumber < todayDayNumber);
                return;
            }

            // ==============================================================================
        }

        // Else - Worker is not ready
        this.isReady = false;
    }
}

const eventsBaseURL = "https://dyncdn.exampathfinder.com/alertjsons/events";
const tagsBaseURL = "https://dyncdn.exampathfinder.com/alertjsons/tags";

const eventsDownloader = new Downloader(5, mergeEvents, "events");
const tagsDownloader = new Downloader(5, mergeTags, "tags");

/**
 * Downloads and merges the JSON files into dataStore, Runs initially on the first load or after refresh.
 *
 * @returns {Promise} a promise which tells whether the worker can be used to fetch data or not
 * Which means whether sufficient JSON's were downloaded or not
 */
function initialSync() {
    return new Promise((resolve, reject) => {
        const currentDate = new Date(Date.now());
        currentDate.setDate(currentDate.getDate());
        let dateItr = new Date(startDate.getTime());

        const eventUrls = [];
        const tagUrls = [];

        generateInitialURLs(dateItr, currentDate, eventsBaseURL, eventUrls, "events");
        dateItr = new Date(startDate.getTime());
        generateInitialURLs(dateItr, currentDate, tagsBaseURL, tagUrls, "tags");

        if (ARE_LOGS_ON) console.log(eventUrls, tagUrls);

        let downloadsCompleted = 0;
        const totalDownloads = 2;

        if (ARE_LOGS_ON) console.log({ tagUrls, eventUrls });

        const resolver = () => {
            downloadsCompleted += 1;
            if (downloadsCompleted === totalDownloads) {
                if (!eventsDownloader.isReady || !tagsDownloader.isReady) reject();
                else resolve(dataStore);
            }
        };

        tagsDownloader.addFiles(tagUrls);
        tagsDownloader.start(() => { resolver(); });

        eventsDownloader.addFiles(eventUrls);
        eventsDownloader.start(() => { resolver(); });
    });
}

/**
 * Genrates URLs for files starting from datItr upto currentDate first
 * using backward fashion then continues with forward fashion
 *
 * @param {Date} lastFetch The date to start from
 * @param {Date} currentDate The ending date
 * @param {String} baseURL The URL to be prepended in every URL
 * @param {String[]} urls Array of URLs (All generated urls are pushed to this array)
 */
function generateSyncURLs(lastFetch, currentDate, baseURL, urls) {
    const dateItr = lastFetch; // last date when fetched

    // Fetch Upto this year
    while (dateItr.getUTCHours() <= 23 && dateItr < currentDate) {
        urls.push(generateFilePath("hour", dateItr, baseURL));
        const hours = dateItr.getUTCHours() + 1;
        dateItr.setUTCHours(dateItr.getUTCHours() + 1);
        if (dateItr.getUTCHours() !== hours) break;
    }

    while (dateItr.getUTCDate() <= daysInMonth(dateItr.getUTCMonth() + 1, dateItr.getUTCFullYear()) && dateItr < currentDate) {
        urls.push(generateFilePath("day", dateItr, baseURL));
        const days = dateItr.getUTCDate() + 1;
        dateItr.setUTCDate(dateItr.getUTCDate() + 1);
        if (dateItr.getUTCDate() !== days) break;
    }

    while (dateItr.getUTCMonth() <= 11 && dateItr < currentDate) {
        urls.push(generateFilePath("month", dateItr, baseURL));
        const months = dateItr.getUTCMonth() + 1;
        dateItr.setUTCMonth(dateItr.getUTCMonth() + 1);
        if (dateItr.getUTCMonth() !== months) break;
    }

    generateInitialURLs(dateItr, currentDate, baseURL, urls);
}

/**
 * Downloads and merges the JSON files into dataStore, Runs after every hour or the next time the app is accessed.
 *
 * @param {Date} lastFetch The date when the last sync or initialSync Ran
 * @returns {Promise} a promise which tells whether the worker can be used to fetch data or not
 * Which means whether sufficient JSON's were downloaded or not
 */
function sync(lastFetch) {
    return new Promise((resolve, reject) => {
        // Find the current Date
        const currentDate = new Date(Date.now());
        currentDate.setDate(currentDate.getDate());

        // Create Arrays to hold the urls to be downloaded
        const eventUrls = [];
        const tagUrls = [];

        // Fill the URLs arrays
        let dateItr = new Date(lastFetch.getTime());
        generateSyncURLs(dateItr, currentDate, eventsBaseURL, eventUrls);

        dateItr = new Date(lastFetch.getTime());
        generateSyncURLs(dateItr, currentDate, tagsBaseURL, tagUrls);

        if (ARE_LOGS_ON) console.log({ tagUrls, eventUrls });

        // Variables for promise resolver
        let downloadsCompleted = 0;
        const totalDownloads = 2;

        // Promise resolver
        const resolver = () => {
            downloadsCompleted += 1;
            if (downloadsCompleted === totalDownloads) {
                if (!eventsDownloader.isReady || !tagsDownloader.isReady) reject();
                else resolve(dataStore);
            }
        };

        // Resume the downloaders
        eventsDownloader.clearFinishedDownloads();
        eventsDownloader.addFiles(eventUrls);
        eventsDownloader.resume(() => { resolver(); });

        tagsDownloader.clearFinishedDownloads();
        tagsDownloader.addFiles(tagUrls);
        tagsDownloader.resume(() => { resolver(); });
    });
}

// export { initialSync, sync };

initialSync().then(() => {
    console.log("Worker is Ready", dataStore);
}).catch(err => {
    console.log("Worker is Not Ready, Use API instead");
});
