const express = require("express");
const cors = require("cors");
const duckdb = require("duckdb");

const app = express();

app.use(cors());

const PORT = 3001;

// =====================================
// CONEXÃO DUCKDB
// =====================================

const db = new duckdb.Database(":memory:");

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
// KPIs FRAUDE
// =====================================

app.get("/kpis", (req, res) => {

    const query = `
        SELECT *
        FROM read_parquet('../data/gold/fraud_kpis.parquet')
    `;

    db.all(query, (err, rows) => {

        if (err) {

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
        FROM read_parquet('../data/gold/fraud_by_category.parquet')
    `;

    db.all(query, (err, rows) => {

        if (err) {

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
        FROM read_parquet('../data/gold/fraud_by_hour.parquet')
    `;

    db.all(query, (err, rows) => {

        if (err) {

            console.error(err);

            return res.status(500).json({
                error: "Erro ao carregar horários"
            });
        }

        res.json(rows);
    });
});

// =====================================
// INICIAR SERVIDOR
// =====================================

app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});