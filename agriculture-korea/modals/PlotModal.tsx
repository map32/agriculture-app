import React, { FC, useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, DimensionValue } from 'react-native';
import SwipeModal, { SwipeModalPublicMethods } from '@birdwingo/react-native-swipe-modal';
import { PolygonType } from '@/types';
import { findClosestPoint, findMidtermClosestPoint } from '@/utils/turf';
import { getShortTermForecast } from '@/apis/useWeatherForecast'
import CropInfo from '@/assets/crop_info.json';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { getCurrentWeather } from '@/apis/useCurrentWeather';
import { getUltraShortTermForecast } from '@/apis/useUltraShortForecast';
import { getMediumTermRainForecast, getMediumTermTemperatureForecast } from '@/apis/useMidtermForecast';
import Screen from '@/components/crops';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface ModalProps {
    data: PolygonType | undefined,
    modalRef: React.RefObject<SwipeModalPublicMethods | null>,
    setData: (data?: PolygonType) => void,
    saveData: any
}

const pad = (n: number) => n.toString().padStart(2, '0');

const wed = (cloudiness: number, raininess: number, snowiness: number) => {
    if (snowiness > 0.1) {

    }
}

const formatArea = (areaInSquareMeters: number | undefined) => {
    if (!areaInSquareMeters) return;
    // 1. Convert from sq meters to sq kms
    const areaInSquareKm = areaInSquareMeters / 1000000;

    // 2. Round to the nearest whole number (removes decimals)
    const roundedArea = Math.round(areaInSquareKm);

    // 3. Apply appropriate commas
    // Using toLocaleString() is a common way to add thousands separators
    const formattedArea = roundedArea.toLocaleString(); // Uses default locale, or specify 'en-US' for consistency

    return `${formattedArea} sq km`;
}


