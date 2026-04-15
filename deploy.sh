#!/usr/bin/env bash
# deploy.sh — Envia o build atualizado para o servidor de produção
# Uso: bash deploy.sh <senha_ssh>
# Exemplo: bash deploy.sh "minha_senha"

set -e

SERVER="root@srv1023256.hstgr.cloud"
REMOTE_DIR="/home/keaflow"   # ajuste se necessário
PASS="${1:-}"

if [ -z "$PASS" ]; then
  echo "Uso: bash deploy.sh <senha_ssh>"
  exit 1
fi

echo "==> Enviando dist/ (backend)..."
sshpass -p "$PASS" scp -r dist/ "$SERVER:$REMOTE_DIR/"

echo "==> Enviando web/dist/ (frontend)..."
sshpass -p "$PASS" scp -r web/dist/ "$SERVER:$REMOTE_DIR/web/"

echo "==> Enviando package.json..."
sshpass -p "$PASS" scp package.json "$SERVER:$REMOTE_DIR/"

echo "==> Instalando dependências e Playwright no servidor..."
sshpass -p "$PASS" ssh "$SERVER" "
  cd $REMOTE_DIR &&
  npm install --omit=dev &&
  npx playwright install chromium &&
  pm2 restart keaflow || pm2 start dist/server.js --name keaflow
"

echo "==> Deploy concluído!"
