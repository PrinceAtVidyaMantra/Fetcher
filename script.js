document.getElementById('initial_sync').addEventListener('click', () => {
    let date = new Date(document.getElementById('today').value);
    initialSync(date);
})

document.getElementById('sync').addEventListener('click', () => {
    let init_date = new Date(document.getElementById('start_date').value);
    let date = new Date(document.getElementById('today').value);
    sync(init_date, date);
})

function func() {
    document.getElementById('start_date').value = '2022-07-17T01:49';
    document.getElementById('today').value = '2025-07-20T23:49';
}