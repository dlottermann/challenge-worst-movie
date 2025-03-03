import express from "express";
import cors from "cors";
import { readExcel } from "./import.js";
import sqlite3 from "sqlite3";
import * as sqlite from "sqlite";

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.get("/", async (req, res) => {
  const rows = await handleInterval();
  res.json(rows);
});

// Start server
app.listen(port, async () => {
  console.log(`Server running on port ${port}`);
  await readExcel("./store/movielist.csv");
  console.log("Excel data loaded successfully");
});

const handleInterval = async () => {
  const db = await sqlite.open({
    filename: "movies.db",
    driver: sqlite3.Database,
  });

  const sqlInterval = `WITH RECURSIVE split(producer, remaining, year) AS (
        -- Primeiro nível: pega o primeiro produtor antes da primeira vírgula
        SELECT 
            TRIM(SUBSTR(producer_list, 0, INSTR(producer_list || ',', ','))) AS producer,
            TRIM(SUBSTR(producer_list, INSTR(producer_list || ',', ',') + 1)) AS remaining,
            year
        FROM (
            SELECT year, producers AS producer_list FROM movies WHERE winner = 'yes'
        )
    
        UNION ALL
    
        -- Iteração recursiva para extrair cada produtor restante
        SELECT 
            TRIM(SUBSTR(remaining, 0, INSTR(remaining || ',', ','))),
            TRIM(SUBSTR(remaining, INSTR(remaining || ',', ',') + 1)),
            year
        FROM split
        WHERE remaining <> ''
    ),
    ranked AS (
        -- Ordena os prêmios por produtor e calcula o intervalo entre eles
        SELECT 
            producer, 
            year,
            LAG(year) OVER (PARTITION BY producer ORDER BY year) AS prev_year
        FROM split
    ),
    intervals AS (
        -- Calcula a diferença entre os prêmios consecutivos
        SELECT 
            producer,
            year - prev_year AS interval,
            prev_year AS previousWin,
            year AS followingWin
        FROM ranked
        WHERE prev_year IS NOT NULL
    )
    -- Seleciona o produtor com o maior intervalo e o menor intervalo
    SELECT 
        producer, 
        previousWin, 
        followingWin, 
        interval
    FROM intervals
    WHERE interval = (SELECT MAX(interval) FROM intervals)
    UNION ALL
    SELECT 
        producer, 
        previousWin, 
        followingWin, 
        interval
    FROM intervals
    WHERE interval = (SELECT MIN(interval) FROM intervals)`;

  const response = await db.all(sqlInterval);

  const maxInterval = Math.max(...response.map((r) => r.interval));
  const minInterval = Math.min(...response.map((r) => r.interval));

  const result = {
    min: response.filter((r) => r.interval === minInterval),
    max: response.filter((r) => r.interval === maxInterval),
  };

  return result;
};

export { app };
