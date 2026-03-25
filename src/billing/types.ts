export type LicenseValidationResponse = {
  ok: boolean;
  valid: boolean;
  needsRenewal: boolean;
  expiresAt?: string;
  devicesCount?: number;
  error?: string;
  customer?: { id: string; name: string };
};

