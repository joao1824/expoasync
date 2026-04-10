import { useState, useEffect } from "react";
import { FlatList, StyleSheet, View } from "react-native";
import {
  Appbar,
  Button,
  List,
  PaperProvider,
  Switch,
  Text,
  MD3LightTheme as DefaultTheme,
} from "react-native-paper";

import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import * as SQLite from "expo-sqlite";

import myColors from "./assets/colors.json";
import myColorsDark from "./assets/colorsDark.json";

const db = SQLite.openDatabaseSync("locations.db");

export default function App() {
  const [isSwitchOn, setIsSwitchOn] = useState(false); // variável para controle do darkMode
  const [isLoading, setIsLoading] = useState(false); // variável para controle do loading do button
  const [locations, setLocations] = useState([]); // variável para armazenar as localizações

  // Carrega tema default da lib RN PAPER com customização das cores. Para customizar o tema, veja:
  // https://callstack.github.io/react-native-paper/docs/guides/theming/#creating-dynamic-theme-colors
  const [theme, setTheme] = useState({
    ...DefaultTheme,
    myOwnProperty: true,
    colors: myColors.colors,
  });

  useEffect(() => {
    async function createTable() {
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS locations (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          latitude REAL,
          longitude REAL
        );
      `);
    }

    createTable();
  }, []);

  // load darkMode from AsyncStorage
  async function loadDarkMode() {
    const value = await AsyncStorage.getItem("darkMode");
    if (value !== null) {
      setIsSwitchOn(JSON.parse(value));
    }
  }

  // darkMode switch event
  async function onToggleSwitch() {
    const newValue = !isSwitchOn;
    setIsSwitchOn(newValue);
    await AsyncStorage.setItem("darkMode", JSON.stringify(newValue));
  }

  // get location (bottao capturar localização)
  async function getLocation() {
    setIsLoading(true);

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const coords = location.coords;

      await db.runAsync(
        "INSERT INTO locations (latitude, longitude) values (?, ?)",
        [coords.latitude, coords.longitude]
      );

      await loadLocations();
    } catch (error) {
      console.log(error);
    } finally {
      setIsLoading(false);
    }
  }

  // load locations from db sqlite - faz a leitura das localizações salvas no banco de dados
  async function loadLocations() {
    setIsLoading(true);

    try {
      const result = await db.getAllAsync("SELECT * FROM locations");
      setLocations(result);
    } catch (error) {
      console.log(error);
    } finally {
      setIsLoading(false);
    }
  }

  // Use Effect para carregar o darkMode e as localizações salvas no banco de dados
  // É executado apenas uma vez, quando o componente é montado
  useEffect(() => {
    loadDarkMode();
    loadLocations();
  }, []);

  // Efetiva a alteração do tema dark/light quando a variável isSwitchOn é alterada
  // É executado sempre que a variável isSwitchOn é alterada
  useEffect(() => {
    if (isSwitchOn) {
      setTheme({ ...theme, colors: myColorsDark.colors });
    } else {
      setTheme({ ...theme, colors: myColors.colors });
    }
  }, [isSwitchOn]);

  return (
    <PaperProvider theme={theme}>
      <Appbar.Header>
        <Appbar.Content title="My Location BASE" />
      </Appbar.Header>
      <View style={{ backgroundColor: theme.colors.background, flex: 1 }}>
        <View style={styles.containerDarkMode}>
          <Text>Dark Mode</Text>
          <Switch value={isSwitchOn} onValueChange={onToggleSwitch} />
        </View>
        <Button
          style={styles.containerButton}
          icon="map"
          mode="contained"
          loading={isLoading}
          onPress={() => getLocation()}
        >
          Capturar localização
        </Button>

        <FlatList
          style={styles.containerList}
          data={locations}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <List.Item
              title={`Localização ${item.id}`}
              description={`Latitude: ${item.latitude} | Longitude: ${item.longitude}`}
            ></List.Item>
          )}
        ></FlatList>
      </View>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  containerDarkMode: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 16,
  },
  containerButton: {
    margin: 16,
  },
  containerList: {
    margin: 16,
  },
});