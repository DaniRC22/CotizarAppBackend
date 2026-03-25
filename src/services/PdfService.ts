import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs';
import Database from 'better-sqlite3';
import { type IPresupuesto, type IPresupuestoItem } from '../models';

const PDF_DIR = process.env.PDFS_PATH || path.join(__dirname, '../../pdfs');
if (!fs.existsSync(PDF_DIR)) fs.mkdirSync(PDF_DIR, { recursive: true });

export class PdfService {
  constructor(private db: Database.Database) {}

  /**
   * Generar PDF de presupuesto
   */
  async generatePresupuestoPDF(
    presupuesto: IPresupuesto,
    items: IPresupuestoItem[],
    config: Record<string, string>
  ): Promise<string> {
    const html = this.buildHTML(presupuesto, items, config);
    // Cada tenant guarda sus PDFs en un subdirectorio para evitar colisiones.
    const customerDir = path.join(PDF_DIR, presupuesto.customer_id);
    if (!fs.existsSync(customerDir)) fs.mkdirSync(customerDir, { recursive: true });
    const pdfPath = path.join(
      customerDir,
      `${presupuesto.numero.replace(/[^a-zA-Z0-9-]/g, '_')}.pdf`
    );

    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    });

    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'domcontentloaded' });
      await page.pdf({
        path: pdfPath,
        format: 'A4',
        printBackground: true,
        margin: { top: '0', bottom: '0', left: '0', right: '0' },
      });
    } finally {
      await browser.close();
    }

    return pdfPath;
  }

  /**
   * Construir HTML del presupuesto
   */
  private buildHTML(
    pres: IPresupuesto,
    items: IPresupuestoItem[],
    config: Record<string, string>
  ): string {
    const empresa = config.empresa_nombre || 'Mi Empresa';
    const domicilio = config.empresa_domicilio || '';
    const tel = config.empresa_telefono || '';
    const email = config.empresa_email || '';
    const web = config.empresa_web || '';
    const cuit = config.empresa_cuit || '';
    const condicion_iva = config.empresa_condicion_iva || 'Responsable Inscripto';
    const primaryColor = config.color_primario || '#B8860B';
    const accentColor = config.color_acento || '#1a1a2e';

    const logoHTML = this.getLogoHTML(config, empresa);
    const itemRows = items.map((item, idx) => this.buildItemRow(item, idx)).join('');
    const discountData = this.calculateDiscountData(pres);
    const conditionSections = this.buildConditionSections(pres);

    return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<style>
  ${this.getStyles(primaryColor, accentColor)}
</style>
</head>
<body>
<div class="page">

  <header class="header">
    ${logoHTML}
    <div class="empresa-info">
      <div class="empresa-nombre">${empresa}</div>
      ${domicilio ? `<div class="empresa-data">${domicilio}</div>` : ''}
      ${tel ? `<div class="empresa-data">Tel: ${tel}</div>` : ''}
      ${email ? `<div class="empresa-data">${email}</div>` : ''}
      ${web ? `<div class="empresa-data">${web}</div>` : ''}
      ${cuit ? `<div class="empresa-cuit">CUIT: ${cuit} — ${condicion_iva}</div>` : ''}
    </div>
  </header>

  <div class="doc-band">
    <div class="doc-titulo">PRESUPUESTO</div>
    <div class="doc-num-wrap">
      <div class="doc-numero">${pres.numero}</div>
      <div class="doc-estado">${this.getStatusLabel(pres.estado)}</div>
    </div>
  </div>

  <div class="datos-grid">
    <div class="datos-box">
      <div class="datos-box-label">Datos del Cliente</div>
      <div class="dato-row"><span class="dato-key">Cliente:</span><span class="dato-val">${pres.cliente_nombre}</span></div>
      ${pres.cliente_telefono ? `<div class="dato-row"><span class="dato-key">Teléfono:</span><span class="dato-val">${pres.cliente_telefono}</span></div>` : ''}
      ${pres.cliente_email ? `<div class="dato-row"><span class="dato-key">Email:</span><span class="dato-val">${pres.cliente_email}</span></div>` : ''}
      ${pres.cliente_direccion ? `<div class="dato-row"><span class="dato-key">Dirección:</span><span class="dato-val">${pres.cliente_direccion}</span></div>` : ''}
    </div>
    <div class="datos-box">
      <div class="datos-box-label">Datos del Presupuesto</div>
      <div class="dato-row"><span class="dato-key">Fecha:</span><span class="dato-val">${this.formatDate(pres.fecha)}</span></div>
      <div class="dato-row"><span class="dato-key">Válido:</span><span class="dato-val">${pres.validez_dias} días</span></div>
      <div class="dato-row"><span class="dato-key">Vencimiento:</span><span class="dato-val">${this.calculateExpiryDate(pres.fecha, pres.validez_dias)}</span></div>
    </div>
  </div>

  <div class="items-section">
    <div class="items-title">Detalle de artículos y servicios</div>
    <table>
      <thead>
        <tr>
          <th class="th-cant">Cantidad</th>
          <th>Descripción</th>
          <th class="th-precio-unit">P. Unitario</th>
          <th class="th-subtotal">Subtotal</th>
        </tr>
      </thead>
      <tbody>
        ${itemRows}
      </tbody>
    </table>
  </div>

  <div class="bottom-section">
    <div class="condiciones">
      ${conditionSections}
      ${pres.notas ? `
        <div class="cond-block">
          <div class="cond-title">Notas</div>
          <div class="notas-box">${pres.notas}</div>
        </div>
      ` : ''}
    </div>

    <div>
      <div class="totales-box">
        <div class="totales-title">RESUMEN</div>
        <div class="total-row">
          <span class="total-label">Subtotal</span>
          <span class="total-val">$ ${this.formatMoney(pres.subtotal)}</span>
        </div>
        ${discountData.descuentoPct > 0 ? `
          <div class="total-row">
            <span class="total-label">Descuento (${discountData.descuentoPct}%)</span>
            <span class="total-val" style="color:#c0392b">- $ ${this.formatMoney(discountData.descuentoMonto)}</span>
          </div>
        ` : ''}
        ${discountData.ivaPct > 0 ? `
          <div class="total-row">
            <span class="total-label">IVA (${discountData.ivaPct}%)</span>
            <span class="total-val">$ ${this.formatMoney(discountData.ivaMonto)}</span>
          </div>
        ` : ''}
        <div class="total-final">
          <span class="total-label">TOTAL</span>
          <span class="total-val">$ ${this.formatMoney(pres.total)}</span>
        </div>
      </div>
    </div>
  </div>

  <footer class="footer">
    <strong>${empresa}</strong>
    ${cuit ? ` — CUIT: ${cuit}` : ''}
    ${tel ? ` — Tel: ${tel}` : ''}
    ${email ? ` — ${email}` : ''}
    <br/>Este presupuesto tiene validez de ${pres.validez_dias} días a partir de la fecha de emisión.
  </footer>

</div>
</body>
</html>`;
  }

  /**
   * Obtener HTML del logo
   */
  private getLogoHTML(config: Record<string, string>, empresa: string): string {
    if (!config.logo_path) {
      return `<div class="logo-placeholder">${empresa}</div>`;
    }

    // `logo_path` se guarda como URL tipo `/uploads/<archivo>`.
    // Resolvemos al directorio físico usando UPLOADS_PATH (funciona en cualquier entorno cloud).
    const uploadsDir = process.env.UPLOADS_PATH || path.join(__dirname, '../../uploads');
    const filename = path.basename(config.logo_path);
    const logoFile = path.join(uploadsDir, filename);
    if (!fs.existsSync(logoFile)) {
      return `<div class="logo-placeholder">${empresa}</div>`;
    }

    const ext = path.extname(logoFile).replace('.', '');
    const mimeMap: Record<string, string> = { jpg: 'jpeg', jpeg: 'jpeg', png: 'png', webp: 'webp', svg: 'svg+xml' };
    const mime = mimeMap[ext] || 'png';
    const buf = fs.readFileSync(logoFile);
    const logoBase64 = `data:image/${mime};base64,${buf.toString('base64')}`;

    return `<img src="${logoBase64}" class="logo" alt="Logo" />`;
  }

  /**
   * Construir fila de item
   */
  private buildItemRow(item: IPresupuestoItem, idx: number): string {
    const cantidad = Number(item.cantidad) % 1 === 0 ? Number(item.cantidad).toFixed(0) : Number(item.cantidad).toFixed(2);
    return `
    <tr class="${idx % 2 === 0 ? 'row-even' : 'row-odd'}">
      <td class="td-cant">${cantidad} ${item.unidad}</td>
      <td class="td-desc">
        <span class="item-desc">${item.descripcion}</span>
        ${item.detalle ? `<span class="item-detalle">${item.detalle}</span>` : ''}
      </td>
      <td class="td-precio">$ ${this.formatMoney(Number(item.precio_unitario))}</td>
      <td class="td-sub">$ ${this.formatMoney(Number(item.subtotal))}</td>
    </tr>
  `;
  }

  /**
   * Construir secciones de condiciones
   */
  private buildConditionSections(pres: IPresupuesto): string {
    let html = '';

    if (pres.incluye) {
      const incluyeLines = (pres.incluye || '').split('\n').filter(l => l.trim()).map(l => `<li>✓ ${l.trim()}</li>`).join('');
      if (incluyeLines) {
        html += `
        <div class="cond-block">
          <div class="cond-title">✓ Incluye</div>
          <ul class="cond-list">${incluyeLines}</ul>
        </div>
      `;
      }
    }

    if (pres.no_incluye) {
      const noIncluyeLines = (pres.no_incluye || '').split('\n').filter(l => l.trim()).map(l => `<li>✗ ${l.trim()}</li>`).join('');
      if (noIncluyeLines) {
        html += `
        <div class="cond-block">
          <div class="cond-title">✗ No incluye</div>
          <ul class="cond-list">${noIncluyeLines}</ul>
        </div>
      `;
      }
    }

    return html;
  }

  /**
   * Calcular datos de descuento
   */
  private calculateDiscountData(pres: IPresupuesto) {
    const descuentoPct = Number(pres.descuento_pct);
    const ivaPct = Number(pres.iva_pct);
    const subtotal = Number(pres.subtotal);
    const descuentoMonto = subtotal * (descuentoPct / 100);
    const base = subtotal - descuentoMonto;
    const ivaMonto = base * (ivaPct / 100);

    return { descuentoPct, descuentoMonto, ivaPct, ivaMonto };
  }

  /**
   * Obtener estilos CSS
   */
  private getStyles(primaryColor: string, accentColor: string): string {
    return `
  @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;600;700;800&family=Source+Sans+3:wght@300;400;600&display=swap');
  
  * { box-sizing: border-box; margin: 0; padding: 0; }
  
  body {
    font-family: 'Source Sans 3', sans-serif;
    font-size: 11px;
    color: #1a1a1a;
    background: #fff;
    padding: 0;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  .page {
    width: 210mm;
    min-height: 297mm;
    padding: 14mm 14mm 14mm 14mm;
    display: flex;
    flex-direction: column;
  }

  .header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 10mm;
    padding-bottom: 6mm;
    border-bottom: 3px solid ${primaryColor};
  }

  .logo { max-height: 70px; max-width: 200px; object-fit: contain; }
  .logo-placeholder {
    font-family: 'Barlow Condensed', sans-serif;
    font-size: 26px;
    font-weight: 800;
    color: ${accentColor};
    letter-spacing: -0.5px;
  }

  .empresa-info {
    text-align: right;
    line-height: 1.6;
  }
  .empresa-nombre {
    font-family: 'Barlow Condensed', sans-serif;
    font-size: 18px;
    font-weight: 700;
    color: ${accentColor};
    margin-bottom: 3px;
  }
  .empresa-data { font-size: 10px; color: #555; }
  .empresa-cuit { font-size: 10px; color: #777; }

  .doc-band {
    background: ${accentColor};
    color: #fff;
    padding: 8px 16px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 6mm;
    border-radius: 3px;
  }
  .doc-titulo {
    font-family: 'Barlow Condensed', sans-serif;
    font-size: 28px;
    font-weight: 800;
    letter-spacing: 2px;
    color: ${primaryColor};
  }
  .doc-num-wrap { text-align: right; }
  .doc-numero {
    font-family: 'Barlow Condensed', sans-serif;
    font-size: 22px;
    font-weight: 700;
    color: #fff;
  }
  .doc-estado {
    display: inline-block;
    font-size: 9px;
    font-weight: 600;
    letter-spacing: 1.5px;
    padding: 2px 8px;
    border-radius: 2px;
    background: ${primaryColor};
    color: ${accentColor};
    margin-top: 2px;
  }

  .datos-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 5mm;
    margin-bottom: 6mm;
  }
  .datos-box {
    border: 1px solid #e0e0e0;
    border-radius: 4px;
    padding: 5px 10px;
  }
  .datos-box-label {
    font-family: 'Barlow Condensed', sans-serif;
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    color: ${primaryColor};
    margin-bottom: 4px;
    border-bottom: 1px solid #f0f0f0;
    padding-bottom: 3px;
  }
  .dato-row {
    display: flex;
    gap: 6px;
    margin-bottom: 2px;
    font-size: 10.5px;
  }
  .dato-key { color: #888; min-width: 65px; font-size: 10px; }
  .dato-val { color: #1a1a1a; font-weight: 600; }

  .items-section { margin-bottom: 5mm; flex: 1; }
  .items-title {
    font-family: 'Barlow Condensed', sans-serif;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    color: #888;
    margin-bottom: 3mm;
  }

  table { width: 100%; border-collapse: collapse; }
  thead tr { background: ${accentColor}; color: #fff; }
  thead th {
    font-family: 'Barlow Condensed', sans-serif;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 1px;
    padding: 7px 10px;
    text-align: left;
  }
  thead th:last-child { text-align: right; }
  thead th.th-precio { text-align: right; }
  thead th.th-cant { text-align: center; width: 80px; }
  thead th.th-subtotal { text-align: right; width: 90px; }
  thead th.th-precio-unit { text-align: right; width: 90px; }

  .row-even { background: #fafafa; }
  .row-odd { background: #fff; }
  td { padding: 6px 10px; border-bottom: 1px solid #f0f0f0; vertical-align: top; }

  .td-cant { text-align: center; color: #555; font-size: 10.5px; }
  .td-desc { }
  .td-precio { text-align: right; font-size: 10.5px; color: #444; white-space: nowrap; }
  .td-sub { text-align: right; font-weight: 600; font-size: 10.5px; white-space: nowrap; }

  .item-desc { display: block; font-weight: 600; color: #1a1a1a; }
  .item-detalle { display: block; font-size: 9.5px; color: #777; margin-top: 1px; line-height: 1.3; }

  .bottom-section {
    display: grid;
    grid-template-columns: 1fr 200px;
    gap: 5mm;
    margin-top: 4mm;
    align-items: start;
  }

  .condiciones { }
  .cond-block { margin-bottom: 4mm; }
  .cond-title {
    font-family: 'Barlow Condensed', sans-serif;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    color: ${primaryColor};
    margin-bottom: 3px;
    border-bottom: 1px solid ${primaryColor};
    padding-bottom: 2px;
  }
  .cond-list { list-style: none; }
  .cond-list li {
    font-size: 10px;
    color: #444;
    padding: 1.5px 0;
    line-height: 1.4;
  }
  .notas-box {
    font-size: 10px;
    color: #555;
    background: #f8f8f8;
    border-left: 3px solid ${primaryColor};
    padding: 6px 10px;
    line-height: 1.5;
    border-radius: 0 3px 3px 0;
  }

  .totales-box {
    border: 1px solid #e0e0e0;
    border-radius: 4px;
    overflow: hidden;
  }
  .totales-title {
    background: ${accentColor};
    color: ${primaryColor};
    font-family: 'Barlow Condensed', sans-serif;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 1.5px;
    padding: 6px 12px;
    text-align: center;
  }
  .total-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 5px 12px;
    border-bottom: 1px solid #f0f0f0;
    font-size: 10.5px;
  }
  .total-row:last-child { border-bottom: none; }
  .total-label { color: #666; }
  .total-val { font-weight: 600; text-align: right; }
  .total-final {
    background: ${primaryColor};
    padding: 8px 12px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .total-final .total-label {
    font-family: 'Barlow Condensed', sans-serif;
    font-size: 14px;
    font-weight: 700;
    color: ${accentColor};
    letter-spacing: 1px;
  }
  .total-final .total-val {
    font-family: 'Barlow Condensed', sans-serif;
    font-size: 16px;
    font-weight: 800;
    color: ${accentColor};
  }

  .footer {
    margin-top: auto;
    padding-top: 5mm;
    border-top: 1px solid #e0e0e0;
    text-align: center;
    font-size: 9px;
    color: #aaa;
    line-height: 1.6;
  }
  .footer strong { color: #888; }
    `;
  }

  /**
   * Formatear dinero
   */
  private formatMoney(n: number): string {
    return new Intl.NumberFormat('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
  }

  /**
   * Formatear fecha
   */
  private formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' });
  }

  /**
   * Calcular fecha de vencimiento
   */
  private calculateExpiryDate(dateStr: string, days: number): string {
    const expiryDate = new Date(new Date(dateStr).getTime() + days * 86400000);
    return expiryDate.toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' });
  }

  /**
   * Obtener etiqueta de estado
   */
  private getStatusLabel(estado: string): string {
    const estadoMap: Record<string, string> = {
      borrador: 'BORRADOR',
      enviado: 'ENVIADO',
      aceptado: 'ACEPTADO',
      rechazado: 'RECHAZADO',
    };
    return estadoMap[estado] || estado.toUpperCase();
  }
}
