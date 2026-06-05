const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());

const PORT = 3001;

app.get("/", (req, res) => {
    res.json({
        status: "success",
        message: "Fraud Analytics API Running"
    });
});

app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});