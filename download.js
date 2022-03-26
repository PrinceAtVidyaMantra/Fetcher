
const startDate = new Date(Date.UTC(2021, 0, 1));
const initialJsons = {}
const initialTagJson = {}
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
    currentDate.setDate(currentDate.getDate() - 5);
    let dateItr = startDate;
    forward(dateItr, currentDate);
    console.log(urls);
    let my_downloader = new Downloader(urls, 5);
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
            console.log(`Merging - ${index}`);
            merge(file)
        }

        // Merge next files
        if (this.downloaded[index + 1] !== undefined) {
            let cnt = index + 1;
            while (this.downloaded[cnt] !== undefined) {
                
                console.log(`Merging - ${cnt}`);
                merge(this.downloaded[cnt])
                cnt++
            }
        }
        this.noOfDownloadedFiles += 1;
        if (this.sentFileIndex < this.urls.length)
        {
            this.downloadedPool.enqueue(this.urls[this.sentFileIndex], this.sentFileIndex++);
        }
        
    }
}

class DownloadPool {
    constructor(downloader) {
        this.queue = [];
        this.downloader = downloader;
        this.counts = this.downloader.urls.map(item => {return {count : 0}})
    }
    enqueue(url, index) {
        this.queue.push(url);
        let fileDownloaded = false;
        const controller = new AbortController();
        fetch(url, { signal: controller.signal })
        .then((data)=> data.json())
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

        setTimeout(()=>{
            let counter = this.counts[index].count;
            if(!fileDownloaded && counter < 3){
                console.log(url);
            controller.abort();
            this.enqueue(url, index)
            this.counts[index] = {count : counter + 1};
            }
        }, 30000)
    }
}

function merge(data){
    Object.keys(data).forEach(key => {
        initialJsons[key] = data[key]
    });
    console.log(Object.values(initialJsons).length);

   
}
function mergeTags(data){
     // for Tags
     Object.keys(data.tags).forEach(key => {
        const tagObject = {
            id : data[key].id,
            type : data[key].type,
            lang : data[key].lang,
            values : [...initialTagJson[key].values, ...data[key].values]
        } 
        initialTagJson.tags[key] = tagObject
    })

    // for Organisations
    Object.keys(data.organisations).forEach(key => {
        const organisationObject = {
            id : data[key].id,
            type : data[key].type,
            lang : data[key].lang,
            values : [...initialTagJson[key].values, ...data[key].values]
        } 
        initialTagJson.organisations[key] = organisationObject
    })

    // for exams
    Object.keys(data.exams).forEach(key => {
        const examObject = {
            id : data[key].id,
            type : data[key].type,
            lang : data[key].lang,
            values : [...initialTagJson[key].values, ...data[key].values]
        } 
        initialTagJson.exams[key] = examObject
    })
}

initialSync()
  