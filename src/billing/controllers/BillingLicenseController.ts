import { Request, Response } from 'express';
import { BillingLicenseService } from '../services/BillingLicenseService';

function getAdminKey(): string {
  return process.env.LICENSE_ADMIN_KEY || process.env.ADMIN_KEY || 'admin';
}

function isAuthorized(req: Request): boolean {
  const adminKey = getAdminKey();
  const headerAuth = (req.headers.authorization as string) || '';
  const xAdminKey = (req.headers['x-admin-key'] as string) || '';
  return headerAuth === `Bearer ${adminKey}` || xAdminKey === adminKey;
}

export class BillingLicenseController {
  constructor(private billingLicenseService: BillingLicenseService) {}

  validate = (req: Request, res: Response): void => {
    try {
      const { licenseKey, machineId } = req.body;
      const result = this.billingLicenseService.validateLicense(licenseKey, machineId ?? '');
      res.json(result);
    } catch (e: any) {
      res.status(500).json({ ok: false, error: e.message });
    }
  };

  createLicense = (req: Request, res: Response): void => {
    try {
      if (!isAuthorized(req)) { res.status(403).json({ ok: false, error: 'Unauthorized' }); return; }
      const { customerId, days, max_devices } = req.body;
      const result = this.billingLicenseService.createLicense(customerId, days, max_devices);
      res.json(result);
    } catch (e: any) {
      res.status(500).json({ ok: false, error: e.message });
    }
  };

  renewLicense = (req: Request, res: Response): void => {
    try {
      if (!isAuthorized(req)) { res.status(403).json({ ok: false, error: 'Unauthorized' }); return; }
      const { licenseKey, days } = req.body;
      const result = this.billingLicenseService.renewLicense(licenseKey, days);
      res.json(result);
    } catch (e: any) {
      res.status(500).json({ ok: false, error: e.message });
    }
  };

  revokeLicense = (req: Request, res: Response): void => {
    try {
      if (!isAuthorized(req)) { res.status(403).json({ ok: false, error: 'Unauthorized' }); return; }
      const { licenseKey } = req.body;
      const result = this.billingLicenseService.revokeLicense(licenseKey);
      res.json(result);
    } catch (e: any) {
      res.status(500).json({ ok: false, error: e.message });
    }
  };

  createCustomer = (req: Request, res: Response): void => {
    try {
      if (!isAuthorized(req)) { res.status(403).json({ ok: false, error: 'Unauthorized' }); return; }
      const { name, email, company } = req.body;
      const result = this.billingLicenseService.createCustomer(name, email, company);
      res.json(result);
    } catch (e: any) {
      res.status(500).json({ ok: false, error: e.message });
    }
  };

  getCustomers = (_req: Request, res: Response): void => {
    try {
      const customers = this.billingLicenseService.getCustomers();
      res.json({ ok: true, customers });
    } catch (e: any) {
      res.status(500).json({ ok: false, error: e.message });
    }
  };

  getLicenses = (req: Request, res: Response): void => {
    try {
      const customerId = req.query.customerId as string | undefined;
      const licenses = this.billingLicenseService.getLicenses(customerId);
      res.json({ ok: true, licenses });
    } catch (e: any) {
      res.status(500).json({ ok: false, error: e.message });
    }
  };

  getMachines = (req: Request, res: Response): void => {
    try {
      const { licenseKey } = req.query as { licenseKey: string };
      if (!licenseKey) { res.status(400).json({ ok: false, error: 'licenseKey requerido' }); return; }
      const machines = this.billingLicenseService.getMachines(licenseKey);
      res.json({ ok: true, machines });
    } catch (e: any) {
      res.status(500).json({ ok: false, error: e.message });
    }
  };

  removeMachine = (req: Request, res: Response): void => {
    try {
      if (!isAuthorized(req)) { res.status(403).json({ ok: false, error: 'Unauthorized' }); return; }
      const { licenseKey, machineId } = req.body;
      const result = this.billingLicenseService.removeMachine(licenseKey, machineId);
      res.json(result);
    } catch (e: any) {
      res.status(500).json({ ok: false, error: e.message });
    }
  };
}

