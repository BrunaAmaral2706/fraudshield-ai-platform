const express = require("express");
const cors = require("cors");
const duckdb = require("duckdb");
const path = require("path");

const app = express();

app.use(cors());

const PORT = 3001;

// =====================================
// CONEXÃO DUCKDB
// =====================================

const db = new duckdb.Database(":memory:");

// =====================================
// CAMINHOS DOS PARQUETS
// =====================================

const kpisPath = path.join(
    __dirname,
    "../data/gold/fraud_kpis.parquet"
);

const categoryPath = path.join(
    __dirname,
    "../data/gold/fraud_by_category.parquet"
);

const hourPath = path.join(
    __dirname,
    "../data/gold/fraud_by_hour.parquet"
);

// =====================================
// ROTA TESTE
// =====================================

app.get("/", (req, res) => {
    res.json({
        status: "success",
        message: "Fraud Analytics API Running"
    });
});

// =====================================
// KPIs
// =====================================

app.get("/kpis", (req, res) => {

    const query = `
        SELECT *
        FROM read_parquet('${kpisPath}')
    `;

    db.all(query, (err, rows) => {

        if (err) {

            console.error("ERRO KPIS:");
            console.error(err);

            return res.status(500).json({
                error: "Erro ao carregar KPIs"
            });
        }

        res.json(rows);
    });
});

// =====================================
// FRAUDES POR CATEGORIA
// =====================================

app.get("/fraudes/categorias", (req, res) => {

    const query = `
        SELECT *
        FROM read_parquet('${categoryPath}')
    `;

    db.all(query, (err, rows) => {

        if (err) {

            console.error("ERRO CATEGORIAS:");
            console.error(err);

            return res.status(500).json({
                error: "Erro ao carregar categorias"
            });
        }

        res.json(rows);
    });
});

// =====================================
// FRAUDES POR HORÁRIO
// =====================================

app.get("/fraudes/horarios", (req, res) => {

    const query = `
        SELECT *
        FROM read_parquet('${hourPath}')
    `;

    db.all(query, (err, rows) => {

        if (err) {

            console.error("ERRO HORÁRIOS:");
            console.error(err);

            return res.status(500).json({
                error: "Erro ao carregar horários"
            });
        }

        res.json(rows);
    });
});

// =====================================
// START SERVER
// =====================================

const server = app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});

// Mantém processo ativo
process.stdin.resume();