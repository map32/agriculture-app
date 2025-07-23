import axios from "axios"


const getDate = (date: Date) => {
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}`;
}

export const getMediumTermRainForecast = async (regId: string, date?: Date) => {
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
        const res = await axios.get('https://apis.data.go.kr/1360000/MidFcstInfoService/getMidLandFcst',{
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
            Object.entries(val as {[key: string]: any}).map(([key, value]) =>  {
                const d = new Date();
                let st = ''
                switch(key) {
                    case "rnSt4Am":
                        d.setDate(date.getDate() + 4);
                        st = getDate(d);
                        structuredItems[st] = {am: {rain: value}}
                    break;
                    case "rnSt4Pm":
                        d.setDate(date.getDate() + 4);
                        st = getDate(d);
                        structuredItems[st] = {...structuredItems[st], pm: {rain: value}}
                    break;
                    case "rnSt5Am":
                        d.setDate(date.getDate() + 5);
                        st = getDate(d);
                        structuredItems[st] = {am: {rain: value}}
                    break;
                    case "rnSt5Pm":
                        d.setDate(date.getDate() + 5);
                        st = getDate(d);
                        structuredItems[st] = {...structuredItems[st], pm: {rain: value}}
                    break;
                    case "rnSt6Am":
                        d.setDate(date.getDate() + 6);
                        st = getDate(d);
                        structuredItems[st] = {am: {rain: value}}
                    break;
                    case "rnSt6Pm":
                        d.setDate(date.getDate() + 6);
                        st = getDate(d);
                        structuredItems[st] = {...structuredItems[st], pm: {rain: value}}
                    break;
                    case "rnSt7Am":
                        d.setDate(date.getDate() + 7);
                        st = getDate(d);
                        structuredItems[st] = {am: {rain: value}}
                    break;
                    case "rnSt7Pm":
                        d.setDate(date.getDate() + 7);
                        st = getDate(d);
                        structuredItems[st] = {...structuredItems[st], pm: {rain: value}}
                    break;
                    case "rnSt8":
                        d.setDate(date.getDate() + 8);
                        st = getDate(d);
                        structuredItems[st] = {rain: value, whole: true}
                    break;
                    case "rnSt9":
                        d.setDate(date.getDate() + 9);
                        st = getDate(d);
                        structuredItems[st] = {rain: value, whole: true}
                    break;
                    case "rnSt10":
                        d.setDate(date.getDate() + 10);
                        st = getDate(d);
                        structuredItems[st] = {rain: value, whole: true}
                    break;
                }
            })
        });
        return structuredItems;
    } catch (error) {
        console.log(error);
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
            Object.entries(val as {[key: string]: any}).map(([key, value]) =>  {
                const d = new Date();
                let st = ''
                switch(key) {
                    case "taMin4":
                        d.setDate(date.getDate() + 4);
                        st = getDate(d);
                        structuredItems[st] = {min: value}
                    break;
                    case "taMax4":
                        d.setDate(date.getDate() + 4);
                        st = getDate(d);
                        structuredItems[st] = {...structuredItems[st], max: value}
                    break;
                    case "taMin5":
                        d.setDate(date.getDate() + 5);
                        st = getDate(d);
                        structuredItems[st] = {min: value}
                    break;
                    case "taMax5":
                        d.setDate(date.getDate() + 5);
                        st = getDate(d);
                        structuredItems[st] = {...structuredItems[st], max: value}
                    break;
                    case "taMin6":
                        d.setDate(date.getDate() + 6);
                        st = getDate(d);
                        structuredItems[st] = {min: value}
                    break;
                    case "taMax6":
                        d.setDate(date.getDate() + 6);
                        st = getDate(d);
                        structuredItems[st] = {...structuredItems[st], max: value}
                    break;
                    case "taMin7":
                        d.setDate(date.getDate() + 7);
                        st = getDate(d);
                        structuredItems[st] = {min: value}
                    break;
                    case "taMax7":
                        d.setDate(date.getDate() + 7);
                        st = getDate(d);
                        structuredItems[st] = {...structuredItems[st], max: value}
                    break;
                    case "taMin8":
                        d.setDate(date.getDate() + 8);
                        st = getDate(d);
                        structuredItems[st] = {min: value}
                    break;
                    case "taMax8":
                        d.setDate(date.getDate() + 8);
                        st = getDate(d);
                        structuredItems[st] = {...structuredItems[st], max: value}
                    break;
                    case "taMin9":
                        d.setDate(date.getDate() + 9);
                        st = getDate(d);
                        structuredItems[st] = {min: value}
                    break;
                    case "taMax9":
                        d.setDate(date.getDate() + 9);
                        st = getDate(d);
                        structuredItems[st] = {...structuredItems[st], max: value}
                    break;
                    case "taMin10":
                        d.setDate(date.getDate() + 10);
                        st = getDate(d);
                        structuredItems[st] = {min: value}
                    break;
                    case "taMax10":
                        d.setDate(date.getDate() + 10);
                        st = getDate(d);
                        structuredItems[st] = {...structuredItems[st], max: value}
                    break;
                }
            })
        });
        return structuredItems;
    } catch (error) {
        console.log(error);
    }
}