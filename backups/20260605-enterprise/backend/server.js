const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const { parse } = require("csv-parse");

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const DATA_DIR = path.join(__dirname, "../data");
const GOLD_DIR = path.join(DATA_DIR, "gold");
const CSV_PATH = path.join(DATA_DIR, "raw/credit_card_transactions.csv");

let cache = {
  ready: false,
  loading: null,
  kpis: null,
  hours: null,
  categories: null,
  transactions: null,
  alerts: null,
  models: null,
};

function readJson(fileName) {
  const filePath = path.join(GOLD_DIR, fileName);
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}

function loadGoldData() {
  cache.kpis = readJson("fraud_kpis.json");
  cache.hours = readJson("fraud_by_hour.json");
  cache.categories = readJson("fraud_by_category.json");
}

function computeRiskScore(amount) {
  const base = 55 + Math.min(40, Math.log10(Number(amount) + 1) * 12);
  return Math.min(99, Math.round(base));
}

function computeStatus(amount, riskScore) {
  if (riskScore >= 90 || Number(amount) >= 5000) return "blocked";
  if (riskScore >= 75 || Number(amount) >= 1000) return "review";
  return "flagged";
}

function formatCategoryLabel(category) {
  return String(category || "unknown")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

async function loadFraudTransactionsFromCsv() {
  if (!fs.existsSync(CSV_PATH)) {
    console.warn("CSV not found:", CSV_PATH);
    return [];
  }

  return new Promise((resolve, reject) => {
    const frauds = [];
    const categoryMap = new Map();

    fs.createReadStream(CSV_PATH)
      .pipe(parse({ columns: true, skip_empty_lines: true, relax_quotes: true }))
      .on("data", (row) => {
        if (row.is_fraud !== "1" && row.is_fraud !== 1) return;

        const amount = parseFloat(row.amt) || 0;
        const category = row.category || "unknown";
        const riskScore = computeRiskScore(amount);

        frauds.push({
          transaction_id: row.trans_num,
          amount,
          category: formatCategoryLabel(category),
          category_raw: category,
          risk_score: riskScore,
          status: computeStatus(amount, riskScore),
          timestamp: row.trans_date_trans_time,
          merchant: row.merchant,
        });

        const prev = categoryMap.get(category) || { qtd_fraudes: 0, volume_fraude: 0 };
        categoryMap.set(category, {
          qtd_fraudes: prev.qtd_fraudes + 1,
          volume_fraude: prev.volume_fraude + amount,
          category: formatCategoryLabel(category),
          category_raw: category,
        });
      })
      .on("end", () => {
        frauds.sort(
          (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
        );

        const categories = Array.from(categoryMap.values()).sort(
          (a, b) => b.qtd_fraudes - a.qtd_fraudes,
        );

        resolve({ frauds, categories });
      })
      .on("error", reject);
  });
}

function buildAlerts(hours, categories, kpis) {
  const alerts = [];
  const fraudRate = kpis?.[0]?.taxa_fraude ?? 0;

  if (hours?.length) {
    const avg =
      hours.reduce((sum, row) => sum + (row.qtd_fraudes || 0), 0) / hours.length;

    hours.forEach((row, index) => {
      const count = row.qtd_fraudes || 0;
      if (count <= avg * 1.8) return;

      alerts.push({
        id: `ALT-H${String(index).padStart(2, "0")}`,
        severity: count > avg * 2.5 ? "critical" : "high",
        title: `Fraud spike detected at ${String(index).padStart(2, "0")}:00`,
        description: `${count} fraud cases detected (${Math.round((count / avg - 1) * 100)}% above hourly average)`,
        time: `${index}h window`,
        category: "Risk Monitoring",
      });
    });
  }

  if (categories?.length) {
    categories.slice(0, 3).forEach((cat, index) => {
      alerts.push({
        id: `ALT-C${String(index + 1).padStart(2, "0")}`,
        severity: index === 0 ? "critical" : index === 1 ? "high" : "medium",
        title: `Elevated fraud activity in ${cat.category || cat.category_raw}`,
        description: `${cat.qtd_fraudes} confirmed frauds · $${Math.round(cat.volume_fraude).toLocaleString("en-US")} volume`,
        time: "Last 24h",
        category: cat.category || formatCategoryLabel(cat.category_raw),
      });
    });
  }

  if (fraudRate > 0.5) {
    alerts.unshift({
      id: "ALT-RATE",
      severity: "critical",
      title: "Fraud rate above industry benchmark",
      description: `Current rate ${fraudRate.toFixed(2)}% exceeds benchmark of 0.42%`,
      time: "Live",
      category: "Fraud Analytics",
    });
  }

  return alerts.slice(0, 20);
}

function buildModels(kpis) {
  const data = kpis?.[0] ?? {};
  const fraudRate = data.taxa_fraude ?? 0;
  const accuracyBase = Math.max(88, 99.2 - fraudRate * 0.8);

  return [
    {
      name: "fraud-detector-v3",
      status: fraudRate > 0.55 ? "alerting" : "healthy",
      accuracy: Number((accuracyBase + 0.3).toFixed(1)),
      latency: 42,
      alerts: fraudRate > 0.55 ? 2 : 0,
      lastTrain: "2026-06-03",
    },
    {
      name: "risk-scorer-v2",
      status: "healthy",
      accuracy: Number((accuracyBase - 1.2).toFixed(1)),
      latency: 28,
      alerts: 0,
      lastTrain: "2026-06-01",
    },
    {
      name: "velocity-check-v1",
      status: fraudRate > 0.5 ? "degraded" : "healthy",
      accuracy: Number((accuracyBase - 3.5).toFixed(1)),
      latency: 15,
      alerts: fraudRate > 0.5 ? 1 : 0,
      lastTrain: "2026-05-28",
    },
    {
      name: "anomaly-net-v4",
      status: "healthy",
      accuracy: Number((accuracyBase - 0.8).toFixed(1)),
      latency: 67,
      alerts: 0,
      lastTrain: "2026-05-25",
    },
    {
      name: "category-classifier",
      status: "healthy",
      accuracy: Number((accuracyBase - 2.1).toFixed(1)),
      latency: 35,
      alerts: 0,
      lastTrain: "2026-05-20",
    },
    {
      name: "behavioral-v2",
      status: fraudRate > 0.58 ? "alerting" : "healthy",
      accuracy: Number((accuracyBase - 4.2).toFixed(1)),
      latency: 52,
      alerts: fraudRate > 0.58 ? 1 : 0,
      lastTrain: "2026-05-15",
    },
  ];
}

async function initializeData() {
  if (cache.loading) return cache.loading;

  cache.loading = (async () => {
    console.log("Loading FraudShield data...");
    loadGoldData();

    try {
      const { frauds, categories } = await loadFraudTransactionsFromCsv();
      cache.transactions = frauds;

      if (categories.length > 0) {
        cache.categories = categories;
      }
    } catch (err) {
      console.error("Failed to load CSV transactions:", err.message);
      cache.transactions = [];
    }

    cache.alerts = buildAlerts(cache.hours, cache.categories, cache.kpis);
    cache.models = buildModels(cache.kpis);
    cache.ready = true;
    console.log(
      `Data ready: ${cache.transactions.length} fraud transactions, ${cache.categories.length} categories`,
    );
  })();

  return cache.loading;
}

function ensureReady(req, res, next) {
  if (cache.ready) return next();
  initializeData()
    .then(() => next())
    .catch((err) => {
      console.error(err);
      res.status(500).json({ error: "Failed to initialize data store" });
    });
}

app.get("/", (req, res) => {
  res.json({
    status: "success",
    message: "FraudShield Analytics API Running",
    ready: cache.ready,
    endpoints: ["/health", "/kpis", "/fraudes/categorias", "/fraudes/horarios", "/transacoes", "/alertas", "/modelos"],
  });
});

app.get("/health", (req, res) => {
  res.json({
    status: cache.ready ? "ok" : "loading",
    ready: cache.ready,
    timestamp: new Date().toISOString(),
  });
});

app.get("/kpis", ensureReady, (req, res) => {
  res.json(cache.kpis ?? []);
});

app.get("/fraudes/categorias", ensureReady, (req, res) => {
  res.json(cache.categories ?? []);
});

app.get("/fraudes/horarios", ensureReady, (req, res) => {
  res.json(cache.hours ?? []);
});

app.get("/transacoes", ensureReady, (req, res) => {
  const {
    search = "",
    status = "all",
    category = "all",
    page = "1",
    limit = "10",
    sort = "timestamp",
    order = "desc",
  } = req.query;

  let rows = [...(cache.transactions ?? [])];
  const q = String(search).toLowerCase().trim();

  if (q) {
    rows = rows.filter(
      (tx) =>
        tx.transaction_id.toLowerCase().includes(q) ||
        tx.category.toLowerCase().includes(q) ||
        (tx.merchant && tx.merchant.toLowerCase().includes(q)),
    );
  }

  if (status !== "all") {
    rows = rows.filter((tx) => tx.status === status);
  }

  if (category !== "all") {
    rows = rows.filter(
      (tx) => tx.category === category || tx.category_raw === category,
    );
  }

  const sortKey = sort;
  rows.sort((a, b) => {
    const dir = order === "asc" ? 1 : -1;
    if (sortKey === "amount") return (a.amount - b.amount) * dir;
    if (sortKey === "risk_score") return (a.risk_score - b.risk_score) * dir;
    if (sortKey === "category") return a.category.localeCompare(b.category) * dir;
    return (new Date(a.timestamp) - new Date(b.timestamp)) * dir;
  });

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const pageSize = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
  const total = rows.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = (pageNum - 1) * pageSize;

  res.json({
    data: rows.slice(start, start + pageSize),
    pagination: {
      page: pageNum,
      limit: pageSize,
      total,
      totalPages,
    },
    filters: {
      categories: [
        "all",
        ...new Set((cache.transactions ?? []).map((tx) => tx.category)),
      ],
      statuses: ["all", "blocked", "review", "flagged"],
    },
  });
});

app.get("/alertas", ensureReady, (req, res) => {
  const { severity = "all" } = req.query;
  let rows = cache.alerts ?? [];

  if (severity !== "all") {
    rows = rows.filter((a) => a.severity === severity);
  }

  res.json(rows);
});

app.get("/modelos", ensureReady, (req, res) => {
  res.json(cache.models ?? []);
});

initializeData().catch((err) => {
  console.error("Startup data load failed:", err);
});

app.listen(PORT, () => {
  console.log(`FraudShield API running on http://localhost:${PORT}`);
});

process.stdin.resume();
