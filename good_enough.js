// let controllerA = new AbortController();
// fetch("https://dyncdn.exampathfinder.com/tempjsons/event/m/2022-1.json", { signal: controllerA.signal })
//     .then((data) => {
//         data.json().then(res => {

//         }).catch((jsonErr) => {
//             console.log(jsonErr);
//         })
//     }).catch(err => {
//         console.log(err);
//     })


// setTimeout(() => {
//     controllerA.abort()
// }, 2000);

// let controllerB = new AbortController();

// fetch("https://dyncdn.exampathfinder.com/tempjsons/event/m/2022-1.json", { signal: controllerB.signal })
//     .then((data) => {
//         data.json().then(res => {

//         }).catch((jsonErr) => {
//             console.log(jsonErr);
//         })
//     }).catch(err => {
//         console.log(err);
//     })


// setTimeout(() => {
//     controllerB.abort()
// }, 2000);
