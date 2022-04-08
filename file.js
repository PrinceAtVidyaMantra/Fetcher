const baseURL = "https://dyncdn.exampathfinder.com/alertjsons/events";

const timeRegex = /([0-9].*[0-9])/g;

/**
 * Returns the day number and month number as an object 
 * For example 87th day of year => 28th day of March
 * so result is {month: 2, date: 28}
 * 
 * @param {Number} dayOfYear day Of Year
 * @param {Number} year Year 
 * @returns {Object} combined info of date and month
 */
function getMonthAndDate(dayOfYear, year) {
    const d = new Date(year);
    d.setUTCFullYear(year);
    d.setUTCDate(dayOfYear);
    return {month: d.getUTCMonth(), date: d.getUTCDate()}
}
/**
 * Retunrs the number of days in the corresponding month 
 * in the given year
 * 
 * @param {Number} month month number [1-30]
 * @param {Number} year 4 digit year 
 * @returns {Number} no of days in month
 */
function daysInMonth(month, year) {
    const d = new Date(year, month);
    d.setUTCFullYear(year);
    d.setUTCMonth(month);
    d.setUTCDate(0);
    return d.getUTCDate();
}

/**
 * Finds the month number from given URL
 * 
 * @param {String} url URL to be searched for month 
 * @returns {Number | null} the month number [1-12] else null 
 */
function getMonth(url) {
    if (url.includes("/m/")) {
        return parseInt(url.match(timeRegex)[0].split("-")[1], 10);
    } else if (url.includes("/d/") || url.includes("/h/")) {
        const year = getYear(url);
        const dayOfYear = parseInt(url.match(timeRegex)[0].split("-")[1], 10);

        // Adding 1 since months in URLs start from 1, while in dates start from 0 
        return getMonthAndDate(dayOfYear, year).month + 1;
    }
    return null;
}

/**
 * Finds the day number from given URL
 * 
 * @param {String} url URL to be searched for day 
 * @returns {Number | null} the day number [1-30] else null 
 */
function getDay(url) {
    if (url.includes("/d/") || url.includes("/h/")) {
        const year = getYear(url);
        const dayOfYear = parseInt(url.match(timeRegex)[0].split("-")[1], 10);
        return getMonthAndDate(dayOfYear, year).date;
    }
    return null;
}

/**
 * Finds the hour number from given URL
 * 
 * @param {String} url URL to be searched for hour 
 * @returns {Number | null} the hour number [0-23] else null 
 */
function getHour(url) {
    if (url.includes("/h/")) {
        return parseInt(url.match(timeRegex)[0].split("-")[2], 10);
    }
    return null;
}

/**
 * Finds the 4-digit year from given URL
 * 
 * @param {String} url URL to be searched for year 
 * @returns {Number | null} a 4-digit year else null 
 */
function getYear(url) {
    if (!url) return null;
    return parseInt(url.match(timeRegex)[0].split("-")[0], 10);
}

/**
 * Returns a merged url of hours if merging is possible
 * else returns null
 * 
 * @param {String[]} urls Array of hour URLs
 * @returns {String | null} The merged URL or null
 */
function mergeHours(urls) {
    if (!urls.length) return null;

    let firstURL = urls[0];
    let lastURL = urls[urls.length - 1];

    if (getHour(firstURL) == 0 && getHour(lastURL) == 23) {
        return `${baseURL}/d/${getYear(firstURL)}-${getDay(firstURL)}.json`;
    }
    
    return null;
}

/**
 * Returns a merged url of days if merging is possible
 * else returns null
 * 
 * @param {String[]} urls Array of day URLs
 * @returns {String | null} The merged URL or null
 */
function mergeDays(urls) {
    if (!urls.length) return null;

    let firstURL = urls[0];
    let lastURL = urls[urls.length - 1];

    if (getDay(firstURL) == 1 && getDay(lastURL) == daysInMonth(getMonth(firstURL), getYear(firstURL))) {
        return `${baseURL}/m/${getYear(firstURL)}-${getMonth(firstURL)}.json`;
    }
    
    return null;
}

/**
 * Returns a merged url of months if merging is possible
 * else returns null
 * 
 * @param {String[]} urls Array of month URLs
 * @returns {String | null} The merged URL or null
 */
function mergeMonths(urls) {
    if (!urls.length) return null;

    let firstURL = urls[0];
    let lastURL = urls[urls.length - 1];

    if (getMonth(firstURL) == 1 && getMonth(lastURL) == 12) {
        return `${baseURL}/y/${getYear(firstURL)}.json`;
    }
    
    return null;
}

/**
 * Recursively merges the given array of URLs
 * 
 * @param {String[]} urls Array of URLs
 */
function mergeURLs(urls) {

    let res = [];
    let start = 0;
    let mergingWasDone = false;

    while (start < urls.length) {
        let url = urls[start];
        let items = 0;
        let mergeFunc;

        if (url.includes("/h/")) {
            const day = getDay(urls[start]);    // 96
            while (start + items < urls.length && getDay(urls[start + items]) === day && urls[start + items]?.includes("/h/")) ++items;
            mergeFunc = mergeHours;

        } else if (url.includes("/d/")) {
            const month = getMonth(urls[start]);    // 2
            while (start + items < urls.length && getMonth(urls[start + items]) === month && urls[start + items]?.includes("/d/")) ++items;
            mergeFunc = mergeDays;

        } else if (url.includes("/m/")) {
            const day = getYear(urls[start]);
            while (start + items < urls.length && getYear(urls[start + items]) === day && urls[start + items]?.includes("/m/")) ++items;
            mergeFunc = mergeMonths;

        } else if (url.includes("/y/")) {
            while (start + items < urls.length && urls[start + items]?.includes("/y/")) ++items;
            mergeFunc = () => null;
        }

        let itemsArray = urls.slice(start, start + items);
        let mergedURL = mergeFunc(itemsArray);

        // Append merged URLs in result
        debugger;
        if (mergedURL == null) {
            res = [...res, ...itemsArray];
        } else {
            res.push(mergedURL);
            mergingWasDone = true;
        }

        // Update Start
        start += items;
    }

    if (mergingWasDone) return mergeURLs(res);
    return res;
}

function driver() {
    let urls = [];
    for (let i = 1; i < 4; ++i) {
        for (let j = 0; j < 24; ++j) {
            urls.push(`https://dyncdn.exampathfinder.com/alertjsons/events/h/2021-${i}-${j}.json`);
        }
    }
    
    console.log(mergeURLs(urls));
}

driver();