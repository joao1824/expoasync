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
import myColors from "./assets/colors.json";
import myColorsDark from "./assets/colorsDark.json";
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SQLite from 'expo-sqlite';

export default function App() {
  const [isSwitchOn, setIsSwitchOn] = useState(false); // variável para controle do darkMode
  const [isLoading, setIsLoading] = useState(false); // variável para controle do loading do button
  const [locations, setLocations] = useState([]); // variável para armazenar as localizações
  const DATABASE= "locations.sqlite";
  const db = SQLite.openDatabaseSync(DATABASE);

  // Inicializar banco de dados
  const initDatabase = () => {
    try {
      db.execSync("CREATE TABLE IF NOT EXISTS locations (id INTEGER PRIMARY KEY AUTOINCREMENT, latitude REAL, longitude REAL);");
      console.log("Tabela criada/verificada com sucesso");
    } catch (error) {
      console.error("Erro ao criar tabela:", error);
    }
  };

  const saveData_location = async (value) => {
  try {
    await AsyncStorage.setItem('chave', value);
    console.log('Localização salva com sucesso');
  } catch (e) {
    console.error('erro ao salvar', e);
  }
  };

  const getData_location = async () => {
    try {
      const value = await AsyncStorage.getItem('chave');
      if(value !== null) {
        console.log('Localização carregada com sucesso');
        return value;
      } else {
        console.log('Nenhuma localização salva');
        return null;
      }
    } catch(e) {
      console.error('erro ao carregar', e);
      return null;
    }
  }




  // Carrega tema default da lib RN PAPER com customização das cores. Para customizar o tema, veja:
  // https://callstack.github.io/react-native-paper/docs/guides/theming/#creating-dynamic-theme-colors
  const [theme, setTheme] = useState({
    ...DefaultTheme,
    myOwnProperty: true,
    colors: myColors.colors,
  });

  // load darkMode from AsyncStorage
  async function loadDarkMode() {}

  // darkMode switch event
  async function onToggleSwitch() {
    setIsSwitchOn(!isSwitchOn);
  }

  // get location (bottao capturar localização)
  async function getLocation() {
    setIsLoading(true);

    // Localização fake, substituir por localização real do dispositivo
    const coords = {
      latitude: -23.5505199,
      longitude: -46.6333094,
    };

    
    db.execSync("DROP TABLE IF EXISTS locations;");
    await loadLocations(); // Recarrega as localizações após inserir
    console.log("Localização capturada e salva no banco de dados:", coords);
    setIsLoading(false);
  }

  // load locations from db sqlite - faz a leitura das localizações salvas no banco de dados
  async function loadLocations() {
    setIsLoading(true);
    try {
      const result = db.getAllSync("SELECT * FROM locations;");
      console.log("Resultado bruto do SELECT:", result);
      console.log("Tipo do result:", typeof result);
      console.log("Comprimento do result:", result ? result.length : 'undefined');

      if (result && result.length > 0) {
        const locations = result.map(row => ({
          id: row.id,
          latitude: row.latitude,
          longitude: row.longitude,
        }));
        console.log("Localizações carregadas do banco de dados:", locations);
        setLocations(locations);
      } else {
        console.log("Nenhuma localização encontrada no banco ou resultado vazio");
        setLocations([]);
      }
    } catch (error) {
      console.error("Erro ao carregar localizações:", error);
      setLocations([]);
    }
    setIsLoading(false);
  }

  // Use Effect para carregar o darkMode e as localizações salvas no banco de dados
  // É executado apenas uma vez, quando o componente é montado
  useEffect(() => {
    initDatabase();
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
      <View style={{ backgroundColor: theme.colors.background }}>
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
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  containerDarkMode: {
    margin: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  containerButton: {
    margin: 10,
  },
  containerList: {
    margin: 10,
    height: "100%",
  },
});
