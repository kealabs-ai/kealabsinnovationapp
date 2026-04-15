import { generate } from '@pdfme/generator';
import { text, image, rectangle, line } from '@pdfme/schemas';
import { BLANK_PDF } from '@pdfme/common';
import type { Template } from '@pdfme/common';
import fs from 'fs';
import path from 'path';

const logoBase64 = fs.readFileSync(
  path.join(__dirname, '..', '..', 'web', 'src', 'assets', 'kealabs_logo_strategic.png')
).toString('base64');

// ── Tipos públicos ────────────────────────────────────────────────────────────
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

// ── Constantes ────────────────────────────────────────────────────────────────
const PW   = 210;
const ML   = 14;
const CW   = 182;  // PW - ML - ML
const O    = '#EA580C';
const O2   = '#C2410C';
const DARK = '#1F2937';
const GRAY = '#6B7280';
const LGRAY= '#9CA3AF';
const WHITE= '#FFFFFF';
const LBG  = '#FAFAFA';
const OBGL = '#FFF1E6';
const GREEN= '#22C55E';
const GBGL = '#F0FDF4';
const GGRN = '#166534';

// ── Builders de schema + input ────────────────────────────────────────────────
type SchemaItem = Record<string, unknown>;

function buildDocument(p: PdfPayload) {
  const schemas: SchemaItem[] = [];
  const inputs: Record<string, string> = {};
  let idx = 0;

  function id() { return `e${idx++}`; }

  function addRect(x: number, y: number, w: number, h: number, color: string) {
    const n = id();
    schemas.push({ name: n, type: 'rectangle', position: { x, y }, width: w, height: h, color, borderWidth: 0, borderColor: '' });
    inputs[n] = '';
  }

  function addLine(x: number, y: number, w: number, color: string, thickness = 0.3) {
    const n = id();
    schemas.push({ name: n, type: 'line', position: { x, y }, width: w, height: thickness, color });
    inputs[n] = '';
  }

  function addImg(x: number, y: number, w: number, h: number, b64: string) {
    const n = id();
    schemas.push({ name: n, type: 'image', position: { x, y }, width: w, height: h });
    inputs[n] = `data:image/png;base64,${b64}`;
  }

  function addText(
    content: string, x: number, y: number, w: number, h: number,
    opts: { size?: number; bold?: boolean; italic?: boolean; color?: string; align?: 'left'|'center'|'right'; bg?: string; lineHeight?: number } = {}
  ) {
    const n = id();
    schemas.push({
      name: n, type: 'text',
      position: { x, y }, width: w, height: h,
      fontSize: opts.size ?? 9,
      fontColor: opts.color ?? '#1a1a1a',
      fontName: opts.bold ? 'Helvetica-Bold' : (opts.italic ? 'Helvetica-Oblique' : 'Helvetica'),
      alignment: opts.align ?? 'left',
      backgroundColor: opts.bg ?? '',
      lineHeight: opts.lineHeight ?? 1.3,
    });
    inputs[n] = content;
  }

  let y = 0;

  // ── HEADER ──────────────────────────────────────────────────────────────────
  addRect(0, 0, PW, 32, O);
  addRect(0, 26, PW, 6, O2);
  // decorative circles (simulated with rects — pdfme has no ellipse in free tier)
  addRect(178, -6, 26, 26, '#FF7A30');
  addRect(186, 8,  18, 18, '#FF9A50');

  addImg(ML, 7, 46, 15, logoBase64);

  addText('Proposta Comercial', 118, 9, 78, 7,
    { size: 12, bold: true, color: WHITE, align: 'right' });
  addText(p.date, 118, 18, 78, 5,
    { size: 8, color: '#FFD9C0', align: 'right' });
  addText('Gerada automaticamente pelo sistema KeaFlow', ML, 28, 120, 4,
    { size: 7.5, italic: true, color: '#FFD9C0' });
  addText('VALIDA POR 15 DIAS', 148, 28, 48, 4,
    { size: 7, bold: true, color: WHITE, align: 'right' });

  y = 38;

  // ── CLIENTE ─────────────────────────────────────────────────────────────────
  addRect(ML, y, CW, 22, OBGL);
  addLine(ML, y, CW, '#FED7AA', 0.5);
  addLine(ML, y + 22, CW, '#FED7AA', 0.5);

  const cw4 = CW / 4;
  const fields = [
    { label: 'CLIENTE',    value: p.clientName    || '—' },
    { label: 'E-MAIL',     value: p.clientEmail   || '—' },
    { label: 'CPF / CNPJ', value: p.clientCpfCnpj || '—' },
    { label: 'TELEFONE',   value: p.clientPhone   || '—' },
  ];
  fields.forEach((f, i) => {
    const cx = ML + i * cw4;
    addText(f.label, cx + 3, y + 3, cw4 - 4, 4,
      { size: 7, bold: true, color: O });
    addText(f.value, cx + 3, y + 9, cw4 - 4, 9,
      { size: 9.5, bold: true, color: DARK });
  });
  y += 27;

  // ── SEÇÕES ──────────────────────────────────────────────────────────────────
  function sectionTitle(title: string) {
    addRect(ML, y, 3, 6, O);
    addText(title.toUpperCase(), ML + 6, y + 1, CW - 6, 5,
      { size: 8, bold: true, color: O });
    addLine(ML, y + 7.5, CW, '#F0E8E0', 0.4);
    y += 11;
  }

  function dataRow(label: string, value: string, shade: boolean, bold = false) {
    if (shade) addRect(ML, y - 1, CW, 7.5, LBG);
    addText(label, ML + 3, y + 0.5, CW * 0.6, 5.5, { size: 9, color: GRAY });
    addText(value, ML + CW * 0.6, y + 0.5, CW * 0.4 - 3, 5.5,
      { size: 9, bold, color: DARK, align: 'right' });
    y += 7;
  }

  function subtotalRow(label: string, value: string) {
    addRect(ML, y - 1, CW, 8, OBGL);
    addText(label, ML + 3, y + 1, CW * 0.6, 6, { size: 9.5, bold: true, color: O });
    addText(value, ML + CW * 0.6, y + 1, CW * 0.4 - 3, 6,
      { size: 9.5, bold: true, color: O, align: 'right' });
    y += 10;
  }

  for (const sec of p.sections) {
    sectionTitle(sec.title);
    sec.rows.forEach((r, i) => dataRow(r.label, r.value, i % 2 === 0, r.bold));
    if (sec.subtotal) subtotalRow(sec.subtotal.label, sec.subtotal.value);
    y += 4;
  }

  // ── HOSPEDAGEM ───────────────────────────────────────────────────────────────
  if (p.hosting && p.hosting.length > 0) {
    sectionTitle('Planos de Hospedagem');

    addRect(ML, y, CW, 14, GBGL);
    addLine(ML, y, CW, '#86EFAC', 0.5);
    addLine(ML, y + 14, CW, '#86EFAC', 0.5);
    addText('Incluso no servico KeaLabs — Hospedagem gerenciada pela KeaLabs', ML + 4, y + 2.5, CW - 8, 5,
      { size: 8.5, bold: true, color: GGRN });
    addText('A hospedagem faz parte do escopo contratado e e de responsabilidade da KeaLabs.', ML + 4, y + 8.5, CW - 8, 5,
      { size: 8, color: GGRN });
    y += 18;

    p.hosting.forEach((h, i) => {
      if (i % 2 === 0) addRect(ML, y - 1, CW, 11, LBG);
      addText(h.label, ML + 3, y + 0.5, CW * 0.5, 5, { size: 9, bold: true, color: DARK });
      addText(h.spec,  ML + 3, y + 6,   CW * 0.5, 4, { size: 7.5, color: LGRAY });
      addText(h.price + '/mes', ML + CW * 0.5, y + 2, CW * 0.5 - 3, 6,
        { size: 9, bold: true, color: O, align: 'right' });
      y += 12;
    });

    addRect(ML, y, 56, 6, GREEN);
    addText('GERENCIADO PELA KEALABS', ML + 3, y + 1, 52, 4,
      { size: 7, bold: true, color: WHITE });
    y += 10;
  }

  // ── RESUMO FINANCEIRO ────────────────────────────────────────────────────────
  y += 4;
  addRect(ML, y, 3, 6, O);
  addText('RESUMO FINANCEIRO', ML + 6, y + 1, CW - 6, 5, { size: 8, bold: true, color: O });
  addLine(ML, y + 7.5, CW, '#F0E8E0', 0.4);
  y += 12;

  const cardW = (CW - 4) / 2;

  // card laranja
  addRect(ML, y, cardW, 28, O);
  addRect(ML, y, cardW, 10, '#FF6A1A');
  addText('INVESTIMENTO LIQUIDO (SETUP)', ML + 3, y + 2.5, cardW - 6, 5,
    { size: 7, bold: true, color: WHITE });
  addText(p.setupValue, ML + 3, y + 13, cardW - 6, 10,
    { size: 16, bold: true, color: WHITE });
  addText('valor liquido para a KeaLabs', ML + 3, y + 23, cardW - 6, 4,
    { size: 7.5, color: '#FFCBA4' });

  // card escuro
  const cx2 = ML + cardW + 4;
  addRect(cx2, y, cardW, 28, DARK);
  addRect(cx2, y, cardW, 10, '#374151');
  addText('COBRAR DO CLIENTE', cx2 + 3, y + 2.5, cardW - 6, 5,
    { size: 7, bold: true, color: WHITE });
  addText(`${p.installments}x ${p.installmentValue}`, cx2 + 3, y + 13, cardW - 6, 10,
    { size: 14, bold: true, color: WHITE });
  addText(`parcelado no cartao · total ${p.totalCharge}`, cx2 + 3, y + 23, cardW - 6, 4,
    { size: 7.5, color: '#9CA3AF' });
  y += 33;

  // notes
  addRect(ML, y, CW, 20, '#FAFAF9');
  addLine(ML, y, CW, '#E5E0D8', 0.4);
  addLine(ML, y + 20, CW, '#E5E0D8', 0.4);
  addText('Detalhes financeiros:', ML + 4, y + 3, CW - 8, 4,
    { size: 8, bold: true, color: DARK });
  addText(p.mdrInfo, ML + 4, y + 8.5, CW - 8, 4, { size: 7.5, color: GRAY });
  addText(
    `Liquido mes a mes: ${p.liquidMensal}   •   Liquido antecipado (2 dias): ${p.liquidAntecipado}`,
    ML + 4, y + 14, CW - 8, 4, { size: 7.5, color: GRAY }
  );
  y += 24;

  // ── FOOTER ───────────────────────────────────────────────────────────────────
  addRect(0, 284, PW, 1.5, O);
  addRect(0, 285.5, PW, 11.5, '#111827');
  addText('KeaLabs', ML, 287.5, 40, 5, { size: 9, bold: true, color: WHITE });
  addText('kealabs.cloud  ·  Tecnologia que transforma negocios', ML, 292, 100, 4,
    { size: 7.5, color: LGRAY });
  addText(`Gerado em ${new Date().toLocaleString('pt-BR')}`, 110, 290, 86, 4,
    { size: 7.5, color: LGRAY, align: 'right' });

  return { schemas, inputs };
}

// ── Geração ───────────────────────────────────────────────────────────────────
export async function generateProposalPdf(payload: PdfPayload): Promise<Buffer> {
  const { schemas, inputs } = buildDocument(payload);

  const template: Template = {
    basePdf: BLANK_PDF,
    schemas: [schemas as any],
  };

  const pdf = await generate({
    template,
    inputs: [inputs],
    plugins: { text, image, rectangle, line },
  });

  return Buffer.from(pdf);
}
