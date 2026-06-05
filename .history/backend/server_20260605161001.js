const express = require("express");

const app = express();

const PORT = 3001;

app.get("/", (req, res) => {
    res.send("API ONLINE");
});

app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});