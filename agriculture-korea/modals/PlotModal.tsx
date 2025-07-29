import React, { FC, useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, DimensionValue, ScrollView, ActivityIndicator } from 'react-native';
import SwipeModal, { SwipeModalPublicMethods } from '@birdwingo/react-native-swipe-modal';
import { PolygonType } from '@/types'; // Assuming PolygonType is defined
import { findClosestPoint, findMidtermClosestPoint } from '@/utils/turf'; // Assuming these utilities exist
import { getShortTermForecast } from '@/apis/useWeatherForecast' // Assuming API calls exist
import CropInfo from '@/assets/crop_info.json'; // Assuming this asset exists
import { svgFiles } from '@/constants/constants' // Assuming svgFiles contains SVG strings
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { getCurrentWeather } from '@/apis/useCurrentWeather'; // Assuming API calls exist
import { getUltraShortTermForecast } from '@/apis/useUltraShortForecast'; // Assuming API calls exist
import { getMediumTermRainForecast, getMediumTermTemperatureForecast } from '@/apis/useMidtermForecast'; // Assuming API calls exist
import Screen from '@/components/crops'; // Assuming this is your CropSearchScreen component
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SvgCss } from 'react-native-svg/css'; // For rendering SVG strings

interface ModalProps {
    data: PolygonType | undefined,
    modalRef: React.RefObject<SwipeModalPublicMethods | null>,
    setData: (data?: PolygonType) => void,
    saveData: any
}

// Helper function to pad numbers with leading zeros
const pad = (n: number) => n.toString().padStart(2, '0');

// Placeholder for weather interpretation (original logic preserved)
const getWeatherXml = (data: any) => {
    if (data.sky <= 0.1) {
        if (data.rain <= 0.1) {
            return svgFiles['sunny']
        } else {
            return svgFiles['sunshower']
        }

    } else if (data.sky <= 0.3) {
        if (data.snow <= 0.1) {
            if (data.rain <= 0.1) {
                return svgFiles['partlycloudy']
            } else if (data.rain <= 0.3) {
                return svgFiles['partlycloudyshower']
            } else {
                return svgFiles['partlycloudyrainy']
            }
        } else {
            return svgFiles['partlycloudysnowy']
        }
    } else {
        if (data.snow <= 0.1) {
            if (data.rain <= 0.1) {
                return svgFiles['cloudy']
            } else if (data.rain <= 0.3) {
                return svgFiles['cloudyshower']
            } else {
                return svgFiles['cloudyrainy']
            }
        } else {
            return svgFiles['cloudysnowy']
        }
    }
}

async function retryPromiseAll<T>(promiseFactories: Function[], maxRetries = 5): Promise<{ status: 'fulfilled' | 'rejected', value?: T, reason?: any }[]> {
            const totalPromises = promiseFactories.length;
            const results = Array(totalPromises).fill(null); // To store final results
            let currentPromises = promiseFactories.map((factory, index) => ({
                promise: factory(), // Execute the factory to get the promise
                originalIndex: index,
                attempt: 1
            }));

            for (let retryCount = 0; retryCount <= maxRetries; retryCount++) {
                if (currentPromises.length === 0) {
                    break; // All promises have resolved
                }

                console.log(`Attempt ${retryCount + 1}/${maxRetries + 1}: Processing ${currentPromises.length} promises.`);

                const settledPromises = await Promise.allSettled(
                    currentPromises.map(p => p.promise)
                );

                const nextPromisesToRetry: typeof currentPromises = [];

                settledPromises.forEach((settledResult, i) => {
                    const originalPromiseInfo = currentPromises[i];
                    const originalIndex = originalPromiseInfo.originalIndex;

                    if (settledResult.status === 'fulfilled') {
                        results[originalIndex] = { status: 'fulfilled', value: settledResult.value };
                    } else {
                        // If failed and retries are left, add to next batch
                        if (retryCount < maxRetries) {
                            console.log(`Retrying original request ${originalIndex + 1} (attempt ${originalPromiseInfo.attempt + 1})`);
                            nextPromisesToRetry.push({
                                promise: promiseFactories[originalIndex](), // Create a new promise for retry
                                originalIndex: originalIndex,
                                attempt: originalPromiseInfo.attempt + 1
                            });
                            results[originalIndex] = { status: 'pending', reason: settledResult.reason }; // Mark as pending for UI
                        } else {
                            // No more retries, mark as rejected
                            results[originalIndex] = { status: 'rejected', reason: settledResult.reason };
                        }
                    }
                });

                // Update UI after each attempt

                currentPromises = nextPromisesToRetry; // Set promises for the next retry round
            }

            // Ensure all promises have a final status
            for (let i = 0; i < totalPromises; i++) {
                if (results[i] === null) {
                    // This case should ideally not happen if logic is correct, but as a fallback
                    results[i] = { status: 'rejected', reason: 'Unknown error or not processed' };
                } else if (results[i].status === 'pending') {
                     // If still pending after all retries, it means it failed all attempts
                     results[i].status = 'rejected';
                }
            }
            return results;
        }

