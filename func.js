// ----------------- Utility Functions -----------------------

// Sorts an array on basis of a key
function sortOnKey(arr, key) {
    arr.sort((a, b) => (a[key] > b[key] ? 1 : -1));
}


// Regex and valid filenames list
const yearRegex = new RegExp(`^[12][0-9]{3}$`);
const MONTH_LIST = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];
const dayRegex = new RegExp('^[dD]ay[0-9]{1,2}$');
const hourRegex = new RegExp(`^[hH]our[0-9]{1,2}$`);

// -----------------------------------------------------------------

/**
 * Makes a request for the provided filename
 * @param {array} files files to request
 */
function makeRequest(files) {
    files.forEach(file => {
        // Make Request for individual files
        console.log(file);
    });
    // console.log("\n");
}



let request = 1;
/**
 * Returns an list of objects
 * name is the time String and
 * stamp is the timstamp
 * of all the available files on server
 * @returns {array} fileList
 */
function getFileList() {

    if (request === 1) {
        request = 2;
        return [
            { name: 'January', stamp: '1' },
            { name: 'February', stamp: '2' },
            { name: 'Day1', stamp: '3' },
            { name: 'Day2', stamp: '4' },
            { name: 'Day3', stamp: '5' },
            { name: 'Hour1', stamp: '6' },
            { name: 'Hour2', stamp: '7' },
        ];
    }
    else
    return [
        { name: 'January', stamp: '1' },
        { name: 'February', stamp: '2' },
        { name: 'March', stamp: '8' },
        { name: 'Day1', stamp: '3' },
        { name: 'Day2', stamp: '4' },
        { name: 'Day3', stamp: '5' },
        { name: 'Day4', stamp: '9' },
        { name: 'Day5', stamp: '10' },
        { name: 'Hour1', stamp: '6' },
        { name: 'Hour2', stamp: '7' },
    ]; 
}

function segregateIntervals(fileList) {
    const intervalMap = {
        year: [],
        month: [],
        day: [],
        hour: []
    }

    fileList.forEach(file => {
        if (yearRegex.test(file.name)) {
            intervalMap.year.push(file);
        }
        else if (MONTH_LIST.includes(file.name)) {
            intervalMap.month.push(file);
        }
        else if (dayRegex.test(file.name)) {
            intervalMap.day.push(file);
        }
        else if (hourRegex.test(file.name)) {
            intervalMap.hour.push(file);
        }
    })

    return intervalMap;
}

function sortIntoArray(intervalMap) {
    sortOnKey(intervalMap['year'], 'name');
    sortOnKey(intervalMap['month'], 'name');
    sortOnKey(intervalMap['day'], 'name');
    sortOnKey(intervalMap['hour'], 'name');

    return [
        ...intervalMap['year'],
        ...intervalMap['month'],
        ...intervalMap['day'],
        ...intervalMap['hour']
    ];
}

function filterIntervals(intervals, excluding) {
    let filteredIntervals = [];

    intervals.forEach(interval => {
        let found = false;
        for (let i = 0; i < excluding.length; ++i) {
            if (excluding[i].stamp === interval.stamp) {
                found = true;
                break;
            }
        }
        if (!found) {
            filteredIntervals.push(interval);
        }
    })

    return filteredIntervals;
}

let initialMap = null;

function initialSync() {
    let fileList = getFileList();
    let intervalMap = segregateIntervals(fileList);
    let intervals = sortIntoArray(intervalMap);
    makeRequest(intervals);
    initialMap = intervalMap;
}

function sync() {

    // If Initial Sync is complete
    if (initialMap) {
        console.log("Regular Sync");
        let fileList = getFileList();
        let currentMap = segregateIntervals(fileList);
        let initialIntervals = sortIntoArray(initialMap);
        let currentIntervals = sortIntoArray(currentMap);
        let filteredIntervals = filterIntervals(currentIntervals, initialIntervals);
        makeRequest(filteredIntervals);
        initialMap = currentMap;
    }
    // Else do one
    else {
        console.log("Intial sync");
        initialSync();
    }
}

function main() {
    // const hour = 1000 * 60 * 60;
    const hour = 2000;
    sync();
    setInterval(sync, hour);
}

main()

