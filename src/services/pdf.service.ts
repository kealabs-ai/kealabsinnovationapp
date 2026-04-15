import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const logoBase64 = fs.readFileSync(
  path.join(__dirname, '..', '..', 'web', 'src', 'assets', 'kealabs_logo_strategic.png')
).toString('base64');

const LOGO_DATA_URL = `data:image/png;base64,${logoBase64}`;

export interface PdfSection {
  title: string;
  rows: { label: string; value: string; bold?: boolean }[];
  subtotal?: { label: string; value: string };
}

export interface PdfHostingRow {
  label: string;
  spec: string;
  price: string;
}

export interface PdfPayload {
  clientName: string;
  clientEmail?: string;
  clientCpfCnpj?: string;
  clientPhone?: string;
  sections: PdfSection[];
  hosting?: PdfHostingRow[];
  setupValue: string;
  clientCharge: string;
  installments: number;
  installmentValue: string;
  totalCharge: string;
  liquidMensal: string;
  liquidAntecipado: string;
  mdrInfo: string;
  date: string;
}

function fmt(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function buildHtml(p: PdfPayload): string {
  const sectionsHtml = p.sections.map(sec => `
    <div class="section">
      <div class="section-header">
        <span class="section-accent"></span>
        <span class="section-title">${sec.title}</span>
      </div>
      <table class="data-table">
        ${sec.rows.map((r, i) => `
          <tr class="${i % 2 === 0 ? 'row-even' : ''}">
            <td class="label-cell">${r.label}</td>
            <td class="value-cell ${r.bold ? 'bold' : ''}">${r.value}</td>
          </tr>
        `).join('')}
        ${sec.subtotal ? `
          <tr class="subtotal-row">
            <td>${sec.subtotal.label}</td>
            <td class="value-cell bold orange">${sec.subtotal.value}</td>
          </tr>
        ` : ''}
      </table>
    </div>
  `).join('');

  const hostingHtml = p.hosting && p.hosting.length > 0 ? `
    <div class="section">
      <div class="section-header">
        <span class="section-accent"></span>
        <span class="section-title">Planos de Hospedagem</span>
      </div>
      <div class="hosting-notice">
        <span class="hosting-notice-icon">🏠</span>
        <div>
          <strong>Incluso no serviço KeaLabs</strong><br>
          A hospedagem faz parte do escopo contratado e é de responsabilidade da KeaLabs.
          Gerenciamos toda a infraestrutura para você.
        </div>
      </div>
      <table class="data-table">
        ${p.hosting.map((h, i) => `
          <tr class="${i % 2 === 0 ? 'row-even' : ''}">
            <td class="label-cell">
              <strong>${h.label}</strong><br>
              <span class="spec-text">${h.spec}</span>
            </td>
            <td class="value-cell bold">${h.price}<span class="per-month">/mês</span></td>
          </tr>
        `).join('')}
      </table>
      <div class="hosting-badge">✓ Gerenciado pela KeaLabs</div>
    </div>
  ` : '';

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'Segoe UI', Arial, sans-serif;
    font-size: 11px;
    color: #1a1a1a;
    background: #fff;
    width: 794px;
  }

  /* ── HEADER ── */
  .header {
    background: linear-gradient(135deg, #EA580C 0%, #C2410C 100%);
    padding: 0;
    position: relative;
    overflow: hidden;
    height: 110px;
  }
  .header-circles {
    position: absolute;
    top: -30px; right: -30px;
    width: 160px; height: 160px;
    border-radius: 50%;
    background: rgba(255,255,255,0.08);
  }
  .header-circles::after {
    content: '';
    position: absolute;
    top: 40px; right: 40px;
    width: 80px; height: 80px;
    border-radius: 50%;
    background: rgba(255,255,255,0.1);
  }
  .header-inner {
    position: relative;
    z-index: 2;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 22px 32px 0 32px;
  }
  .header-logo {
    height: 44px;
    filter: brightness(0) invert(1);
  }
  .header-right {
    text-align: right;
    color: rgba(255,255,255,0.9);
  }
  .header-right .doc-title {
    font-size: 16px;
    font-weight: 700;
    color: #fff;
    letter-spacing: 0.3px;
  }
  .header-right .doc-date {
    font-size: 10px;
    margin-top: 3px;
    color: rgba(255,255,255,0.8);
  }
  .header-strip {
    background: rgba(0,0,0,0.18);
    padding: 7px 32px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 14px;
  }
  .header-strip span {
    color: rgba(255,255,255,0.85);
    font-size: 9.5px;
    font-style: italic;
  }
  .header-strip .validity {
    font-style: normal;
    font-weight: 700;
    font-size: 9px;
    background: rgba(255,255,255,0.2);
    padding: 2px 8px;
    border-radius: 10px;
    color: #fff;
    letter-spacing: 0.5px;
  }

  /* ── BODY ── */
  .body { padding: 24px 32px 100px 32px; }

  /* ── CLIENT CARD ── */
  .client-card {
    background: linear-gradient(135deg, #FFF7F3, #FFF1E6);
    border: 1px solid #FED7AA;
    border-radius: 10px;
    padding: 16px 20px;
    margin-bottom: 20px;
    display: flex;
    gap: 32px;
  }
  .client-field { flex: 1; }
  .client-field .cf-label {
    font-size: 8.5px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.6px;
    color: #EA580C;
    margin-bottom: 3px;
  }
  .client-field .cf-value {
    font-size: 11px;
    font-weight: 600;
    color: #1a1a1a;
  }

  /* ── SECTIONS ── */
  .section { margin-bottom: 18px; }
  .section-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 6px;
  }
  .section-accent {
    width: 4px;
    height: 16px;
    background: #EA580C;
    border-radius: 2px;
    flex-shrink: 0;
  }
  .section-title {
    font-size: 10px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.8px;
    color: #EA580C;
  }

  /* ── TABLE ── */
  .data-table {
    width: 100%;
    border-collapse: collapse;
    border-radius: 8px;
    overflow: hidden;
    border: 1px solid #F0E8E0;
  }
  .data-table td {
    padding: 6px 12px;
    font-size: 10.5px;
    border-bottom: 1px solid #F5EDE6;
  }
  .data-table tr:last-child td { border-bottom: none; }
  .row-even { background: #FAFAFA; }
  .label-cell { color: #6B7280; width: 60%; }
  .value-cell { text-align: right; color: #1a1a1a; }
  .value-cell.bold { font-weight: 700; }
  .value-cell.orange { color: #EA580C; }
  .subtotal-row { background: #FFF1E6 !important; }
  .subtotal-row td { padding: 8px 12px; font-size: 11px; }
  .spec-text { font-size: 9px; color: #9CA3AF; font-weight: 400; }
  .per-month { font-size: 9px; color: #9CA3AF; font-weight: 400; }

  /* ── HOSTING ── */
  .hosting-notice {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    background: #F0FDF4;
    border: 1px solid #86EFAC;
    border-radius: 8px;
    padding: 10px 14px;
    margin-bottom: 8px;
    font-size: 10px;
    color: #166534;
    line-height: 1.5;
  }
  .hosting-notice-icon { font-size: 16px; flex-shrink: 0; }
  .hosting-badge {
    display: inline-block;
    margin-top: 6px;
    background: #22C55E;
    color: #fff;
    font-size: 8.5px;
    font-weight: 700;
    padding: 3px 10px;
    border-radius: 20px;
    letter-spacing: 0.4px;
  }

  /* ── FINANCIAL SUMMARY ── */
  .summary-section { margin-top: 24px; }
  .summary-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 12px;
  }
  .summary-cards {
    display: flex;
    gap: 12px;
    margin-bottom: 12px;
  }
  .summary-card {
    flex: 1;
    border-radius: 12px;
    overflow: hidden;
  }
  .summary-card-header {
    padding: 8px 16px;
    font-size: 8.5px;
    font-weight: 800;
    letter-spacing: 0.6px;
    text-transform: uppercase;
    color: #fff;
  }
  .summary-card-body {
    padding: 14px 16px 12px;
    color: #fff;
  }
  .summary-card-value {
    font-size: 22px;
    font-weight: 900;
    line-height: 1;
    margin-bottom: 4px;
  }
  .summary-card-sub {
    font-size: 9px;
    opacity: 0.8;
  }
  .card-orange .summary-card-header { background: #FF6A1A; }
  .card-orange .summary-card-body   { background: #EA580C; }
  .card-dark   .summary-card-header { background: #374151; }
  .card-dark   .summary-card-body   { background: #1F2937; }

  .notes-box {
    background: #FAFAF9;
    border: 1px solid #E5E0D8;
    border-radius: 8px;
    padding: 10px 14px;
    font-size: 9px;
    color: #6B7280;
    line-height: 1.7;
  }
  .notes-box strong { color: #374151; }

  /* ── FOOTER ── */
  .footer {
    position: fixed;
    bottom: 0;
    left: 0; right: 0;
    height: 48px;
  }
  .footer-accent { height: 3px; background: #EA580C; }
  .footer-body {
    background: #111827;
    height: 45px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 32px;
  }
  .footer-left { color: #fff; }
  .footer-left strong { font-size: 11px; }
  .footer-left span { font-size: 9px; color: #9CA3AF; display: block; margin-top: 1px; }
  .footer-right { font-size: 9px; color: #6B7280; text-align: right; }
</style>
</head>
<body>

<!-- HEADER -->
<div class="header">
  <div class="header-circles"></div>
  <div class="header-inner">
    <img class="header-logo" src="${LOGO_DATA_URL}" alt="KeaLabs" />
    <div class="header-right">
      <div class="doc-title">Proposta Comercial</div>
      <div class="doc-date">${p.date}</div>
    </div>
  </div>
  <div class="header-strip">
    <span>Gerada automaticamente pelo sistema KeaFlow</span>
    <span class="validity">VÁLIDA POR 15 DIAS</span>
  </div>
</div>

<!-- BODY -->
<div class="body">

  <!-- CLIENTE -->
  <div class="client-card">
    <div class="client-field">
      <div class="cf-label">Cliente</div>
      <div class="cf-value">${p.clientName || '—'}</div>
    </div>
    <div class="client-field">
      <div class="cf-label">E-mail</div>
      <div class="cf-value">${p.clientEmail || '—'}</div>
    </div>
    <div class="client-field">
      <div class="cf-label">CPF / CNPJ</div>
      <div class="cf-value">${p.clientCpfCnpj || '—'}</div>
    </div>
    <div class="client-field">
      <div class="cf-label">Telefone</div>
      <div class="cf-value">${p.clientPhone || '—'}</div>
    </div>
  </div>

  <!-- SERVIÇOS -->
  ${sectionsHtml}

  <!-- HOSPEDAGEM -->
  ${hostingHtml}

  <!-- RESUMO FINANCEIRO -->
  <div class="summary-section">
    <div class="section-header">
      <span class="section-accent"></span>
      <span class="section-title">Resumo Financeiro</span>
    </div>
    <div class="summary-cards">
      <div class="summary-card card-orange">
        <div class="summary-card-header">Investimento Líquido (Setup)</div>
        <div class="summary-card-body">
          <div class="summary-card-value">${p.setupValue}</div>
          <div class="summary-card-sub">valor líquido para a KeaLabs</div>
        </div>
      </div>
      <div class="summary-card card-dark">
        <div class="summary-card-header">Cobrar do Cliente</div>
        <div class="summary-card-body">
          <div class="summary-card-value">${p.installments}x ${p.installmentValue}</div>
          <div class="summary-card-sub">parcelado no cartão · total ${p.totalCharge}</div>
        </div>
      </div>
    </div>
    <div class="notes-box">
      <strong>Detalhes financeiros:</strong><br>
      ${p.mdrInfo}<br>
      Líquido mês a mês: <strong>${p.liquidMensal}</strong> &nbsp;•&nbsp;
      Líquido antecipado (2 dias): <strong>${p.liquidAntecipado}</strong>
    </div>
  </div>

</div>

<!-- FOOTER -->
<div class="footer">
  <div class="footer-accent"></div>
  <div class="footer-body">
    <div class="footer-left">
      <strong>KeaLabs</strong>
      <span>kealabs.cloud · Tecnologia que transforma negócios</span>
    </div>
    <div class="footer-right">
      Gerado em ${new Date().toLocaleString('pt-BR')}
    </div>
  </div>
</div>

</body>
</html>`;
}

export async function generateProposalPdf(payload: PdfPayload): Promise<Buffer> {
  // Detect system Chrome/Chromium on Linux servers
  let executablePath: string | undefined;
  if (process.platform === 'linux') {
    const candidates = [
      '/usr/bin/google-chrome',
      '/usr/bin/google-chrome-stable',
      '/usr/bin/chromium-browser',
      '/usr/bin/chromium',
      '/snap/bin/chromium',
    ];
    for (const c of candidates) {
      try { execSync(`test -f ${c}`); executablePath = c; break; } catch { /* not found */ }
    }
  }

  const browser = await chromium.launch({
    headless: true,
    ...(executablePath ? { executablePath } : {}),
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });
  try {
    const page = await browser.newPage();
    await page.setContent(buildHtml(payload), { waitUntil: 'networkidle' });
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '0', right: '0', bottom: '0', left: '0' },
    });
    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}