// Precipitation type codes (original data preserved)
const ptyCodesVeryShort: Record<string, string> = {
    "0": "없음", // None
    "1": "비", // Rain
    "2": "비/눈", // Rain/Snow
    "3": "눈", // Snow
    "4": "소나기", // Shower
    "5": "빗방울", // Drizzle
    "6": "빗방울눈날림", // Drizzle/Snow flurry
    "7": "눈날림" // Snow flurry
};

// Define the color palette (consistent with previous designs)
const colors = {
    primaryGreen: 'rgba(23, 190, 126, 1)',
    darkGreen: 'rgba(6, 172, 108, 1)',
    white: '#FFFFFF',
    lightGray: '#F0F4F8',
    darkGray: '#4B5563',
    textBlack: '#1F2937',
    borderColor: '#D1D5DB',
    timelineFill: 'rgba(23, 190, 126, 0.6)',
    timelineGrid: '#E5E7EB',
    modalBackground: '#2E3B4E', // A dark blue-gray for modal background
    cardBackground: '#3A4C62', // Slightly lighter dark for cards
    activeTabBackground: 'rgba(6, 172, 108, 0.8)', // Dark green with some transparency
    inactiveTabBackground: 'rgba(75, 85, 99, 0.5)', // Dark gray with some transparency
    activeTabText: '#FFFFFF',
    inactiveTabText: '#E0E0E0',
    weatherIconColor: '#FDD835', // Yellow for sun/moon, adjust as needed
};

