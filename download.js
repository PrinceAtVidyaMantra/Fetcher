
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

function initialSync() {

    return new Promise((resolve, reject) => {

        const currentDate = new Date(Date.now())
        currentDate.setDate(currentDate.getDate() - 5);
        let dateItr = new Date(startDate.getTime());

        const eventsUrl = [];
        const tagsUrl = [];
        const eventsBaseURL = "https://dyncdn.exampathfinder.com/tempjsons/event";
        const tagsBaseURL = "https://dyncdn.exampathfinder.com/tempjsons/tag";

        forward(dateItr, currentDate, tagsBaseURL, tagsUrl);
        dateItr = new Date(startDate.getTime());
        forward(dateItr, currentDate, eventsBaseURL, eventsUrl);

        // console.log(eventsUrl);
        // console.log(tagsUrl);

        // debugger;

        let successCount = 0;

        const events_downloader = new Downloader(eventsUrl, 5, merge, () => { func() });
        events_downloader.start()
        const tags_downloader = new Downloader(tagsUrl, 5, mergeTags, () => { func() });
        tags_downloader.start()

        let func = () => {
            successCount += 1;
            if (successCount == 2) {
                finalize(resolve, reject, events_downloader, tags_downloader);
            }
        }
    })
}


class Downloader {

    constructor(urls, poolSize, merge, completionHandleer) {
        this.urls = urls;
        this.poolSize = poolSize
        this.downloaded = new Array(urls.length);
        this.downloadedPool = new DownloadPool(this);
        this.noOfDownloadedFiles = 0;
        this.sentFileIndex = 0;
        this.merge = merge;
        this.requestCompletedCount = 0;
        this.completionHandleer = completionHandleer;
        this.isReady = false;
    }
    start() {
        for (let i = 0; i < this.poolSize; ++i) {
            this.downloadedPool.enqueue(this.urls[this.sentFileIndex], this.sentFileIndex++);
        }
    }
    recievedDownloadedEvent(url, index, file) {
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
            this.merge(file)
        }

        // Merge next files
        if (this.downloaded[index + 1] !== undefined) {
            let cnt = index + 1;
            while (this.downloaded[cnt] !== undefined) {

                console.log(`Merging - ${cnt}`);
                this.merge(this.downloaded[cnt])
                cnt++
            }
        }
        this.noOfDownloadedFiles += 1;
        this.requestCompletedCount += 1;
        if (this.sentFileIndex < this.urls.length) {
            this.downloadedPool.enqueue(this.urls[this.sentFileIndex], this.sentFileIndex++);
        }

        if (this.requestCompletedCount == this.urls.length) {
            this.setReadyState();
            this.completionHandleer();
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
        debugger;
        let url = this.urls[index];

        if (url.includes("/d/")) {
            let dayNumber = parseInt(url.split("-")[1].split(".")[0]);
            let todayDayNumber = findDayOfYear(new Date(Date.UTC()));
            console.log({ dayNumber, todayDayNumber });
            debugger;
            if (dayNumber < todayDayNumber - 1) {
                this.isReady = false;
            }
            else {
                this.isReady = true;
            }
            return;

        } else {
            this.isReady = false;
            return;
        }

    }
}

class DownloadPool {
    constructor(downloader) {
        this.queue = [];
        this.downloader = downloader;
        this.counts = this.downloader.urls.map(item => { return { count: 0 } })
    }
    enqueue(url, index) {
        this.queue.push(url);
        let fileDownloaded = false;
        const controller = new AbortController();
        fetch(url, { signal: controller.signal })
            .then((data) => data.json())
            .then((res) => {
                console.log(`Downloaded File ${this.downloader.urls.indexOf(url)}`);
                fileDownloaded = true;
                this.queue.splice(this.queue.indexOf(url), 1);
                this.downloader.recievedDownloadedEvent(url, index, res);
            }).catch((err) => {
                fileDownloaded = false;
                console.log("Failed");
                console.log(err);
            })

        setTimeout(() => {
            let counter = this.counts[index].count;
            if (!fileDownloaded && counter < 3) {
                console.log(url);
                controller.abort();
                this.enqueue(url, index)
                this.counts[index] = { count: counter + 1 };
                console.log("Retyr");
            } else if (!fileDownloaded && counter >= 3) {
                this.downloader.requestCompletedCount += 1;
                console.log("Increamented to", this.downloader.requestCompletedCount);
            }
        }, 10000)
    }
}

function finalize(resolve, reject, events_downloader, tags_downloader) {
    if (!events_downloader.isReady || !tags_downloader.isReady) reject();
    else resolve();
}

function merge(data) {
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

const x = initialSync().then(() => {
    console.log("done");
}).catch(err => {
    console.log("Err");
})