const PlotModal: FC<ModalProps> = ({modalRef, data, setData, saveData}) => {
    const showModal = () => modalRef.current?.show(); // Call this function to show modal
    const hideModal = () => modalRef.current?.hide(); // Call this function to hide modal
    
    const [address, setAddress] = useState('');
    const [weather, setWeather] = useState<any>();
    const [selectedDate, setSelectedDate] = useState<string>();
    const [condensed, setCondensed] = useState<any[]>();
    const insets = useSafeAreaInsets();

    const [sidePanelOpen, setSidePanelOpen] = useState(false);

    // Animation value for the side panel
    const left = useSharedValue(10000);
    const barWidth = useSharedValue<DimensionValue>(0);
    const [modalWidth, setModalWidth] = useState(0);

    const animatedStyle = useAnimatedStyle(() => ({
        left: left.value,
    }));

    const animatedBarStyle = useAnimatedStyle(() => ({
        width: barWidth.value
    }))

    // Update modalWidth when layout changes
    const onModalLayout = (event: any) => {
        setModalWidth(event.nativeEvent.layout.width);
    };

    // Animate using pixel values instead of percentage
    useEffect(() => {
        if (modalWidth === 0) return;
        left.value = sidePanelOpen
            ? withTiming(0)
            : withTiming(modalWidth);
    }, [sidePanelOpen, modalWidth]);

    useEffect(() => {
        if (!data) return;
        const nearest = findClosestPoint([data.center.lng, data.center.lat]);
        const m_nearest = findMidtermClosestPoint([data.center.lng, data.center.lat]);
        const addr: string = (nearest.properties['1단계'] +' '+ nearest.properties['2단계'] +' '+ nearest.properties['3단계']);
        const X = nearest.properties['격자 X']
        const Y = nearest.properties['격자 Y']
        const m_code = m_nearest.properties['regId']
        const getWeather = async () => {
            const results = await Promise.all([
                getCurrentWeather(X,Y),
                getUltraShortTermForecast(X,Y),
                getShortTermForecast(X,Y),
                getMediumTermRainForecast(m_code),
                getMediumTermTemperatureForecast(m_code)
            ]);
            const currentWeather = results[0];
            const ultraShortWeatherForecasts = results[1];
            const weatherForecasts = results[2];
            const midRain = results[3]
            const midTemp = results[4]
            if (midRain && midTemp) {
                Object.entries(midRain).map(([date, value]) => {
                    if (!weatherForecasts![date]) weatherForecasts![date] = {...value, ...midTemp[date], mid: true}
                })
            }
            if (ultraShortWeatherForecasts) {
                Object.entries(ultraShortWeatherForecasts).map(([date, timevalue]) => {
                    Object.entries(timevalue).map(([time, value]) => {
                        const orig = weatherForecasts![date][time];
                        //@ts-ignore
                        const val = {...value, TMP: value['T1H'], PCP:value['RN1']}
                        //@ts-ignore
                        weatherForecasts![date][time] = {...orig, ...val}
                    })
                })
            }
            if (currentWeather) {
                Object.entries(currentWeather).map(([date, timevalue]) => {
                    Object.entries(timevalue).map(([time, value]) => {
                        const orig = weatherForecasts![date][time];
                        //@ts-ignore
                        const val = {...value, TMP: value['T1H'], PCP:value['RN1']}
                        //@ts-ignore
                        weatherForecasts![date][time] = {...orig, ...val}
                    })
                })
            }
            let condensed: any = []
            if (weatherForecasts) {
                Object.entries(weatherForecasts).map(([date, val]) => {
                    
                    if (val.mid) {
                        // Parse YYYYMMDD string to Date object
                        const d = new Date(
                            Number(date.substring(0, 4)),
                            Number(date.substring(4, 6)) - 1,
                            Number(date.substring(6, 8))
                        );
                        const yyyymmdd = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
                        if (val.whole) {
                            condensed.push({yyyymmdd, date: d, mid:true, high: val.max, low: val.min, am: {sky: val.rain, rain: val.rain, snow: 0}, pm: {sky: val.rain, rain: val.rain, snow: 0}})
                        } else {
                            condensed.push({yyyymmdd, date: d, mid:true, high: val.max, low: val.min, am: {sky: val.am.rain, rain: val.am.rain, snow: 0}, pm: {sky: val.pm.rain, rain: val.pm.rain, snow: 0}})
                        }
                        return;
                    }
                    const obj: any = Object.entries(val).reduce((acc: any, [time, curr]: [string, any]) => {
                        if (time < "1200") {
                            acc.am.count++;
                            if (curr['SKY']) {
                                if (curr['SKY'] === 3) acc.am.cloudyCount += 1;
                                else if (curr['SKY'] === 4) acc.am.cloudyCount += 0.5;
                            }
                            if (curr['PTY']) {
                                if (curr['PTY'] === 1) acc.am.rainyCount += 1;
                                else if (curr['PTY'] === 2) {acc.am.rainyCount += 1; acc.am.snowyCount += 1;}
                                else if (curr['PTY'] === 3) acc.am.snowyCount += 1;
                                else if (curr['PTY'] === 4) acc.am.rainyCount += 1;
                                else if (curr['PTY'] === 5) acc.am.rainyCount += 0.75;
                                else if (curr['PTY'] === 6) {acc.am.rainyCount += 0.5; acc.am.snowyCount += 0.5;}
                                else if (curr['PTY'] === 7) acc.am.snowyCount += 0.5;
                            }
                        } else {
                            acc.pm.count++;
                            if (curr['SKY']) {
                                if (curr['SKY'] === 3) acc.pm.cloudyCount += 1;
                                else if (curr['SKY'] === 4) acc.pm.cloudyCount += 0.5;
                            }
                            if (curr['PTY']) {
                                if (curr['PTY'] === 1) acc.pm.rainyCount += 1;
                                else if (curr['PTY'] === 2) {acc.pm.rainyCount += 1; acc.pm.snowyCount += 1;}
                                else if (curr['PTY'] === 3) acc.pm.snowyCount += 1;
                                else if (curr['PTY'] === 4) acc.pm.rainyCount += 1;
                                else if (curr['PTY'] === 5) acc.pm.rainyCount += 0.75;
                                else if (curr['PTY'] === 6) {acc.pm.rainyCount += 0.5; acc.pm.snowyCount += 0.5;}
                                else if (curr['PTY'] === 7) acc.pm.snowyCount += 0.5;
                            }
                        }
                        acc.high = acc.high > curr['TMP'] ? acc.high : curr['TMP'];
                        acc.low = acc.low < curr['TMP'] ? acc.low : curr['TMP'];
                        return acc;
                    }, {high: Number.NEGATIVE_INFINITY, low: Number.POSITIVE_INFINITY, am: {cloudyCount: 0, rainyCount: 0, snowyCount: 0, count: 0}, pm: {cloudyCount: 0, rainyCount: 0, snowyCount: 0, count: 0}});
                    // SKY: 1=clear, 3=cloudy, 4=mid
                    // SKY: 1=clear, 3=cloudy, 4=mid
    
                    // Find the sky category with the highest count
                    obj.am.sky = obj.am.cloudyCount / obj.am.count;
                    obj.pm.sky = obj.pm.cloudyCount / obj.pm.count;

                    // Find the category with the highest count

                    obj.am.snow = obj.am.snowyCount / obj.am.count;
                    obj.pm.snow = obj.pm.snowyCount / obj.pm.count;
                    obj.am.rain = obj.am.rainyCount / obj.am.count;
                    obj.pm.rain = obj.pm.rainyCount / obj.pm.count;
                    // Parse YYYYMMDD string to Date object
                    obj.date = new Date(
                        Number(date.substring(0, 4)),
                        Number(date.substring(4, 6)) - 1,
                        Number(date.substring(6, 8))
                    );
                    const yyyymmdd = `${obj.date.getFullYear()}${pad(obj.date.getMonth() + 1)}${pad(obj.date.getDate())}`;
                    obj.yyyymmdd = yyyymmdd;
                    condensed.push(obj);
                })
            }
            setWeather(weatherForecasts);
            setCondensed(condensed);
        }
        getWeather();
        setAddress(addr);

    },[data])
    const onFocus = () => {console.log(barWidth.value); barWidth.value = withTiming(100, {duration: 300})}
    const onBlur = () => {console.log(barWidth.value); barWidth.value = withTiming(0, {duration: 300})}
    return (
        <SwipeModal ref={modalRef} wrapInGestureHandlerRootView maxHeight={600} onHide={saveData}>
            <View style={[styles.background, {paddingBottom: insets.bottom}]} onLayout={onModalLayout}>
                <View style={styles.header}>
                    <TextInput
                        style={styles.titleedit}
                        value={data?.title}
                        onFocus={onFocus}
                        onBlur={onBlur}
                        onChangeText={(text) => {if (!data) return; setData({...data, title: text})}}
                        placeholder="농지 이름"
                        placeholderTextColor="#aaa"
                    />
                    <Animated.View style={[styles.animbar, animatedBarStyle]} />
                </View>
                <Text style={styles.text}>{address}</Text>
                <Text style={styles.text}>면적 {formatArea(data?.area)}</Text>
                <Text style={styles.text}>날씨</Text>

                <FlatList 
                data={condensed}
                horizontal
                style={{height: 60, maxHeight: 60}}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        style={styles.item}
                        onPress={() => {
                            if (item.mid) return;
                            setSelectedDate(item.yyyymmdd);
                            setSidePanelOpen(true);
                        }}
                    >
                        <Text style={styles.text}>{item.date.getMonth() + 1}/{item.date.getDate()}</Text>
                        <Text style={styles.text}>{item.low} | {item.high}</Text>
                        <Text style={styles.text}></Text>
                    </TouchableOpacity>
                )}
                />

                <Text style={styles.text}>재배작물</Text>
                <TouchableOpacity
                    style={styles.panelButton}
                    onPress={() => setSidePanelOpen(true)}
                >
                    <Text style={styles.text}>상세 정보 열기</Text>
                </TouchableOpacity>
                <Screen />
            </View>
            <Animated.View style={[styles.sideview, animatedStyle]}>
                <TouchableOpacity
                    style={styles.closeButton}
                    onPress={() => setSidePanelOpen(false)}
                >
                    <Text style={styles.text}>닫기</Text>
                </TouchableOpacity>
                {/* Add your side panel content here */}
                <FlatList
                    data={
                        selectedDate && weather && weather[selectedDate]
                            ? Object.entries(weather[selectedDate]).map(([key, val]) => (typeof val === 'object' && val !== null ? { ...val, time: key } : { time: key })).sort((a, b) => a.time.localeCompare(b.time))
                            : []
                    }
                    keyExtractor={(item) => item.time}
                    renderItem={({ item }: { item: any }) => (
                        <View style={{paddingBottom: insets.bottom}}>
                            <Text style={styles.text}>{item.time}시</Text>
                            <Text style={styles.text}>기온: {item.TMP}°C</Text>
                            <Text style={styles.text}>하늘: {item.SKY}</Text>
                            <Text style={styles.text}>강수확률: {item.POP}</Text>
                            <Text style={styles.text}>강수형태: {item.PTY}</Text>
                            <Text style={styles.text}>강수량: {item.PCP}</Text>
                            <Text style={styles.text}>습도: {item.REH}</Text>
                            <Text style={styles.text}>풍속: {item.WSD}</Text>
                            <Text style={styles.text}>풍향: {item.VEC}</Text>
                        </View>
                    )}
                />
                <Screen />
            </Animated.View>
        </SwipeModal>
    );

};

