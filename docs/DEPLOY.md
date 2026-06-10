# FraudShield — Deploy (Vercel + Render)

Guia para publicar o painel com **link clicável no GitHub**.

---

## Arquitetura de deploy

```
Vercel (frontend)  →  Render/Railway (backend API)
     ↓                        ↓
  React SPA              Node.js + data/
```

---

## Passo 1 — Backend no Render (grátis)

1. Acesse [render.com](https://render.com) e conecte o GitHub
2. **New → Web Service**
3. Repositório: `fraudshield-ai-platform`
4. Configuração:

| Campo | Valor |
|-------|-------|
| Root Directory | `backend` |
| Build Command | `npm install` |
| Start Command | `npm start` |
| Instance | Free |

5. Deploy → copie a URL: `https://fraudshield-api.onrender.com`

6. Teste: `https://SUA-URL.onrender.com/health`

> O dataset demo já está no repo (`data/gold/*.json` + CSV). O backend carrega na inicialização (~5–30s no free tier).

---

## Passo 2 — Frontend na Vercel (grátis)

1. Acesse [vercel.com](https://vercel.com) e conecte o GitHub
2. **Import Project** → `fraudshield-ai-platform`
3. Configuração:

| Campo | Valor |
|-------|-------|
| Root Directory | `frontend` |
| Framework | Vite |
| Build Command | `npm run build` |
| Output Directory | `dist` |

4. **Environment Variables:**

| Name | Value |
|------|-------|
| `VITE_API_URL` | `https://SUA-URL.onrender.com` |
| `VITE_BASE_PATH` | `/` (ou deixe vazio — **não** use `/fraudshield-ai-platform/` na Vercel) |

> **Importante:** `VITE_BASE_PATH=/fraudshield-ai-platform/` é só para GitHub Pages. Na Vercel isso quebra o carregamento dos arquivos `.js` (tela branca + erro MIME type no console).

5. Deploy → copie a URL: `https://fraudshield.vercel.app`

---

## Passo 3 — Link no GitHub

1. Repositório → **⚙️ About** (lápis ao lado de About)
2. **Website:** `https://fraudshield.vercel.app` (sua URL Vercel)
3. **Description:** (já documentada em `GITHUB_OPTIMIZATION.md`)
4. Salvar

5. Atualize o README (opcional):

```markdown
[Live Demo](https://fraudshield.vercel.app) · [Quick Start](#quick-start)
```

---

## Passo 4 — Validar demo ao vivo

- [ ] `https://SUA-URL.vercel.app` abre o dashboard
- [ ] KPIs carregam (não ficam em loading infinito)
- [ ] AI Monitoring renderiza gráficos
- [ ] Link aparece no GitHub About

### Se KPIs não carregam

- Backend Render em cold start (aguarde 30–60s e recarregue)
- `VITE_API_URL` incorreta na Vercel → **Redeploy** após corrigir
- CORS: backend já usa `cors()` — OK para qualquer origem

---

## Alternativa: só frontend na Vercel (sem API)

O painel **não terá dados reais** — apenas UI. Não recomendado para portfólio.

---

## Comandos locais (referência)

```bash
# Build de produção local
cd frontend && npm run build && npm run preview

# Testar com API de produção
VITE_API_URL=https://SUA-URL.onrender.com npm run build
```
