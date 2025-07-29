import axios from "axios"

export const forecastCodes = {
    POP: "강수확률",
    PTY: "강수형태",
    PCP: "1시간 강수량",
    REH: "습도",
    SNO: "1시간 신적설",
    SKY: "하늘상태",
    TMP: "1시간 기온",
    TMN: "일 최저기온",
    TMX: "일 최고기온",
    UUU: "풍속(동서성분)",
    VVV: "풍속(남북성분)",
    WAV: "파고",
    VEC: "풍향",
    WSD: "풍속"
};

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


export const getShortTermForecast = async (nx: number | string, ny: number | string, date?: Date) => {
    if (!date) date = new Date();
    // Format date as YYYYMMDD
    const pad = (n: number) => n.toString().padStart(2, '0');
    const yyyymmdd = `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}`;

    // Format time as HHmm
    const hhmm = `${pad(date.getHours())}00}`;

    // Available base times in order
    const baseTimes = ["0200", "0500", "0800", "1100", "1400", "1700", "2000", "2300"];
    const baseTimesAvailable = ["0215", "0515", "0815", "1115", "1415", "1715", "2015", "2315"];
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
        const res = await axios.get('https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getVilageFcst',{
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
        console.log(yyyymmdd, time, nx, ny, res.data.response);
        const {header, body} = res.data.response;
        if (header.resultCode !== '00') throw Error(header.resultMsg);
        const items: any[] = body.items.item;
        const structuredItems: { [key: string]: any } = {};
        items.sort((a,b) => a.fcstTime.localeCompare(b.fcstTime));
        items.sort((a,b) => a.fcstDate.localeCompare(b.fcstDate));
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
        throw Error(`Error fetching short term forecast: ${error}`);
    }
}
