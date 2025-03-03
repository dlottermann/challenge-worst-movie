import xlsx from "xlsx";
import sqlite3 from "sqlite3";
import * as sqlite from "sqlite";

const tableName = "movies";

function handleSanitizer(s) {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\./g, "");
}

// Função para ler o arquivo Excel
export const readExcel = async (filePath) => {
  // Lê o arquivo Excel
  const workbook = xlsx.readFile(filePath);

  // Seleciona a primeira planilha
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];

  // Step 2: Connect to SQLite
  const db = await sqlite.open({
    filename: "movies.db",
    driver: sqlite3.Database,
  });

  // Converte os dados da planilha para JSON
  const data = xlsx.utils.sheet_to_json(worksheet);

  // Step 3: Create the table dynamically based on Excel data
  const columns = Object.keys(data[0]).map((col) =>
    handleSanitizer(col).replace(/\s/g, "_").toLowerCase()
  );

  const createTableSQL = `
        CREATE TABLE IF NOT EXISTS ${tableName} (
            ${columns.map((col) => `${col} TEXT`).join(", ")}
        );
    `;

  await db.exec(createTableSQL, (err) => {
    if (err) {
      throw new Error(`Error creating table: ${err.message}`);
    }
    console.log(`Table "${tableName}" created or already exists.`);
  });

  // Step 4: Insert data into the table
  const placeholders = columns.map(() => "?").join(", ");
  const insertSQL = `INSERT INTO ${tableName} (${columns.join(
    ", "
  )}) VALUES (${placeholders})`;

  const insertPromises = data.flatMap(async (row) => {
    const values = columns.map((column_name) => row[column_name]);

    const movie = await db.get(
      `SELECT * FROM ${tableName} WHERE ${columns[1]} = ?`,
      values[1]
    );

    if (!movie) {
      await db.run(insertSQL, values);
    }
  });

  await Promise.all(insertPromises);
  db.close();
};

// // Caminho do arquivo Excel
// const filePath = "./store/movielist.csv";

// // Chama a função
// await readExcel(filePath);
