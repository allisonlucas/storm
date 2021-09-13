import * as Location from 'expo-location';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Image, ScrollView } from 'react-native';
import {
  VictoryAxis,
  VictoryChart,
  VictoryGroup,
  VictoryLabel,
  VictoryLine,
  VictoryScatter,
  VictoryTheme,
} from "victory"; // TODO: Import from victory-native when vieiwing app on mobile

import EditScreenInfo from '../components/EditScreenInfo';
import { Text, View } from '../components/Themed';
import { OPEN_WEATHER_MAP_API_KEY } from '../utils/apiKeys';

type OpenWeatherOneCallData = {
  daily: {
    sunrise: number;
    sunset: number;
  }[];
  hourly: [
    {
      dt: number;
      temp: number;
    }
  ];
  current: {
    weather: {
      main: string;
      icon: number;
    }[];
    feels_like: number;
    temp: number;
  };
  timezone: string;
};

export default function WeatherTabScreen() {
  const NUM_HOURS = 24;
  const [weatherData, setWeatherData] = useState<OpenWeatherOneCallData | null>(null);
  const [tempAtTimeData, setTempAtTimeData] = useState<Array<{ x: Date, y: number }> | null>(null);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        // TODO: Prompt user to input a location
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords
      fetch(`https://api.openweathermap.org/data/2.5/onecall?lat=${latitude}&lon=${longitude}&exclude={part}&appid=${OPEN_WEATHER_MAP_API_KEY}&units=imperial`)
        .then(res => res.json())
        .then(json => {
          console.log('json: ', json);
          setWeatherData(json);
        });
    })();
  }, []);

  useEffect(() => {
    if (weatherData) {
      setTempAtTimeData(weatherData.hourly.map(hourData => {
        const dateTime = new Date(hourData.dt * 1000);
        const temp = Math.round(hourData.temp);
        return { x: dateTime, y: temp };
      }).splice(0, NUM_HOURS));
    }
  }, [weatherData])

  if (weatherData && tempAtTimeData) {
    const minTime = tempAtTimeData[0].x;
    const maxTime = tempAtTimeData[tempAtTimeData.length - 1].x;
    const tempArray = tempAtTimeData.map(d => d.y);
    const maxTemp = Math.max(...tempArray);

    const withinTimeBounds = (dateTime: Date) => {
      return (dateTime > minTime && dateTime < maxTime) ? true : false
    }

    const sunriseLine = () => {
      const sunriseDateTimeToday = new Date(weatherData.daily[0].sunrise * 1000);
      const sunriseDateTimeTom = new Date(weatherData.daily[1].sunrise * 1000);
      const label = (sunrise: Date) => `Sunrise\n${sunrise.getHours()}:${sunrise.getMinutes()}`
      if (withinTimeBounds(sunriseDateTimeToday)) {
        const data: { x: Date, y: number, label: null | string }[] = tempAtTimeData.map(d => { return { x: sunriseDateTimeToday, y: d.y, label: null } });
        data[tempArray.indexOf(maxTemp)].label = label(sunriseDateTimeToday);
        return (
          <VictoryLine
            data={data}
            labels={(d) => d.label}
            labelComponent={<VictoryLabel dy={-5} renderInPortal />}
          />
        );
      } else if (withinTimeBounds(sunriseDateTimeTom)) {
        const data: { x: Date, y: number, label: null | string }[] = tempAtTimeData.map(d => { return { x: sunriseDateTimeTom, y: d.y, label: null } });
        data[tempArray.indexOf(maxTemp)].label = label(sunriseDateTimeTom);
        return (
          <VictoryLine
            data={data}
            labels={(d) => d.label}
            labelComponent={<VictoryLabel dy={-5} renderInPortal />}
          />
        );
      }
    };

    const sunsetLine = () => {
      const sunsetDateTimeToday = new Date(weatherData.daily[0].sunset * 1000);
      const sunsetDateTimeTom = new Date(weatherData.daily[1].sunset * 1000);
      const label = (sunset: Date) => `Sunset\n${sunset.getHours()}:${sunset.getMinutes()}`
      if (withinTimeBounds(sunsetDateTimeToday)) {
        const data: { x: Date, y: number, label: null | string }[] = tempAtTimeData.map(d => { return { x: sunsetDateTimeToday, y: d.y, label: null } });
        data[tempArray.indexOf(maxTemp)].label = label(sunsetDateTimeToday);
        return (
          <VictoryLine
            data={data}
            labels={(d) => d.label}
            labelComponent={<VictoryLabel dy={-5} renderInPortal />}
          />
        );
      } else if (withinTimeBounds(sunsetDateTimeTom)) {
        const data: { x: Date, y: number, label: null | string }[] = tempAtTimeData.map(d => { return { x: sunsetDateTimeTom, y: d.y, label: null } });
        data[tempArray.indexOf(maxTemp)].label = label(sunsetDateTimeTom);
        return (
          <VictoryLine
            data={data}
            labels={(d) => d.label}
            labelComponent={<VictoryLabel dy={-5} renderInPortal />}
          />
        );
      }
    };

    return (
      <View style={styles.container}>
        <ScrollView style={styles.scrollContainer}>
          <Image
            style={styles.weatherIcon}
            source={{ uri: `http://openweathermap.org/img/wn/${weatherData.current.weather[0].icon}@2x.png` }}
          />
          <Text style={styles.title}>{`${weatherData.current.weather[0].main}, feels like ${weatherData.current.feels_like}\u00b0 F`}</Text>
          <View style={styles.separator} lightColor="#eee" darkColor="rgba(255,255,255,0.1)" />

          {/* TODO: Use Google Maps geolocation to turn the lat/lng into a city name */}
          <Text style={styles.title}>{weatherData.timezone}</Text>
          <Text style={styles.title}>{`${weatherData.current.temp}\u00b0 F`}</Text>
          <View style={styles.separator} lightColor="#eee" darkColor="rgba(255,255,255,0.1)" />

          <VictoryChart
            theme={VictoryTheme.material}
            padding={{ left: 50, top: 20, right: 30, bottom: 35 }}
          >
            {sunriseLine()}
            {sunsetLine()}
            {/* x-axis */}
            <VictoryAxis
              tickValues={tempAtTimeData.map(d => d.x)}
              tickFormat={t => t.getHours()}
              tickCount={NUM_HOURS / 2}
              scale={{ x: "time" }}
            />
            <VictoryGroup domainPadding={{ y: 20 }}>
              <VictoryGroup data={tempAtTimeData}>
                <VictoryLine />
                <VictoryScatter />
              </VictoryGroup>
              <VictoryLine data={tempAtTimeData.map(d => { return { x: d.x, y: 70 } })} />
              {/* y-axis */}
              <VictoryAxis
                dependentAxis
                tickCount={9}
                tickFormat={(t) => `${t}\u00b0F`}
              />
            </VictoryGroup>
          </VictoryChart>

          <View style={styles.separator} lightColor="#eee" darkColor="rgba(255,255,255,0.1)" />

          <EditScreenInfo path="/screens/WeatherTabScreen.tsx" />
        </ScrollView>
      </View>
    );
  }
  return <Text>Loading...</Text>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContainer: {
    marginHorizontal: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  separator: {
    marginVertical: 30,
    height: 1,
    width: '80%',
  },
  weatherIcon: {
    width: 50,
    height: 50,
  },
});