const startDate = new Date(2022, 0, 1);

// let lastFetch = startDate;

const MONTH_LIST = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

function findDayOfYear(now) {
    const start = new Date(now.getUTCFullYear(), 0, 0);
    const diff = now - start;
    const oneDay = 1000 * 60 * 60 * 24;
    return Math.floor(diff / oneDay);
}

let request = (interval_name, date) => {

    const year = date.getUTCFullYear();
    const month = date.getUTCMonth();
    const dayOfYear = findDayOfYear(date);
    const hours = date.getUTCHours();

    if (interval_name == 'year') {
        const filename = `/y/${year}.json`;
        console.log(`Time: Year ${year}, File: ${filename}`);
    }
    else if (interval_name == 'month') {
        const filename = `/m/${year}-${month + 1}.json`;
        const name = MONTH_LIST[month];
        console.log(`Time: ${name} ${year}, File: ${filename}`);
    }
    else if (interval_name == 'day') {
        const filename = `/d/${year}-${dayOfYear}.json`;
        console.log(`Time: Day ${dayOfYear} of ${year}, File: ${filename}`);
    }
    else if (interval_name == 'hour') {
        const filename = `/h/${year}-${dayOfYear}-${hours + 1}.json`;
        console.log(`Time: Hour ${hours} of day ${dayOfYear}, ${year}, File: ${filename}`);
    }
    else {
        console.log('none');
    }
};

function daysInMonth(month, year) {
    return new Date(year, month, 0).getUTCDate();
}

function initialSync(currentDate) {
    console.log(currentDate);
    let dateItr = startDate;
    console.log(dateItr);
    
    while (dateItr.getUTCFullYear() < currentDate.getUTCFullYear() && dateItr < currentDate) {
        request('year', dateItr);
        dateItr.setUTCFullYear(dateItr.getUTCFullYear() + 1);
        console.log(dateItr);
    }
    // console.log(dateItr);
    // Fetch Next
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

function sync(lastFetch, currentDate) {
    let dateItr = lastFetch; // last date when fetched

    // Fetch Upto this year
    while (dateItr.getUTCHours() <= 23 && dateItr < currentDate) {
        request('hour', dateItr);
        const hours = dateItr.getUTCHours() + 1;
        dateItr.setUTCHours(dateItr.getUTCHours() + 1);
        if (dateItr.getUTCHours() != hours) break;
    }

    while (dateItr.getUTCDate() <= daysInMonth(dateItr.getUTCMonth(), dateItr.getUTCFullYear()) && dateItr < currentDate) {
        request('day', dateItr);
        const days = dateItr.getUTCDate() + 1;
        dateItr.setUTCDate(dateItr.getUTCDate() + 1);
        if (dateItr.getUTCDate() != days) break;
    }

    while (dateItr.getUTCMonth() <= 11 && dateItr < currentDate) {
        request('month', dateItr);
        const months = dateItr.getUTCMonth() + 1;
        dateItr.setUTCMonth(dateItr.getUTCMonth() + 1);
        if (dateItr.getUTCMonth() != months) break;
    }

    while (dateItr.getUTCFullYear() < currentDate.getUTCFullYear() && dateItr < currentDate) {
        request('year', dateItr);
        dateItr.setUTCFullYear(dateItr.getUTCFullYear() + 1);
    }

    // Fetch Next
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

const currentDate = new Date(2023, 2, 4);

// sync(currentDate)
// initialSync(currentDate)