let baseURL;

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
  return { month: d.getUTCMonth(), date: d.getUTCDate() };
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

function parseURL(url) {
  const res = {};
  if (!url) return res;
  
  const time = url.match(timeRegex)[0];
  res.year = parseInt(time.split("-")[0], 10);
  
  if (url.includes("/m/")) {
    res.month = parseInt(time.split("-")[1], 10);
  } 

  if (url.includes("/d/") || url.includes("/h/")) {
    const dayOfYear = parseInt(time.split("-")[1], 10);
    // Adding 1 since months in URLs start from 1, while in dates start from 0
    res.month = getMonthAndDate(dayOfYear, res.year).month + 1;
    res.date = getMonthAndDate(dayOfYear, res.year).date;
  }
  
  if (url.includes("/h/")) {
    res.hour = parseInt(time.split("-")[2], 10);
  }

  return res; 
}





function mergeTimeSpan(urls, timeSpan) {
  if (!urls.length) return null;

  const firstURL = urls[0];
  const lastURL = urls[urls.length - 1];

  const firstURLInfo = parseURL(firstURL);
  const lastURLInfo = parseURL(lastURL);

  if (timeSpan === "month") {
    if (firstURLInfo.month === 1 && lastURLInfo.month === 12) {
      return `${baseURL}/y/${firstURLInfo.year}.json`;
    }
  } else if (timeSpan === "day") {
    if (firstURLInfo.date === 1 && lastURLInfo.date === daysInMonth(firstURLInfo.month, firstURLInfo.year)) {
      return `${baseURL}/m/${firstURLInfo.year}-${firstURLInfo.month}.json`;
    }
  } else if (timeSpan === "hour") {
    if (firstURLInfo.hour  === 0 && lastURLInfo.hour === 23) {
      return `${baseURL}/d/${firstURLInfo.year}-${firstURLInfo.date}.json`;
    }
  }

  // "years" are never merged
  return null;
}

/**
 * Recursively merges the given array of URLs
 *
 * @param {String[]} urls Array of URLs
 * @param {String} _baseURL baseURL for files
*/

function mergeURLs(urls, _baseURL) {
  // Update baseURL
  baseURL = _baseURL;

  let res = [];
  let start = 0;
  let mergingWasDone = false;

  while (start < urls.length) {
    const url = urls[start];
    let items = 0;
    let timeSpan;

    if (url.includes("/h/")) {
      const date = parseURL(urls[start]).date;
      while (start + items < urls.length && parseURL(urls[start + items]).date === date && urls[start + items]?.includes("/h/")) items += 1;
      timeSpan = "hour";
    } else if (url.includes("/d/")) {
      const month = parseURL(urls[start]).month;
      while (start + items < urls.length && parseURL(urls[start + items]).month === month && urls[start + items]?.includes("/d/")) items += 1;
      timeSpan = "day";
    } else if (url.includes("/m/")) {
      const year = parseURL(urls[start]).year;
      while (start + items < urls.length && parseURL(urls[start + items]).year === year && urls[start + items]?.includes("/m/")) items += 1;
      timeSpan = "month";
    } else if (url.includes("/y/")) {
      while (start + items < urls.length && urls[start + items]?.includes("/y/")) items += 1;
      timeSpan = "year";
    }

    const itemsArray = urls.slice(start, start + items);
    const mergedURL = mergeTimeSpan(itemsArray, timeSpan);

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

// export default mergeURLs;


function driver() {
    let urls = [];
    for (let i = 1; i < 4; ++i) {
        for (let j = 0; j < 24; ++j) {
            urls.push(`https://dyncdn.exampathfinder.com/alertjsons/events/h/2021-${i}-${j}.json`);
        }
    }
    urls.splice(0, 1);
    urls.push(`https://dyncdn.exampathfinder.com/alertjsons/events/d/2021-4.json`)
    urls.push(`https://dyncdn.exampathfinder.com/alertjsons/events/d/2021-5.json`)
    urls.push(`https://dyncdn.exampathfinder.com/alertjsons/events/d/2021-7.json`)

    for (let i = 32; i <= 65; ++i) {
        urls.push(`https://dyncdn.exampathfinder.com/alertjsons/events/d/2021-${i}.json`)
    }

    console.log(mergeURLs(urls, "https://dyncdn.exampathfinder.com/alertjsons/events"));
}

driver();