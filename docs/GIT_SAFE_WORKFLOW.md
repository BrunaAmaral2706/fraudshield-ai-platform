# FraudShield — Git Safe Workflow (Windows + OneDrive)

Guia para evitar `index.lock` e problemas com repositórios grandes.

---

## Causa do travamento

O arquivo `.git/index.lock` é criado quando um comando Git está em execução. Se o processo for **interrompido** (VS Code, Cursor, OneDrive sync, `git gc`, force push), o lock fica órfão e bloqueia todos os comandos.

**Diagnóstico desta sessão:**
- `.git/index.lock` presente
- Nenhum processo `git.exe` ativo → lock **obsoleto** (seguro remover)
- VS Code + Cursor abertos (extensões Git podem disputar o index)

---

## Correção rápida (safe)

```powershell
cd "C:\Users\BrunaAmaral\OneDrive - ZIG Tecnologia S A\bases_analise\projetos_bruna\fraud-lakehouse-platform"

# 1. Verificar se há Git rodando
Get-Process git -ErrorAction SilentlyContinue

# 2. Se NÃO houver git.exe, remover lock
Remove-Item .git\index.lock -Force -ErrorAction SilentlyContinue
Get-ChildItem .git -Recurse -Filter *.lock | Remove-Item -Force

# 3. Validar
git status
git fsck --no-progress
```

**Nunca remova o lock se `git.exe` estiver ativo** — aguarde o comando terminar.

---

## Fluxo seguro de commit

```powershell
# 1. Status
git status

# 2. Garantir que parquet NÃO entram no commit
git rm --cached -rf data/bronze data/silver
git rm --cached -f data/gold/*.parquet

# 3. Stage apenas arquivos seguros
git add .

# 4. Verificar staged (sem .parquet)
git diff --cached --name-only

# 5. Commit
git commit -m "sua mensagem"

# 6. Push (sem force na main)
git push origin main
```

---

## O que NÃO commitar

| Tipo | Motivo |
|------|--------|
| `data/bronze/`, `data/silver/` | Regenerável via pipeline |
| `data/gold/*.parquet` | Regenerável |
| CSV > 5 MB | GitHub limita arquivos grandes |
| `node_modules/` | Dependências |
| `backups/`, `.history/` | Local only |
| `.env` | Segredos |

**Commitar:** `data/gold/*.json`, CSV demo (~500 KB), código, screenshots PNG.

---

## Limpeza segura (sem quebrar histórico)

```powershell
# NUNCA na main sem backup:
# git push --force

# Limpar refs órfãs (seguro)
git fetch --prune
git gc --auto

# Ver tamanho do repo
git count-objects -vH
```

Para remover arquivos grandes do **histórico futuro**, use `.gitignore` + `git rm --cached` — **não** `git filter-repo` sem necessidade.

---

## OneDrive + Git (Windows)

Projetos em `OneDrive` podem causar locks frequentes porque o sync altera arquivos enquanto o Git escreve o index.

**Recomendações:**
1. Pausar sync OneDrive antes de `git add` / `commit` em projetos grandes
2. Considerar mover o repo para `C:\dev\fraud-lakehouse-platform` (fora do OneDrive)
3. Fechar Source Control panel no VS Code durante commits longos

---

## Comandos de validação

```powershell
git status
git log --oneline -5
git remote -v
git fsck --no-progress
Test-Path .git\index.lock   # deve ser False
```

---

## Status pós-correção (2026-06-06)

| Check | Resultado |
|-------|-----------|
| `index.lock` removido | ✅ |
| `git status` | ✅ |
| `git commit` | ✅ `ad3e237` |
| `git push` | ✅ `main → origin/main` |
| Parquet no commit | ❌ excluídos (correto) |
| Commits preservados | ✅ histórico intacto |
