import React, { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
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

  return (
    <View style={styles.container}>
      {/* TODO: Use Google Maps geolocation to turn the lat/lng into a city name */}
      <Text style={styles.title}>{weatherData?.timezone ? weatherData?.timezone : null}</Text>
      <Text style={styles.title}>{weatherData?.current?.temp ? `${weatherData?.current?.temp}\u00b0 F` : 'Loading...'}</Text>
      <View style={styles.separator} lightColor="#eee" darkColor="rgba(255,255,255,0.1)" />
      <EditScreenInfo path="/screens/WeatherTabScreen.tsx" />
    </View>
  );
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
});