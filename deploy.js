// deploy.js — Executa o deploy para o servidor de produção
// Uso: node deploy.js <senha>
// Requer: npm install -g node-ssh  OU  use o script abaixo com ssh2

const { execSync } = require('child_process');
const path = require('path');

const SERVER = 'srv1023256.hstgr.cloud';
const USER   = 'root';
const REMOTE = '/home/keaflow';
const PASS   = process.argv[2];

if (!PASS) {
  console.error('Uso: node deploy.js <senha_ssh>');
  process.exit(1);
}

function run(cmd) {
  console.log(`\n==> ${cmd}`);
  execSync(cmd, { stdio: 'inherit', cwd: path.join(__dirname) });
}

// Usando scp com sshpass (Linux/Mac) ou plink/pscp (Windows)
const isWin = process.platform === 'win32';

if (isWin) {
  // Windows: usa pscp (PuTTY) se disponível
  console.log('Windows detectado. Use o WinSCP ou FileZilla para enviar os arquivos manualmente.');
  console.log('\nArquivos para enviar ao servidor:');
  console.log(`  Local: dist/          → Remoto: ${REMOTE}/dist/`);
  console.log(`  Local: web/dist/      → Remoto: ${REMOTE}/web/dist/`);
  console.log(`  Local: package.json   → Remoto: ${REMOTE}/package.json`);
  console.log('\nApós enviar, execute no servidor via SSH:');
  console.log(`  cd ${REMOTE}`);
  console.log('  npm install --omit=dev');
  console.log('  npx playwright install chromium');
  console.log('  pm2 restart keaflow');
} else {
  run(`sshpass -p '${PASS}' scp -r dist/ ${USER}@${SERVER}:${REMOTE}/`);
  run(`sshpass -p '${PASS}' scp -r web/dist/ ${USER}@${SERVER}:${REMOTE}/web/`);
  run(`sshpass -p '${PASS}' scp package.json ${USER}@${SERVER}:${REMOTE}/`);
  run(`sshpass -p '${PASS}' ssh ${USER}@${SERVER} "cd ${REMOTE} && npm install --omit=dev && npx playwright install chromium && pm2 restart keaflow || pm2 start dist/server.js --name keaflow"`);
  console.log('\n✅ Deploy concluído!');
}
