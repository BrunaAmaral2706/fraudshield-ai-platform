/**
 * FraudShield API — Enterprise fraud analytics backend
 * [ALTERADO] Modular architecture: lib/ + routes/
 * [MOTIVO] Separation of concerns, filter support, risk engine, logging
 * [IMPACTO] All existing endpoints preserved + /transactions + filtered analytics
 */

const express = require('express');
const cors = require('cors');
const { requestLogger } = require('./middleware/requestLogger');
const { initializeData } = require('./database/dataStore');
const apiRoutes = require('./routes/api');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use(requestLogger);
app.use(apiRoutes);
app.use(notFoundHandler);
app.use(errorHandler);

initializeData().catch((err) => {
  console.error('[ERROR] Startup data load failed:', err.message);
});

app.listen(PORT, () => {
  console.log(`[SERVER] FraudShield API → http://localhost:${PORT}`);
  console.log('[SERVER] Endpoints: /kpis /fraudes/* /transactions /alertas /modelos /ml/*');
});

process.stdin.resume();
