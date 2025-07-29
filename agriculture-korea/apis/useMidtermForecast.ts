import axios from "axios"


const getDate = (date: Date) => {
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}`;
}

const convertTaToFcst = (id: string) => {
    const s = id.substring(2,4);
    if (s[0] == 'A' || s[0] == 'B') return '11B00000';
    switch (s) {
        case ('C1'):
            return '11C10000'
        break
        case ('C2'):
            return '11C20000'
        break
        case ('D1'):
            return '11D10000'
        break
        case ('D2'):
            return '11D20000'
        break
        case ('E0'):
        case ('H1'):
            return '11H10000'
        break
        case ('H2'):
            return '11H20000'
        break
        case ('F1'):
            return '11F10000'
        break
        case ('F2'):
            return '11F20000'
        break
        case ('G0'):
            return '11G00000'
        break
    }
    return 'ERROR';
}

const f = [
    '맑음',
'구름많음',
'흐림',
'구름많고 비/눈',
'흐리고 비/눈',
'흐리고 비',
'흐리고 눈',
'구름많고 비',
'구름많고 눈',
'구름많고 소나기',
'흐리고 소나기'
]

const getFcstValue = (v : string) => {
    const c = f.find(s => v == s);
    switch (c) {
        case '맑음':
            return {sky: 0, rain: 0, snow: 0};
        case '구름많음':
            return {sky: 0.5, rain: 0, snow: 0};
        case '흐림':
            return {sky: 1, rain: 0, snow: 0};
        case '구름많고 비/눈':
            return {sky: 0.5, rain: 1, snow: 1};
        case '흐리고 비/눈':
            return {sky: 1, rain: 1, snow: 1};
        case '흐리고 비':
            return {sky: 1, rain: 1, snow: 0};
        case '흐리고 눈':
            return {sky: 1, snow: 1, rain: 0};
        case '구름많고 비':
            return {sky: 0.5, rain: 1, snow: 0};
        case '구름많고 눈':
            return {sky: 0.5, snow: 1, rain: 0};
        case '구름많고 소나기':
            return {sky: 0.5, rain: 0.5, snow: 0};
        case '흐리고 소나기':
            return {sky: 1, rain: 0.5, snow: 0};
    }
    return {};
}

export const getMediumTermRainForecast = async (regId: string, date?: Date) => {
    if (!date) date = new Date();
    // Format date as YYYYMMDD
    const pad = (n: number) => n.toString().padStart(2, '0');
    const yyyymmdd = `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}`;
    const convertedRegId = convertTaToFcst(regId); //converting from codes for /getMidTa to corresponding /getMidLandFcst codes
    // Format time as HHmm
    const hhmm = `${pad(date.getHours())}00}`;

    // Available base times in order
    const baseTimes = ['0600', '1800'];
    const baseTimesAvailable = ['0601', '1801'];

    // Find the latest base time not after current time
    let time = baseTimes[0];
    for (let i = 0; i < baseTimes.length; i++) {
        if (hhmm >= baseTimesAvailable[i]) {
            time = baseTimes[i];
        } else {
            break;
        }
    }
    
    // If current time is before the earliest base time, use previous day's last base time
    if (hhmm < baseTimes[0]) {
        const prevDate = new Date(date);
        prevDate.setDate(date.getDate() - 1);
        date = prevDate;
        time = baseTimes[baseTimes.length - 1];
    }
    try {
        //console.log(process.env.EXPO_PUBLIC_SHORT_TERM_KEY)
        const res = await axios.get('https://apis.data.go.kr/1360000/MidFcstInfoService/getMidLandFcst',{
            params: {
                serviceKey: process.env.EXPO_PUBLIC_SHORT_TERM_KEY,
                pageNo: 1,
                numOfRows: 1000,
                dataType: 'JSON',
                tmFc: yyyymmdd + time,
                regId: convertedRegId
            }
        })
        const {header, body} = res.data.response;
        if (header.resultCode !== '00') throw Error(header.resultMsg);
        const items: any[] = body.items.item;
        const structuredItems: { [key: string]: any } = {};
        items.forEach((val, ind) => {
            const d = new Date();
            d.setDate(date.getDate() + 4);
            let st = getDate(d);
            structuredItems[st] = {am: {precipitation: val.rnSt4Am, ...getFcstValue(val.wf4Am)}, pm: {precipitation: val.rnSt4Pm,...getFcstValue(val.wf4Pm)}}
            d.setDate(d.getDate() + 1);
            st = getDate(d);
            structuredItems[st] = {am: {precipitation: val.rnSt5Am, ...getFcstValue(val.wf5Am)}, pm: {precipitation: val.rnSt5Pm,...getFcstValue(val.wf5Pm)}}
            d.setDate(d.getDate() + 1);
            st = getDate(d);
            structuredItems[st] = {am: {precipitation: val.rnSt6Am, ...getFcstValue(val.wf6Am)}, pm: {precipitation: val.rnSt6Pm,...getFcstValue(val.wf6Pm)}}
            d.setDate(d.getDate() + 1);
            st = getDate(d);
            structuredItems[st] = {am: {precipitation: val.rnSt7Am, ...getFcstValue(val.wf7Am)}, pm: {precipitation: val.rnSt7Pm,...getFcstValue(val.wf7Pm)}}
            d.setDate(d.getDate() + 1);
            st = getDate(d);
            structuredItems[st] = {precipitation: val.rnSt8, ...getFcstValue(val.wf8), whole: true}
            d.setDate(d.getDate() + 1);
            st = getDate(d);
            structuredItems[st] = {precipitation: val.rnSt9, ...getFcstValue(val.wf9), whole: true}
            d.setDate(d.getDate() + 1);
            st = getDate(d);
            structuredItems[st] = {precipitation: val.rnSt10, ...getFcstValue(val.wf10), whole: true}
        });
        return structuredItems;
    } catch (error) {
        throw Error(`Error fetching medium term rain forecast: ${error}`);
    }
}

export const getMediumTermTemperatureForecast = async (regId: string, date?: Date) => {
    if (!date) date = new Date();
    // Format date as YYYYMMDD
    const pad = (n: number) => n.toString().padStart(2, '0');
    const yyyymmdd = `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}`;

    // Format time as HHmm
    const hhmm = `${pad(date.getHours())}00}`;

    // Available base times in order
    const baseTimes = ['0600', '1800'];
    const baseTimesAvailable = ['0601', '1801'];

    // Find the latest base time not after current time
    let time = baseTimes[0];
    for (let i = 0; i < baseTimes.length; i++) {
        if (hhmm >= baseTimesAvailable[i]) {
            time = baseTimes[i];
        } else {
            break;
        }
    }
    
    // If current time is before the earliest base time, use previous day's last base time
    if (hhmm < baseTimes[0]) {
        const prevDate = new Date(date);
        prevDate.setDate(date.getDate() - 1);
        date = prevDate;
        time = baseTimes[baseTimes.length - 1];
    }
    try {
        console.log(process.env.EXPO_PUBLIC_SHORT_TERM_KEY)
        const res = await axios.get('https://apis.data.go.kr/1360000/MidFcstInfoService/getMidTa',{
            params: {
                serviceKey: process.env.EXPO_PUBLIC_SHORT_TERM_KEY,
                pageNo: 1,
                numOfRows: 1000,
                dataType: 'JSON',
                tmFc: yyyymmdd + time,
                regId
            }
        })
        const {header, body} = res.data.response;
        if (header.resultCode !== '00') throw Error(header.resultMsg);
        const items: any[] = body.items.item;
        const structuredItems: { [key: string]: any } = {};

        items.forEach((val, ind) => {
            const d = new Date();
            d.setDate(date.getDate() + 4);
            let st = getDate(d);
            structuredItems[st] = {min:val.taMin4, max:val.taMax4};
            d.setDate(d.getDate()+1);
            st = getDate(d);
            structuredItems[st] = {min:val.taMin5, max:val.taMax5};
            d.setDate(d.getDate()+1);
            st = getDate(d);
            structuredItems[st] = {min:val.taMin6, max:val.taMax6};
            d.setDate(d.getDate()+1);
            st = getDate(d);
            structuredItems[st] = {min:val.taMin7, max:val.taMax7};
            d.setDate(d.getDate()+1);
            st = getDate(d);
            structuredItems[st] = {min:val.taMin8, max:val.taMax8};
            d.setDate(d.getDate()+1);
            st = getDate(d);
            structuredItems[st] = {min:val.taMin9, max:val.taMax9};
            d.setDate(d.getDate()+1);
            st = getDate(d);
            structuredItems[st] = {min:val.taMin10, max:val.taMax10};
        });
        return structuredItems;
    } catch (error) {
        throw Error(`Error fetching medium term temperature forecast: ${error}`);
    }
}