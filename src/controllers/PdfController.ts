import { Request, Response } from 'express';
import { PresupuestoService, ConfigService, PdfService } from '../services';

export class PdfController {
  constructor(
    private presupuestoService: PresupuestoService,
    private configService: ConfigService,
    private pdfService: PdfService
  ) {}

  /**
   * POST /api/pdf/:id - Generar y descargar PDF de presupuesto
   */
  generatePDF = async (req: Request, res: Response): Promise<void> => {
    try {
      const customerId = (req as any).auth.customerId as string;
      const pres = this.presupuestoService.getPresupuestoById(req.params.id, customerId);
      if (!pres) {
        res.status(404).json({ ok: false, error: 'No encontrado' });
        return;
      }

      const config = this.configService.getConfig(customerId);
      const pdfPath = await this.pdfService.generatePresupuestoPDF(pres, pres.items, config);

      // Actualizar pdf_path en la base de datos
      this.presupuestoService.updatePdfPath(pres.id, customerId, pdfPath);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${pres.numero}.pdf"`);
      res.sendFile(pdfPath);
    } catch (e: any) {
      console.error('PDF error:', e);
      res.status(500).json({ ok: false, error: e.message });
    }
  };
}
