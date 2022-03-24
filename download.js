class Downloader {

    constructor(urls, poolSize) {
        this.urls = urls;
        this.downloaded = new Array(urls.length);
        this.downloadedPool = new DownloadPool(this);
        this.noOfDownloadedFiles = 0;
    }

    start() {
        for (let i = 0; i < poolSize; ++i) {
            this.downloadedPool.enqueue(this.urls[noOfDownloadedFiles], noOfDownloadedFiles, );
        }
    }
    recievedDownloadedEvent(url, index, file) {
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
            merge(file);
        }

        // Merge next files
        if (this.downloaded[index + 1] !== undefined) {
            let cnt = index + 1;
            while (this.downloaded[cnt] !== undefined) {
                merge(this.downloaded[cnt++]);
            }
        }

        this.noOfDownloadedFiles += 1;
        this.downloaded[index] = file;
        this.downloadedPool.enqueue(this.urls[this.noOfDownloadedFiles]);

    }
}

class DownloadPool {
    constructor(downloader) {
        this.queue = [];
        this.downloader = downloader;
    }
    enqueue(url, index) {
        this.queue.push(url);
        fetch(url).then((res) => {
            this.queue.splice(this.queue.indexOf(url), 1);
            this.downloader.recievedDownloadedEvent(url, index, res);
            // work on data recieved
        }).catch((err) => {
            console.log("Failed");
        })
    }
}

let urls = []

let my_downloader = new Downloader(urls, 5);