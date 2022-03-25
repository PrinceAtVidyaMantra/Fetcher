const startDate = new Date(Date.UTC(2021, 0, 1));
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

let request = (interval_name, date) => {
    
    const year = date.getUTCFullYear();
    const month = date.getUTCMonth();
    const dayOfYear = findDayOfYear(date);
    const hours = date.getUTCHours();
    const jsonPath = "https://dyncdn.exampathfinder.com/tempjsons/event"
    if (interval_name == 'year') {
        const filename = `/y/${year}.json`;
        // console.log(`Time: Year ${year}, File: ${filename}`);
        urls.push(jsonPath + filename);
    }
    else if (interval_name == 'month') {
        const filename = `/m/${year}-${month + 1}.json`;
        const name = MONTH_LIST[month];
        // console.log(`Time: ${name} ${year}, File: ${filename}`);
        urls.push(jsonPath + filename);
    }
    else if (interval_name == 'day') {
        const filename = `/d/${year}-${dayOfYear}.json`;
        // console.log(`Time: Day ${dayOfYear} of ${year}, File: ${filename}`);
        urls.push(jsonPath + filename);

    }
    else if (interval_name == 'hour') {
        const filename = `/h/${year}-${dayOfYear}-${hours + 1}.json`;
        // console.log(`Time: Hour ${hours + 1} of day ${dayOfYear}, ${year}, File: ${filename}`);
        // urls.push(jsonPath + filename);
    }
    else {
        console.log('Unknown case', interval_name, 'found');

    }
};
function daysInMonth(month, year) {
    return new Date(year, month, 0).getUTCDate();
}

function forward(dateItr, currentDate) {
    while (dateItr.getUTCFullYear() < currentDate.getUTCFullYear() && dateItr < currentDate) {
        request('year', dateItr);
        dateItr.setUTCFullYear(dateItr.getUTCFullYear() + 1);
    }
    while (dateItr.getUTCMonth() < currentDate.getUTCMonth() && dateItr < currentDate) {
        request('month', dateItr);
        dateItr.setUTCMonth(dateItr.getUTCMonth() + 1);
    }
    while (dateItr.getUTCDate() < currentDate.getUTCDate() && dateItr < currentDate) {
        request('day', dateItr);
        dateItr.setUTCDate(dateItr.getUTCDate() + 1);
    }
    while (dateItr.getUTCHours() < currentDate.getUTCHours() && dateItr < currentDate) {
        request('hour', dateItr);
        dateItr.setUTCHours(dateItr.getUTCHours() + 1);
    }
}

function initialSync() {
    urls = [];
    const currentDate = new Date(Date.now())
    currentDate.setDate(currentDate.getDate() - 4);
    let dateItr = startDate;
    forward(dateItr, currentDate);
    let my_downloader = new Downloader(urls, 5);
    console.log(urls);
    my_downloader.start()
}


class Downloader {

    constructor(urls, poolSize) {
        this.urls = urls;
        this.poolSize = poolSize
        this.downloaded = new Array(urls.length);
        this.downloadedPool = new DownloadPool(this);
        this.noOfDownloadedFiles = 0;
        this.sentFileIndex = 0;
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
            // merge(file);
            console.log(`Merging - ${index}`);
            console.log(file);
        }

        // Merge next files
        if (this.downloaded[index + 1] !== undefined) {
            let cnt = index + 1;
            while (this.downloaded[cnt] !== undefined) {
                // merge(this.downloaded[cnt++]);
                console.log(`Merging - ${cnt}`);
                console.log(this.downloaded[cnt++]);
            }
        }
        this.noOfDownloadedFiles += 1;
        if (this.sentFileIndex < this.urls.length)
        this.downloadedPool.enqueue(this.urls[this.sentFileIndex], this.sentFileIndex++);
    }
}

class DownloadPool {
    constructor(downloader) {
        this.queue = [];
        this.downloader = downloader;
    }
    async enqueue(url, index) {
        this.queue.push(url);
        console.log(url);
        if (!url) debugger;
        const data = await fetch(url)
        .then((data)=> data.json())
        .then((res) => {
            this.queue.splice(this.queue.indexOf(url), 1);
            this.downloader.recievedDownloadedEvent(url, index, res);
            // work on data recieved
        }).catch((err) => {
            console.log("Failed");
            console.log(err);
        })
    }
}



initialSync()