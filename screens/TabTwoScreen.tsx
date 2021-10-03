import * as Location from 'expo-location';
import React, { useEffect, useState } from 'react';
import { Image, ScrollView, StyleSheet } from 'react-native';
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

type GridData = {
  office: string;
  gridX: number;
  gridY: number;
};

type CurrentWeather = {
  properties: {
    temperature: {
      value: number;
    };
    windChill: {
      value: number;
    };
    heatIndex: {
      value: number;
    };
    textDescription: string;
    icon: string;
  };
};

type HourlyForecast = {
  properties: {
    periods: {
      temperature: number;
      startTime: string;
    }[];
  }
};

type StationData = {
  properties: {
    stationIdentifier: string;
    name: string;
  }
}

type TempAtTimeData = {
  x: Date;
  y: number;
}[];

export default function TabTwoScreen() {
  const NUM_HOURS = 24;
  const [gridData, setGridData] = useState<GridData | null>(null);
  const [currentWeather, setCurrentWeather] = useState<CurrentWeather | null>(null);
  const [hourlyForecast, setHourlyForecast] = useState<HourlyForecast | null>(null);
  const [stationData, setStationData] = useState<StationData | null>(null);
  const [tempAtTimeData, setTempAtTimeData] = useState<TempAtTimeData | null>(null);

  useEffect(() => {
    (async () => {
      // TODO: Move location request into reusable component
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        // TODO: Prompt user to input a location
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords
      fetch(`https://api.weather.gov/points/${latitude},${longitude}`)
        .then(res => res.json())
        .then(json => {
          console.log('json: ', json);
          const gridData = {
            office: json.properties.gridId,
            gridX: json.properties.gridX,
            gridY: json.properties.gridY
          }
          setGridData(gridData);
        });

      fetch(`https://api.weather.gov/points/${latitude},${longitude}/stations`)
        .then(res => res.json())
        .then(stationData => {
          console.log('station data: ', stationData);
          setStationData(stationData.features[0]);
        });
    })();
  }, []);

  useEffect(() => {
    if (stationData) {
      fetch(`https://api.weather.gov/stations/${stationData.properties.stationIdentifier}/observations/latest`)
        .then(res => res.json())
        .then(currentWeather => {
          console.log('current weather: ', currentWeather);
          setCurrentWeather(currentWeather);
        });
    }
  }, [stationData])

  useEffect(() => {
    if (gridData) {
      const { office, gridX, gridY } = gridData;

      fetch(`https://api.weather.gov/gridpoints/${office}/${gridX},${gridY}/forecast/hourly`, {
        headers: new Headers({
          'User-Agent': '(myweatherapp.com, contact@myweatherapp.com)' // TODO: Use real site/email
        })
      })
        .then(res => res.json())
        .then(hourlyForecast => {
          console.log('hourlyForecast: ', hourlyForecast);
          setHourlyForecast(hourlyForecast);
        });
    }
  }, [gridData]);

  useEffect(() => {
    if (hourlyForecast) {
      setTempAtTimeData(hourlyForecast.properties.periods.splice(0, NUM_HOURS).map((hourData, i) => {
        const dateTime = new Date(hourData.startTime);
        const temp = hourData.temperature;
        return { x: dateTime, y: temp };
      }));
    }
  }, [hourlyForecast])

  if (currentWeather && hourlyForecast && stationData) {
    const feelsLikeTemp = () => {
      const { temperature, windChill, heatIndex } = currentWeather.properties;
      return Math.round(temperature.value - windChill.value + heatIndex.value);
    }
    return (
      <View style={styles.container}>
        <ScrollView style={styles.scrollContainer}>
          <Image
            style={styles.weatherIcon}
            source={{ uri: currentWeather.properties.icon }}
          />
          <Text style={styles.title}>{`${currentWeather.properties.textDescription}, feels like ${feelsLikeTemp()}\u00b0 C`}</Text>
          <View style={styles.separator} lightColor="#eee" darkColor="rgba(255,255,255,0.1)" />

          {/* TODO: Use Google Maps geolocation to turn the lat/lng into a city name */}
          <Text style={styles.title}>{stationData.properties.name}</Text>
          <Text style={styles.title}>{`${currentWeather.properties.temperature.value}\u00b0 C`}</Text>
          <View style={styles.separator} lightColor="#eee" darkColor="rgba(255,255,255,0.1)" />

          <VictoryChart
            theme={VictoryTheme.material}
            padding={{ left: 50, top: 20, right: 30, bottom: 35 }}
          >
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

          <EditScreenInfo path="/screens/TabTwoScreen.tsx" />
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