const PlotModal: FC<ModalProps> = ({ modalRef, data, setData, saveData }) => {
    const [address, setAddress] = useState('');
    const [weather, setWeather] = useState<any>();
    const [selectedDate, setSelectedDate] = useState<string>();
    const [edits, setEdits] = useState<Record<string, any>>({});
    const [condensed, setCondensed] = useState<any[]>();
    const insets = useSafeAreaInsets();

    const [sidePanelOpen, setSidePanelOpen] = useState(false);

    // Animation value for the side panel
    const left = useSharedValue(10000); // Start off-screen to the right
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
        if (modalWidth === 0) return; // Wait for modalWidth to be calculated
        left.value = sidePanelOpen
            ? withTiming(0, { duration: 300 }) // Slide in from right
            : withTiming(modalWidth, { duration: 300 }); // Slide out to right
    }, [sidePanelOpen, modalWidth]);

    useEffect(() => {
        setEdits(!data ? { title: '' } : { title: data?.title });
        if (!data) return;

        const fetchData = async () => {
            try {
                const nearest = findClosestPoint([data.center.lng, data.center.lat]);
                const m_nearest = findMidtermClosestPoint([data.center.lng, data.center.lat]);
                const addr: string = (nearest.properties['1단계'] + ' ' + nearest.properties['2단계'] + ' ' + nearest.properties['3단계']);
                setAddress(addr);
                const X = nearest.properties['격자 X'];
                const Y = nearest.properties['격자 Y'];
                const m_code = m_nearest.properties['regId'];

                const results = await retryPromiseAll<{[key:string]:any}>([
                    () => getCurrentWeather(X, Y),
                    () => getUltraShortTermForecast(X, Y),
                    () => getShortTermForecast(X, Y),
                    () => getMediumTermRainForecast(m_code),
                    () => getMediumTermTemperatureForecast(m_code)
                ]);

                const currentWeather = results[0].value;
                const ultraShortWeatherForecasts = results[1].value;
                const weatherForecasts = results[2].value;
                const midRain = results[3].value;
                const midTemp = results[4].value;

                // Merge medium-term forecasts
                if (midRain && midTemp) {
                    Object.entries(midRain).forEach(([date, value]) => {
                        if (!weatherForecasts![date]) weatherForecasts![date] = { ...value, ...midTemp[date], mid: true };
                        else weatherForecasts![date] = { ...weatherForecasts![date], ...value, ...midTemp[date], mid: true };
                    });
                }

                // Merge ultra-short term forecasts
                if (ultraShortWeatherForecasts) {
                    Object.entries(ultraShortWeatherForecasts).forEach(([date, timevalue]) => {
                        Object.entries(timevalue).forEach(([time, value]) => {
                            const orig = weatherForecasts![date]?.[time] || {}; // Handle undefined
                            // @ts-ignore
                            const val = { ...value, TMP: value['T1H'], PCP: value['RN1'] };
                            // @ts-ignore
                            if (!weatherForecasts[date]) weatherForecasts[date] = {};
                            // @ts-ignore
                            weatherForecasts[date][time] = { ...orig, ...val };
                        });
                    });
                }

                // Merge current weather
                if (currentWeather) {
                    Object.entries(currentWeather).forEach(([date, timevalue]) => {
                        Object.entries(timevalue).forEach(([time, value]) => {
                            const orig = weatherForecasts![date]?.[time] || {}; // Handle undefined
                            // @ts-ignore
                            const val = { ...value, TMP: value['T1H'], PCP: value['RN1'] };
                            // @ts-ignore
                            if (!weatherForecasts[date]) weatherForecasts[date] = {};
                            // @ts-ignore
                            weatherForecasts[date][time] = { ...orig, ...val };
                        });
                    });
                }
                setWeather(weatherForecasts);
                let condensedData: any = [];
                if (weatherForecasts) {
                    Object.entries(weatherForecasts).forEach(([date, val]) => {
                        if (val.mid) {
                            const d = new Date(
                                Number(date.substring(0, 4)),
                                Number(date.substring(4, 6)) - 1,
                                Number(date.substring(6, 8))
                            );
                            const yyyymmdd = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
                            if (val.whole) {
                                condensedData.push({ yyyymmdd, date: d, ...val, high: val.max, low: val.min });
                            } else {
                                condensedData.push({ yyyymmdd, date: d, mid: true, high: val.max, low: val.min, am: val.am, pm: val.pm });
                            }
                            return;
                        }
                        const obj: any = Object.entries(val).reduce((acc: any, [time, curr]: [string, any]) => {
                            if (time < "1200") {
                                acc.am.count++;
                                if (curr['SKY']) {
                                    if (curr['SKY'] == 3) acc.am.cloudyCount += 1;
                                    else if (curr['SKY'] == 4) acc.am.cloudyCount += 0.5;
                                }
                                if (curr['PTY']) {
                                    if (curr['PTY'] == 1) acc.am.rainyCount += 1;
                                    else if (curr['PTY'] == 2) { acc.am.rainyCount += 1; acc.am.snowyCount += 1; }
                                    else if (curr['PTY'] == 3) acc.am.snowyCount += 1;
                                    else if (curr['PTY'] == 4) acc.am.rainyCount += 1;
                                    else if (curr['PTY'] == 5) acc.am.rainyCount += 0.75;
                                    else if (curr['PTY'] == 6) { acc.am.rainyCount += 0.5; acc.am.snowyCount += 0.5; }
                                    else if (curr['PTY'] == 7) acc.am.snowyCount += 0.5;
                                }
                            } else {
                                acc.pm.count++;
                                if (curr['SKY']) {
                                    if (curr['SKY'] == 3) acc.pm.cloudyCount += 1;
                                    else if (curr['SKY'] == 4) acc.pm.cloudyCount += 0.5;
                                }
                                if (curr['PTY']) {
                                    if (curr['PTY'] == 1) acc.pm.rainyCount += 1;
                                    else if (curr['PTY'] == 2) { acc.pm.rainyCount += 1; acc.pm.snowyCount += 1; }
                                    else if (curr['PTY'] == 3) acc.pm.snowyCount += 1;
                                    else if (curr['PTY'] == 4) acc.pm.rainyCount += 1;
                                    else if (curr['PTY'] == 5) acc.pm.rainyCount += 0.75;
                                    else if (curr['PTY'] == 6) { acc.pm.rainyCount += 0.5; acc.pm.snowyCount += 0.5; }
                                    else if (curr['PTY'] == 7) acc.pm.snowyCount += 0.5;
                                }
                            }
                            acc.high = acc.high > curr['TMP'] ? acc.high : curr['TMP'];
                            acc.low = acc.low < curr['TMP'] ? acc.low : curr['TMP'];
                            return acc;
                        }, { high: Number.NEGATIVE_INFINITY, low: Number.POSITIVE_INFINITY, am: { cloudyCount: 0, rainyCount: 0, snowyCount: 0, count: 0 }, pm: { cloudyCount: 0, rainyCount: 0, snowyCount: 0, count: 0 } });

                        obj.am.sky = obj.am.cloudyCount / (obj.am.count === 0 ? 1 : obj.am.count);
                        obj.pm.sky = obj.pm.cloudyCount / (obj.pm.count === 0 ? 1 : obj.pm.count);
                        obj.am.snow = obj.am.snowyCount / (obj.am.count === 0 ? 1 : obj.am.count);
                        obj.pm.snow = obj.pm.snowyCount / (obj.pm.count === 0 ? 1 : obj.pm.count);
                        obj.am.rain = obj.am.rainyCount / (obj.am.count === 0 ? 1 : obj.am.count);
                        obj.pm.rain = obj.pm.rainyCount / (obj.pm.count === 0 ? 1 : obj.pm.count);

                        obj.date = new Date(
                            Number(date.substring(0, 4)),
                            Number(date.substring(4, 6)) - 1,
                            Number(date.substring(6, 8))
                        );
                        const yyyymmdd = `${obj.date.getFullYear()}${pad(obj.date.getMonth() + 1)}${pad(obj.date.getDate())}`;
                        obj.yyyymmdd = yyyymmdd;
                        condensedData.push(obj);
                    });
                }
                setCondensed(condensedData.sort((a:any, b:any) => a.date.getTime() - b.date.getTime())); // Sort by date
            } catch (err) {
                console.error("Failed to fetch weather data:", err);
                // Handle error state if needed
            }
        };

        fetchData();
    }, [data]);

    const onFocus = () => { barWidth.value = withTiming('100%', { duration: 300 }) }
    const onBlur = () => { barWidth.value = withTiming('0%', { duration: 300 }) }

    const formatArea = (areaInSquareMeters: number | undefined) => {
        if (!areaInSquareMeters) return 'N/A';
        const areaInSquareKm = areaInSquareMeters / 1000000;
        const roundedArea = Math.round(areaInSquareKm);
        return `${roundedArea.toLocaleString()} sq km`;
    }

    return (
        <SwipeModal ref={modalRef} wrapInGestureHandlerRootView maxHeight={600} onHide={() => saveData(edits)} useKeyboardAvoidingView={false} style={styles.modalWrapper}>
            <View style={[styles.background, { paddingBottom: insets.bottom }]} onLayout={onModalLayout}>
                {/* Header for Farmland Name */}
                <View style={[styles.header, { backgroundColor: colors.darkGreen }]}>
                    <TextInput
                        style={styles.titleedit}
                        value={edits?.title}
                        onFocus={onFocus}
                        onBlur={onBlur}
                        onChangeText={(text) => { if (!data) return; setEdits({ ...edits, title: text }) }}
                        placeholder="Farmland Name"
                        placeholderTextColor={colors.white}
                    />
                    <Animated.View style={[styles.animbar, animatedBarStyle, { backgroundColor: colors.white }]} />
                </View>

                {/* Farmland Details */}
                <View style={styles.detailSection}>
                    <Text style={[styles.detailText, { color: colors.white }]}>
                        <Text style={styles.detailLabel}>Address:</Text> {address}
                    </Text>
                    <Text style={[styles.detailText, { color: colors.white }]}>
                        <Text style={styles.detailLabel}>Area:</Text> {formatArea(data?.area)}
                    </Text>
                </View>

                {/* Weather Forecast Section */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.white }]}>날씨 예보 (Weather Forecast)</Text>
                    {condensed && condensed.length > 0 ? (
                        <FlatList
                            data={condensed}
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            keyExtractor={(item: any) => item.yyyymmdd}
                            contentContainerStyle={styles.weatherListContent}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={[
                                        styles.weatherItem,
                                        {
                                            backgroundColor: item.yyyymmdd === selectedDate && !item.mid ? colors.activeTabBackground : colors.cardBackground,
                                            borderColor: colors.borderColor,
                                        }
                                    ]}
                                    onPress={() => {
                                        if (item.mid) return; // Disable press for medium-term forecasts if no hourly data
                                        setSelectedDate(item.yyyymmdd);
                                        setSidePanelOpen(true);
                                    }}
                                >
                                    <Text style={[styles.weatherDate, { color: colors.white }]}>
                                        {item.date.getMonth() + 1}/{item.date.getDate()}
                                    </Text>
                                    <View style={styles.weatherIconRow}>
                                        {!item.whole ? (
                                            <>
                                                <SvgCss xml={getWeatherXml(item.am)} width={30} height={30} fill={colors.weatherIconColor} />
                                                <SvgCss xml={getWeatherXml(item.pm)} width={30} height={30} fill={colors.weatherIconColor} />
                                            </>
                                        ) : (
                                            <SvgCss xml={getWeatherXml(item)} width={40} height={40} fill={colors.weatherIconColor} />
                                        )}
                                    </View>
                                    <Text style={[styles.weatherTemp, { color: colors.white }]}>
                                        {item.low}°C | {item.high}°C
                                    </Text>
                                    {item.mid ? (
                                        <Text style={[styles.weatherPrecip, { color: colors.white }]}>
                                            {item.whole ? `${item.precipitation}%` : `${item.am.precipitation}% / ${item.pm.precipitation}%`}
                                        </Text>
                                    ) : null}
                                </TouchableOpacity>
                            )}
                        />
                    ) : (
                        <View style={styles.noDataContainer}>
                            <Text style={[styles.noDataText, { color: colors.darkGray }]}>No weather forecast available.</Text>
                        </View>
                    )}
                </View>


                {/* Cultivated Crops Section */}
                <View style={[styles.section, { flex: 1 }]}>
                    <Text style={[styles.sectionTitle, { color: colors.white }]}>재배 작물 (Cultivated Crops)</Text>
                    {/* The Screen component (CropSearchScreen) will be rendered here */}
                    <Screen />
                </View>
            </View>

            {/* Side Panel for Hourly Weather Details */}
            <Animated.View style={[styles.sideview, animatedStyle, { backgroundColor: colors.modalBackground, paddingTop: insets.top }]}>
                <TouchableOpacity
                    style={[styles.closeButton, { backgroundColor: colors.darkGreen }]}
                    onPress={() => setSidePanelOpen(false)}
                >
                    <Text style={[styles.closeButtonText, { color: colors.white }]}>닫기 (Close)</Text>
                </TouchableOpacity>
                <Text style={[styles.sidePanelTitle, { color: colors.white }]}>
                    {selectedDate ? new Date(Number(selectedDate.substring(0, 4)), Number(selectedDate.substring(4, 6)) - 1, Number(selectedDate.substring(6, 8))).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }) : 'Hourly Details'}
                </Text>

                <ScrollView contentContainerStyle={styles.hourlyListContainer}>
                    <View style={styles.hourlyTableHeader}>
                        <Text style={[styles.hourlyTableCell, styles.hourlyTableHeaderText, { flex: 0.8, color: colors.white }]}>Time</Text>
                        <Text style={[styles.hourlyTableCell, styles.hourlyTableHeaderText, { color: colors.white }]}>Temp (°C)</Text>
                        <Text style={[styles.hourlyTableCell, styles.hourlyTableHeaderText, { color: colors.white }]}>Sky</Text>
                        <Text style={[styles.hourlyTableCell, styles.hourlyTableHeaderText, { color: colors.white }]}>Precip (%)</Text>
                        <Text style={[styles.hourlyTableCell, styles.hourlyTableHeaderText, { color: colors.white }]}>Type</Text>
                        <Text style={[styles.hourlyTableCell, styles.hourlyTableHeaderText, { color: colors.white }]}>Amount</Text>
                        <Text style={[styles.hourlyTableCell, styles.hourlyTableHeaderText, { color: colors.white }]}>Humidity (%)</Text>
                        <Text style={[styles.hourlyTableCell, styles.hourlyTableHeaderText, { color: colors.white }]}>Wind Speed (m/s)</Text>
                        <Text style={[styles.hourlyTableCell, styles.hourlyTableHeaderText, { color: colors.white }]}>Wind Dir (°)</Text>
                    </View>
                    {selectedDate && weather && weather[selectedDate] ? (
                        Object.entries(weather[selectedDate])
                            .filter(([key, val]) => typeof val === 'object' && val !== null) // Filter out non-object properties like 'mid'
                            .sort(([keyA], [keyB]) => keyA.localeCompare(keyB)) // Sort by time
                            .map(([key, val]: [string, any]) => (
                                <View key={key} style={styles.hourlyTableRow}>
                                    <Text style={[styles.hourlyTableCell, { flex: 0.8, color: colors.white }]}>{key.substring(0, 2)}:00</Text>
                                    <Text style={[styles.hourlyTableCell, { color: colors.white }]}>{val.TMP}°</Text>
                                    <Text style={[styles.hourlyTableCell, { color: colors.white }]}>{val.SKY == 1 ? '맑음' : val.SKY == 3 ? '구름많음' : '흐림'}</Text>
                                    <Text style={[styles.hourlyTableCell, { color: colors.white }]}>{val.POP}%</Text>
                                    <Text style={[styles.hourlyTableCell, { color: colors.white }]}>{ptyCodesVeryShort[val.PTY]}</Text>
                                    <Text style={[styles.hourlyTableCell, { color: colors.white }]}>{val.PCP}</Text>
                                    <Text style={[styles.hourlyTableCell, { color: colors.white }]}>{val.REH}%</Text>
                                    <Text style={[styles.hourlyTableCell, { color: colors.white }]}>{val.WSD}</Text>
                                    <Text style={[styles.hourlyTableCell, { color: colors.white }]}>{val.VEC}°</Text>
                                </View>
                            ))
                    ) : (
                        <View style={styles.noDataContainer}>
                            <Text style={[styles.noDataText, { color: colors.darkGray }]}>No hourly data for this date.</Text>
                        </View>
                    )}
                </ScrollView>
            </Animated.View>
        </SwipeModal>
    );
};

