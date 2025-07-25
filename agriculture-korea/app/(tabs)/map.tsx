import { Text, View, SafeAreaView, TouchableOpacity } from "react-native";
import WebView from "react-native-webview";
import { useAssets } from 'expo-asset';
import {readAsStringAsync} from 'expo-file-system';
import { Dimensions } from 'react-native';
import { useState, useRef } from "react";
import AsyncStorage from '@react-native-async-storage/async-storage';
import PlotModal from "@/modals/PlotModal";
import { SwipeModalPublicMethods } from "@birdwingo/react-native-swipe-modal";
import { PolygonType } from "@/types";
import { getShortTermForecast } from "@/apis/useWeatherForecast";

const getPolygons = async () => {
  const polygons = await AsyncStorage.getItem('polygons');
  //console.log('Polygons found:', polygons);
  if (polygons) {
    //console.log('Polygons found:', polygons);
    return JSON.parse(polygons);
  }
  //console.log('No polygons found, returning empty array');
  return [];
}

const getPolygon = async (id:string) => {
  const polygons = await getPolygons() as any[];
  return polygons.find((item) => item.id === id);
}

const addPolygon = async (polygon: any) => {
  const polygons = await getPolygons();
  polygons.push(polygon);
  //console.log(polygons);
  await AsyncStorage.setItem('polygons', JSON.stringify(polygons));
}

const editPolygon = async (polygon: any) => {
  const polygons = await getPolygons();
  const index = polygons.findIndex((p: any) => p.id === polygon.id);
  //console.log(index, polygon);
  if (index !== -1) {
    polygons[index] = polygon;
    //console.log(polygon)
    await AsyncStorage.setItem('polygons', JSON.stringify(polygons));
  }
}

const removePolygon = async (polygon: any) => {
  const polygons = await getPolygons();
  const index = polygons.findIndex((p: any) => p.id === polygon.id);
  if (index !== -1) {
    polygons.splice(index, 1);
    await AsyncStorage.setItem('polygons', JSON.stringify(polygons));
  }
}

export default function Index() {
  const windowHeight = Dimensions.get('window').height;
  const width = Dimensions.get('window').width;
  const [selectedPlot, setSelectedPlot] = useState<PolygonType>();
  const [index, err] = useAssets(require('@/assets/map.html'));
  const webviewRef = useRef<WebView>(null); // Correctly typed ref for WebView
  const [html, setHtml] = useState<string | null>(null);
  const modalRef = useRef<SwipeModalPublicMethods>(null);
  const showModal = () => modalRef.current?.show(); // Call this function to show modal
  const hideModal = () => modalRef.current?.hide(); // Call this function to hide modal
  if (index && index[0].localUri) {
    readAsStringAsync(index[0].localUri).then((data) => {
        setHtml(data);
    });
  }

  const resetPolygon = async () => {
    await AsyncStorage.removeItem('polygons');
    const run = `
          (function () {
          try {
            const event = new CustomEvent('initpolygons', {detail: []});
            document.dispatchEvent(event);
          }
          catch (error) {
          const newDiv = document.createElement('div');
                              newDiv.style.position = 'absolute';
                              newDiv.style.top = '10px';
                              newDiv.style.left = '10px';
                              newDiv.style.background = 'rgba(255,255,255,0.8)';
                              newDiv.style.padding = '8px';
                              newDiv.style.borderRadius = '4px';
                              newDiv.style.zIndex = '10';
                              newDiv.style.minWidth = '200px';
                              newDiv.style.maxWidth = '400px';
                              newDiv.style.minHeight = '50px';
                              newDiv.textContent = error.message;
                              document.body.appendChild(newDiv);
  }
          })();
        `;
        //console.log('WebView is ready, injecting polygons', run);
        webviewRef.current?.injectJavaScript(run);
  }


  const saveData = (edits: any) => {
    editPolygon({...selectedPlot, ...edits});
  }
  const handleMessage = async (event: any) => {
    const {data, type} = JSON.parse(event.nativeEvent.data);
    //console.log('Received message from WebView:', data, type);
    if (type === 'polygon') {
      data.id = Math.random().toString(36).substr(2, 9);
      addPolygon(data).then(() => {
        //console.log('Polygon added:', data);
      }
      ).catch((error) => {
        //console.error('Error adding polygon:', error);
      }
      );
    } else if (type === 'ready') {
      const run = `
        (function () {
        try {
          const event = new CustomEvent('initpolygons', {detail: ${JSON.stringify(await getPolygons())}});
          document.dispatchEvent(event);
        }
        catch (error) {
         const newDiv = document.createElement('div');
                            newDiv.style.position = 'absolute';
                            newDiv.style.top = '10px';
                            newDiv.style.left = '10px';
                            newDiv.style.background = 'rgba(255,255,255,0.8)';
                            newDiv.style.padding = '8px';
                            newDiv.style.borderRadius = '4px';
                            newDiv.style.zIndex = '10';
                            newDiv.style.minWidth = '200px';
                            newDiv.style.maxWidth = '400px';
                            newDiv.style.minHeight = '50px';
                            newDiv.textContent = error.message;
                            document.body.appendChild(newDiv);
}
        })();
      `;
      //console.log('WebView is ready, injecting polygons', run);
      webviewRef.current?.injectJavaScript(run);
    } else if (type === 'polygon-click') {
      if ( !selectedPlot || selectedPlot && (data.id != selectedPlot.id)) {
        setSelectedPlot(await getPolygon(data.id) as PolygonType);
      }
      showModal();
    }
  }
  return (
    <View style={{flex:1}}>
      <WebView
        ref={webviewRef}
        originWhitelist={['*']}
        onMessage={handleMessage}
        javaScriptEnabled={true}
        source={{html: html || ''}}
        style={{ height: windowHeight, width: width }}
      />
      <PlotModal modalRef={modalRef} data={selectedPlot} setData={setSelectedPlot} saveData={saveData}/>
      </View>
  );
}
