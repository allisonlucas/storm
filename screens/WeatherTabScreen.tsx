import React, { useEffect, useState } from 'react';
import { StyleSheet, Image } from 'react-native';
import * as Location from 'expo-location';

import EditScreenInfo from '../components/EditScreenInfo';
import { Text, View } from '../components/Themed';
import { OPEN_WEATHER_MAP_API_KEY } from '../utils/apiKeys';

export default function WeatherTabScreen() {
  const [weatherData, setWeatherData] = useState(null);

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
    return (
      <View style={styles.container}>
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
        <EditScreenInfo path="/screens/WeatherTabScreen.tsx" />
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