const styles = StyleSheet.create({
    background: {
        width: '100%',
        backgroundColor: '#333333',
        flex: 1
    },
    header: {
        backgroundColor: '#555555',
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column'
    },
    title: {
        padding: 4,
        borderWidth: 0
    },
    titleedit: {
        padding: 4,
        color: '#fff',
        width: '100%',
        textAlign: 'center'
        //borderBottomWidth: 1,
    },
    animbar: {
        height: 2,
        backgroundColor: 'aliceblue'
    },
    sideview: {
        position: 'absolute',
        width: '100%',
        height: '100%',
        top: 0,
        left: '100%',
        backgroundColor: '#222',
        zIndex: 10,
        paddingTop: 32,
        borderTopLeftRadius: 12,
        borderBottomLeftRadius: 12,
        shadowColor: '#000',
        shadowOpacity: 0.2,
        shadowOffset: { width: -2, height: 0 },
        shadowRadius: 8,
    },
    text: {
        color: 'white'
    },
    item: {
        paddingVertical: 8,
        height: 60
    },
    panelButton: {
        marginTop: 16,
        padding: 12,
        backgroundColor: '#444',
        borderRadius: 8,
        alignItems: 'center',
    },
    closeButton: {
        position: 'absolute',
        top: 8,
        right: 8,
        padding: 8,
        backgroundColor: '#444',
        borderRadius: 8,
        zIndex: 20,
    }
})

export default PlotModal;