const styles = StyleSheet.create({
    modalWrapper: {
        // This style is for the SwipeModal itself, often used for positioning or background
    },
    background: {
        flex: 1,
        backgroundColor: colors.modalBackground, // Dark background for the modal content
        borderRadius: 12, // Rounded corners for the modal
        overflow: 'hidden', // Clip content to rounded corners
    },
    header: {
        height: 60, // Increased height for better visual
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 20,
        borderTopLeftRadius: 12, // Match modal border radius
        borderTopRightRadius: 12,
        marginBottom: 10,
        shadowColor: '#000', // Subtle shadow for header
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 5,
    },
    titleedit: {
        color: colors.white,
        fontSize: 22, // Larger font size for title
        fontWeight: 'bold',
        width: '100%',
        textAlign: 'center',
        paddingVertical: 8,
    },
    animbar: {
        height: 3, // Thicker animated bar
        position: 'absolute',
        bottom: 0,
        left: 0,
    },
    detailSection: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        marginBottom: 10,
    },
    detailText: {
        fontSize: 16,
        marginBottom: 5,
    },
    detailLabel: {
        fontWeight: 'bold',
    },
    section: {
        backgroundColor: colors.cardBackground, // Darker card background
        borderRadius: 10,
        marginHorizontal: 15,
        marginBottom: 15,
        padding: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 3,
        elevation: 4,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
        textAlign: 'center',
    },
    weatherListContent: {
        paddingVertical: 5,
    },
    weatherItem: {
        width: 100, // Fixed width for each weather card
        height: 120, // Fixed height
        marginRight: 10,
        borderRadius: 10,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 3,
    },
    weatherDate: {
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 5,
    },
    weatherIconRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 5,
    },
    weatherTemp: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 3,
    },
    weatherPrecip: {
        fontSize: 12,
        opacity: 0.8,
    },
    noDataContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 20,
    },
    noDataText: {
        fontSize: 14,
        fontStyle: 'italic',
    },
    sideview: {
        position: 'absolute',
        width: '100%',
        height: '100%',
        top: 0,
        // 'left' is animated
        backgroundColor: colors.modalBackground, // Consistent dark background
        zIndex: 10,
        borderTopLeftRadius: 12,
        borderBottomLeftRadius: 12,
        shadowColor: '#000',
        shadowOpacity: 0.3,
        shadowOffset: { width: -4, height: 0 },
        shadowRadius: 10,
        paddingHorizontal: 15, // Padding for content
    },
    closeButton: {
        position: 'absolute',
        top: 20, // Adjusted top for SafeAreaInsets
        right: 15,
        paddingVertical: 8,
        paddingHorizontal: 15,
        borderRadius: 20,
        zIndex: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
        elevation: 4,
    },
    closeButtonText: {
        color: colors.white,
        fontWeight: 'bold',
        fontSize: 14,
    },
    sidePanelTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        textAlign: 'center',
        marginTop: 60, // Space below close button
        marginBottom: 20,
    },
    hourlyListContainer: {
        flexGrow: 1,
        paddingBottom: 20, // Ensure space at bottom
    },
    hourlyTableHeader: {
        flexDirection: 'row',
        backgroundColor: colors.darkGreen, // Header background
        paddingVertical: 10,
        borderRadius: 8,
        marginBottom: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 3,
    },
    hourlyTableHeaderText: {
        fontWeight: 'bold',
        fontSize: 12,
        textAlign: 'center',
    },
    hourlyTableRow: {
        flexDirection: 'row',
        backgroundColor: colors.cardBackground, // Row background
        paddingVertical: 10,
        borderRadius: 8,
        marginBottom: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 1.5,
        elevation: 2,
    },
    hourlyTableCell: {
        flex: 1, // Distribute columns evenly
        fontSize: 12,
        textAlign: 'center',
        paddingHorizontal: 2,
    },
});
export default PlotModal