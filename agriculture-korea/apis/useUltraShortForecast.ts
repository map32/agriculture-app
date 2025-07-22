import axios from "axios"

export const forecastCodes = {
  "T1H": "기온",
  "RN1": "1시간 강수량",
  "SKY": "하늘상태",
  "UUU": "동서바람성분",
  "VVV": "남북바람성분",
  "REH": "습도",
  "PTY": "강수형태",
  "LGT": "낙뢰",
  "VEC": "풍향",
  "WSD": "풍속"
}

export const forecastSKYCodes: Record<string, string> = {
    "1": "맑음",
    "3": "구름많음",
    "4": "흐림"
};

export const ptyCodesVeryShort: Record<string, string> = {
    "0": "없음",
    "1": "비",
    "2": "비/눈",
    "3": "눈",
    "5": "빗방울",
    "6": "빗방울눈날림",
    "7": "눈날림"
};

export const ptyCodesShort: Record<string, string> = {
    "0": "없음",
    "1": "비",
    "2": "비/눈",
    "3": "눈",
    "4": "소나기"
};


export const getUltraShortTermForecast = async (nx: number | string, ny: number | string, date?: Date) => {
    if (!date) date = new Date();
    // Format date as YYYYMMDD
    const pad = (n: number) => n.toString().padStart(2, '0');
    const yyyymmdd = `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}`;

    // Format time as HHmm
    const hhmm = `${pad(date.getHours())}00}`;

    // Available base times in order
    const baseTimes = ['0000', '0100', '0200', '0300', '0400', '0500', '0600', '0700', '0800', '0900', '1000', '1100', '1200', '1300', '1400', '1500', '1600', '1700', '1800', '1900', '2000', '2100', '2200', '2300'];
    const baseTimesAvailable = ['0015', '0115', '0215', '0315', '0415', '0515', '0615', '0715', '0815', '0915', '1015', '1115', '1215', '1315', '1415', '1515', '1615', '1715', '1815', '1915', '2015', '2115', '2215', '2315'];

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
        const res = await axios.get('https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getUltraSrtFcst',{
            params: {
                serviceKey: process.env.EXPO_PUBLIC_SHORT_TERM_KEY,
                pageNo: 1,
                numOfRows: 1000,
                dataType: 'JSON',
                base_date: yyyymmdd,
                base_time: time,
                nx,
                ny
            }
        })
        const {header, body} = res.data.response;
        if (header.resultCode !== '00') throw Error(header.resultMsg);
        const items: any[] = body.items.item;
        const structuredItems: { [key: string]: any } = {};
        items.forEach((val, ind) => {
            if (!structuredItems[val.fcstDate]) {
                structuredItems[val.fcstDate] = {};
            }
            if (!structuredItems[val.fcstDate][val.fcstTime]) {
                structuredItems[val.fcstDate][val.fcstTime] = {};
            }
            structuredItems[val.fcstDate][val.fcstTime][val.category] = val.fcstValue;
        });
        return structuredItems;
    } catch (error) {
        console.log(error);
    }
}
