import * as SQLite from 'expo-sqlite';
let db = null;
const DB_nome = "data_base";
const sql_create = `
  CREATE TABLE IF NOT EXISTS localizacao (
  id INTEGER PRIMARY KEY autoincrement,
  latitude int NOT NULL,
  longitude int NOT NULL
  )
  ` ;
export default function openDB(){
    db = SQLite.openDatabaseSync(DB_nome);
    db.withTransactionSync(() => db.execSync(sql_create));
    return db;

}