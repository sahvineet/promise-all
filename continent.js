const https = require('https')
const fs = require('fs')
const EventEmitter = require('events');

class ContinentEmitter extends EventEmitter { }

const contEmitter = new ContinentEmitter();


const getContent = function (url) {
    return new Promise((resolve, reject) => {
        const lib = url.startsWith('https') ? require('https') : require('http');
        const request = lib.get(url, (response) => {
            if (response.statusCode < 200 || response.statusCode > 299) {
                reject(new Error('Failed to load page, status code: ' + response.statusCode));
            }
            const body = [];
            response.on('data', (chunk) => body.push(chunk));
            response.on('end', () => resolve(body.join('')));
        });
        request.on('error', (err) => reject(err))
    })
};
let conContUrl='xxxxx';
let conAbbUrl='xxxxx';
let conCctUrl='xxxxx';
let conContProm = getContent(conContUrl)
let conAbbProm = getContent(conAbbUrl)
let conCctProm = getContent(conCctUrl)

Promise.all([conContProm, conAbbProm, conCctProm])
    .then(values => {
        let dataObj = [];
        values.forEach(ele => {
            dataObj.push(JSON.parse(ele))
        })

        let finalData = [];

        let conContArr = dataObj[0];
        let conAbbArr = dataObj[1];
        let conCctArr = dataObj[2];

        let continentCountyFilter = {};

        for (let i = 0, len = conContArr.length; i < len; i++) {
            if (!continentCountyFilter.hasOwnProperty([conContArr[i]['continent']]))
                continentCountyFilter[conContArr[i]['continent']] = [];
            continentCountyFilter[conContArr[i]['continent']].push(conContArr[i]['country']);
        }


        for (let cont in continentCountyFilter) {
            contEmitter.emit('event', cont, continentCountyFilter, conAbbArr, conCctArr);
        }
    })



contEmitter.on('event', (cont, continentCountyFilter, conAbbArr, conCctArr) => {
    let finalData = [];
    continentCountyFilter[cont].forEach(country => {
        let tempObj = { country_name: country, country_abbreviation: '', capital: '' };
        for (let i = 0; i < conAbbArr.length; i++) {
            if (conAbbArr[i].country == country) {
                tempObj.country_abbreviation = conAbbArr[i].abbreviation;
                break;
            }
        }
        for (let i = 0; i < conCctArr.length; i++) {
            if (conCctArr[i].country == country) {
                tempObj.capital = conCctArr[i].city;
                break;
            }
        }
        finalData.push(tempObj)
    })
    let filename='./continent/'
    if (!fs.existsSync(filename)) {
        fs.mkdirSync(filename);
    }
    filename=filename+cont + '.json';
    fs.writeFile(filename, JSON.stringify(finalData), err => {
        if (err)
            return console.log(err)
    })
});
