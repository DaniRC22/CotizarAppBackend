import { signJwtHS256 } from '../utils/jwt';
import { getJwtSecret } from '../utils/jwtSecret';
import billingDb from '../billing/billingDb';
import { BillingLicenseService } from '../billing/services/BillingLicenseService';
import type { LicenseValidationResponse } from '../billing/types';

type LicenseServerValidateResponse = LicenseValidationResponse;

export class AuthService {
  private billingLicenseService: BillingLicenseService;

  constructor() {
    this.billingLicenseService = new BillingLicenseService(billingDb);
  }

  async activate(licenseKey: string, machineId: string): Promise<{
    ok: boolean;
    token?: string;
    expiresAt?: string;
    needsRenewal?: boolean;
    customer?: { id: string; name: string };
    error?: string;
  }> {
    const res = await this.validateWithLicenseServer(licenseKey, machineId);
    if (!res.valid) {
      return { ok: false, error: res.error || 'Licencia inválida o expirada' };
    }

    const token = this.issueToken({ licenseKey, machineId, customerId: res.customer!.id });
    return { ok: true, token, expiresAt: res.expiresAt, needsRenewal: res.needsRenewal, customer: res.customer };
  }

  async refresh(licenseKey: string, machineId: string): Promise<{
    ok: boolean;
    token?: string;
    expiresAt?: string;
    needsRenewal?: boolean;
    customer?: { id: string; name: string };
    error?: string;
  }> {
    // En este modelo el refresh vuelve a validar la licencia del servidor.
    return this.activate(licenseKey, machineId);
  }

  private issueToken(params: { licenseKey: string; machineId: string; customerId: string }) {
    const secret = getJwtSecret();
    const now = Math.floor(Date.now() / 1000);
    const exp = now + 12 * 60 * 60; // 12h

    return signJwtHS256({
      secret,
      payload: {
        iss: 'presupuestospro',
        aud: 'presupuestospro',
        sub: params.licenseKey,
        licenseKey: params.licenseKey,
        machineId: params.machineId,
        customerId: params.customerId,
        exp,
      },
    });
  }

  private async validateWithLicenseServer(
    licenseKey: string,
    machineId: string
  ): Promise<LicenseServerValidateResponse> {
    // Unificado: la lógica de billing/licencias vive dentro del backend.
    return this.billingLicenseService.validateLicense(licenseKey, machineId);
  }
}

