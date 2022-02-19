const startDate = new Date(2022, 0, 1);

// let lastFetch = startDate;

let request = (name, date) => {
    console.log(name, ` ( ${date} )`);
};

function daysInMonth(month, year) {
    return new Date(year, month, 0).getDate();
}

function initialSync(currentDate) {
    let dateItr = startDate;

    while (dateItr.getFullYear() < currentDate.getFullYear()) {
        request('Year ' + dateItr.getFullYear(), dateItr);
        dateItr.setFullYear(dateItr.getFullYear() + 1);
    }
    // Fetch Next
    while (dateItr.getMonth() < currentDate.getMonth() && dateItr < currentDate) {
        request('Month ' + dateItr.getMonth(), dateItr);
        dateItr.setMonth(dateItr.getMonth() + 1);
    }
    while (dateItr.getDate() < currentDate.getDate() && dateItr < currentDate) {
        request('Day ' + dateItr.getDate(), dateItr);
        dateItr.setDate(dateItr.getDate() + 1);
    }
    while (dateItr.getHours() < currentDate.getHours() && dateItr < currentDate) {
        request('Hour ' + dateItr.getHours(), dateItr);
        dateItr.setHours(dateItr.getHours() + 1);
    }
}

function sync(lastFetch, currentDate) {
    let dateItr = lastFetch; // last date when fetched

    // Fetch Upto this year
    while (dateItr.getHours() <= 23 && dateItr < currentDate) {
        request('Hour ' + dateItr.getHours(), dateItr);
        const hours = dateItr.getHours() + 1;
        dateItr.setHours(dateItr.getHours() + 1);
        if (dateItr.getHours() != hours) break;
    }

    while (dateItr.getDate() <= daysInMonth(dateItr.getMonth(), dateItr.getFullYear()) && dateItr < currentDate) {
        request('Day ' + dateItr.getDate(), dateItr);
        const days = dateItr.getDate() + 1;
        dateItr.setDate(dateItr.getDate() + 1);
        if (dateItr.getDate() != days) break;
    }

    while (dateItr.getMonth() <= 11 && dateItr < currentDate) {
        request('Month ' + dateItr.getMonth(), dateItr);
        const months = dateItr.getMonth() + 1;
        dateItr.setMonth(dateItr.getMonth() + 1);
        if (dateItr.getMonth() != months) break;
    }

    while (dateItr.getFullYear() < currentDate.getFullYear() && dateItr < currentDate) {
        request('Year ' + dateItr.getFullYear(), dateItr);
        dateItr.setFullYear(dateItr.getFullYear() + 1);
    }

    // Fetch Next
    while (dateItr.getMonth() < currentDate.getMonth() && dateItr < currentDate) {
        request('Month ' + dateItr.getMonth(), dateItr);
        dateItr.setMonth(dateItr.getMonth() + 1);
    }
    while (dateItr.getDate() < currentDate.getDate() && dateItr < currentDate) {
        request('Day ' + dateItr.getDate(), dateItr);
        dateItr.setDate(dateItr.getDate() + 1);
    }
    while (dateItr.getHours() < currentDate.getHours() && dateItr < currentDate) {
        request('Hour ' + dateItr.getHours(), dateItr);
        dateItr.setHours(dateItr.getHours() + 1);
    }
}

const currentDate = new Date(2023, 2, 4);

// sync(currentDate)
// initialSync(currentDate)