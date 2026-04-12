import { useState, useEffect, useMemo } from "react";
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
import openDB from "./db.jsx"
import * as Location from 'expo-location';

export default function App() {
  const [isSwitchOn, setIsSwitchOn] = useState(false); // variável para controle do darkMode
  const [isLoading, setIsLoading] = useState(false); // variável para controle do loading do button
  const [locations, setLocations] = useState(null); // variável para armazenar as localizações

  // Carrega tema default da lib RN PAPER com customização das cores. Para customizar o tema, veja:
  // https://callstack.github.io/react-native-paper/docs/guides/theming/#creating-dynamic-theme-colors
  const [theme, setTheme] = useState({
    ...DefaultTheme,
    myOwnProperty: true,
    colors: myColors.colors,
  });``

  const db_sql = useMemo(() => openDB(), []);





  //AsyncStorage

  //salvar
  const salvarTema = async (tema) => {
    try {
      const valor = tema.toString();
      await AsyncStorage.setItem("@TemaEscuro",valor);
      console.log("Tema escuro salvo com sucesso");
    } catch(e) {
      console.log("Erro ao salvar tema escuro");
    }
  }

  //tirar
  const getTema = async () => {
    try {
      const tema = await AsyncStorage.getItem("@TemaEscuro")
      if (tema !== null){
        return true;
      }
      return null; 
    } catch(e) {
        console.log("Erro ao pegar tema do storage");
    }
  }

  //remover
  const removerTemaEscuro = async () => {
    try{
      AsyncStorage.removeItem("@TemaEscuro");
      console.log("Tema escuro removido");
    } catch(e){
      console.log("Erro ao remover tema escuro ", e);
    }
  }




  // load darkMode from AsyncStorage
  async function loadDarkMode() {
    const valor = await getTema();
    if (valor !== null){
      setIsSwitchOn(!isSwitchOn);
    }
  }

  // darkMode switch event
  async function onToggleSwitch() {
    setIsSwitchOn(!isSwitchOn);
  }

  // get location (bottao capturar localização)
  async function getLocation() {
    setIsLoading(true);

    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied');
        return;
      }

      let location = await Location.getCurrentPositionAsync({});


      await db_sql.withTransactionAsync(async () => {
        await db_sql.runAsync(
          'INSERT INTO localizacao (latitude, longitude) VALUES (?, ?)',
          location.coords.latitude, location.coords.longitude
        );
      });

      await loadLocations(); 

    } catch (e) {
      console.log("ERRO REAL AQUI:", e); 
    } finally {
      setIsLoading(false); 
    }
  }

  // load locations from db sqlite - faz a leitura das localizações salvas no banco de dados
async function loadLocations() {
  setIsLoading(true);

  try {
    const lista = [
      {
        id: 1,
        latitude: -23.550519,
        longitude: -46.6333094,
      },
    ];

    const localizacoes_db = await db_sql.getAllAsync(
      "SELECT * FROM localizacao"
    );

    for (const row of localizacoes_db) {
      lista.push({
        id: row.id,
        latitude: row.latitude,
        longitude: row.longitude,
      });
    }

    setLocations(lista);
  } catch (e) {
    console.log("Erro ao carregar localizações:", e);
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
      salvarTema(true)
      setTheme({ ...theme, colors: myColorsDark.colors });
    } else {
      removerTemaEscuro()
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
