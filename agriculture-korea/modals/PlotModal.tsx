import React, { FC, useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, DimensionValue } from 'react-native';
import SwipeModal, { SwipeModalPublicMethods } from '@birdwingo/react-native-swipe-modal';
import { PolygonType } from '@/types';
import { findClosestPoint } from '@/utils/turf';
import { getShortTermForecast } from '@/apis/useWeatherForecast'
import CropInfo from '@/assets/crop_info.json';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { getCurrentWeather } from '@/apis/useCurrentWeather';
import { getUltraShortTermForecast } from '@/apis/useUltraShortForecast';

interface ModalProps {
    data: PolygonType | undefined,
    modalRef: React.RefObject<SwipeModalPublicMethods | null>,
    setData: (data?: PolygonType) => void
}

const pad = (n: number) => n.toString().padStart(2, '0');


const PlotModal: FC<ModalProps> = ({modalRef, data, setData}) => {
    const showModal = () => modalRef.current?.show(); // Call this function to show modal
    const hideModal = () => modalRef.current?.hide(); // Call this function to hide modal
    
    const [address, setAddress] = useState('');
    const [weather, setWeather] = useState<any>();
    const [selectedDate, setSelectedDate] = useState<string>();
    const [condensed, setCondensed] = useState<any[]>();


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
        const addr: string = (nearest.properties['1단계'] +' '+ nearest.properties['2단계'] +' '+ nearest.properties['3단계']);
        const X = nearest.properties['격자 X']
        const Y = nearest.properties['격자 Y']
        const getWeather = async () => {
            const results = await Promise.all([
                getCurrentWeather(X,Y),
                getUltraShortTermForecast(X,Y),
                getShortTermForecast(X,Y)
            ]);
            const currentWeather = results[0];
            const ultraShortWeatherForecasts = results[1];
            const weatherForecasts = results[2];
            let condensed: any = []
            if (weatherForecasts) {
                Object.entries(weatherForecasts).map(([date, val]) => {
                    const obj: any = Object.values(val).reduce((acc: any, curr: any) => {
                        acc.high = acc.high > curr['TMP'] ? acc.high : curr['TMP'];
                        acc.low = acc.low < curr['TMP'] ? acc.low : curr['TMP'];
                        if (curr['SKY']) {
                            if (curr['SKY'] === 1) acc.clearCount += 1;
                            else if (curr['SKY'] === 3) acc.cloudyCount += 1;
                            else if (curr['SKY'] === 4) acc.cloudyCount += 0.5;
                        }
                        if (curr['PTY']) {
                            if (curr['PTY'] === 0) acc.dryCount += 1;
                            else if (curr['PTY'] === 1) acc.rainyCount += 1;
                            else if (curr['PTY'] === 2) {acc.rainyCount += 1;acc.snowyCount += 1;}
                            else if (curr['PTY'] === 3) acc.snowyCount += 1;
                            else if (curr['PTY'] === 4) acc.rainyCount += 1;
                            else if (curr['PTY'] === 5) acc.rainyCount += 0.75;
                            else if (curr['PTY'] === 6) {acc.rainyCount += 0.5;acc.snowyCount += 0.5;}
                            else if (curr['PTY'] === 7) acc.snowyCount += 0.5;
                        }
                        return acc;
                    }, {high: Number.NEGATIVE_INFINITY, low: Number.POSITIVE_INFINITY, clearCount: 0, cloudyCount: 0, midCount: 0, dryCount: 0, rainyCount: 0, snowyCount: 0});
                    // SKY: 1=clear, 3=cloudy, 4=mid
                    // SKY: 1=clear, 3=cloudy, 4=mid
                    const skyCounts = {
                        1: obj.clearCount,
                        3: obj.cloudyCount,
                        4: obj.midCount
                    };
                    // Find the sky category with the highest count
                    const maxSky = Object.entries(skyCounts).reduce((a, b) => b[1] > a[1] ? b : a)[0];
                    obj.sky = maxSky === '1' ? '맑음' : maxSky === '3' ? '흐림' : '구름';
                    obj.sky = obj.clearCount + obj.cloudyCount / Object.keys(obj).length;
                    // PTY: 0=dry, 1/2/4=rainy, 2/3=snowy
                    const ptyCounts = {
                        0: obj.dryCount,
                        1: obj.rainyCount,
                        2: obj.snowyCount
                    };
                    // Find the category with the highest count
                    const maxPty = Object.entries(ptyCounts).reduce((a, b) => b[1] > a[1] ? b : a)[0];
                    obj.pty = maxPty === '0' ? '없음' : maxPty === '1' ? '비' : '눈';

                    obj.snow = obj.snowyCount / Object.keys(obj).length;
                    obj.rain = obj.rainyCount / Object.keys(obj).length;
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
            setWeather(weatherForecasts);
            setCondensed(condensed);
        }
        getWeather();
        setAddress(addr);

    },[data])
    const onFocus = () => {console.log(barWidth.value); barWidth.value = withTiming(100, {duration: 300})}
    const onBlur = () => {console.log(barWidth.value); barWidth.value = withTiming(0, {duration: 300})}
    return (
        <SwipeModal ref={modalRef} wrapInGestureHandlerRootView maxHeight={600}>
            <View style={styles.background} onLayout={onModalLayout}>
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
                <Text style={styles.text}>내 농지의 정보</Text>
                <Text style={styles.text}>{address}</Text>
                <Text style={styles.text}>면적 {data?.area}제곱미터</Text>
                <Text style={styles.text}>날씨</Text>

                <FlatList 
                data={condensed}
                horizontal
                style={{width: '100%'}}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        style={styles.item}
                        onPress={() => {
                            setSelectedDate(item.yyyymmdd);
                            setSidePanelOpen(true);
                        }}
                    >
                        <Text style={styles.text}>{item.date.getMonth() + 1}/{item.date.getDate()}</Text>
                        <Text style={styles.text}>{item.low} | {item.high}</Text>
                        <Text style={styles.text}>{item.sky} {item.pty}</Text>
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
                            ? Object.entries(weather[selectedDate]).map(([key, val]) => (typeof val === 'object' && val !== null ? { ...val, time: key } : { time: key }))
                            : []
                    }
                    keyExtractor={(item) => item.time}
                    renderItem={({ item }: { item: any }) => (
                        <View style={styles.item}>
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
                <Text style={[styles.text, {margin: 16}]}></Text>
            </Animated.View>
        </SwipeModal>
    );

};

const styles = StyleSheet.create({
    background: {
        backgroundColor: '#333333'
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
        backgroundColor: '#222222'
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