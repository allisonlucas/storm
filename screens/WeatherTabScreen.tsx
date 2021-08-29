import React, { useEffect, useState } from 'react';
import { StyleSheet, Image, Dimensions, ScrollView } from 'react-native';
import * as Location from 'expo-location';
import { LineChart } from 'react-native-chart-kit';

import EditScreenInfo from '../components/EditScreenInfo';
import { Text, View } from '../components/Themed';
import { OPEN_WEATHER_MAP_API_KEY } from '../utils/apiKeys';

type OpenWeatherOneCallData = {
  current: Object;
  hourly: [
    {
      dt: number;
      temp: number;
    }
  ]
};

export default function WeatherTabScreen() {
  const [weatherData, setWeatherData] = useState<OpenWeatherOneCallData | null>(null);

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

  if (weatherData) {
    const hoursLeftToday = 24 - new Date(weatherData.hourly[0].dt * 1000).getHours();
    const hourLabels = weatherData.hourly.map(hourData => new Date(hourData.dt * 1000).getHours().toString()).splice(0, hoursLeftToday);
    const hourlyTempData = weatherData.hourly.map(hourData => Math.round(hourData.temp)).splice(0, hoursLeftToday);

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
          <Text style={styles.title}>{`${weatherData.current?.temp}\u00b0 F`}</Text>
          <View style={styles.separator} lightColor="#eee" darkColor="rgba(255,255,255,0.1)" />

          <LineChart
            data={{
              labels: hourLabels,
              datasets: [
                {
                  data: hourlyTempData,
                },
              ],
            }}
            width={Dimensions.get('window').width - 20}
            height={220}
            yAxisSuffix={`\u00b0`}
            chartConfig={{
              backgroundColor: '#1cc910',
              backgroundGradientFrom: '#eff3ff',
              backgroundGradientTo: '#efefef',
              decimalPlaces: 0, // optional, defaults to 2dp
              color: (opacity = 255) => `rgba(0, 0, 0, ${opacity})`,
              style: {
                borderRadius: 16,
              },
            }}
            style={{
              marginVertical: 8,
              borderRadius: 16,
            }}
          />

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