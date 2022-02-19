document.getElementById('initial_sync').addEventListener('click', () => {
    let date = new Date(document.getElementById('today').value);
    initialSync(date);
})

document.getElementById('sync').addEventListener('click', () => {
    let init_date = new Date(document.getElementById('start_date').value);
    let date = new Date(document.getElementById('today').value);
    sync(init_date, date);
})