import { Router } from 'express';
import billingDb from '../billing/billingDb';
import { BillingLicenseService } from '../billing/services/BillingLicenseService';
import { BillingLicenseController } from '../billing/controllers/BillingLicenseController';
import { validate } from '../middlewares/validate';
import {
  ValidateLicenseSchema,
  CreateLicenseSchema,
  RenewLicenseSchema,
  RevokeLicenseSchema,
  CreateCustomerSchema,
  RemoveMachineSchema,
  UpdateMaxDevicesSchema,
} from '../validation/schemas';

const router = Router();

const billingLicenseService = new BillingLicenseService(billingDb);
const billingLicenseController = new BillingLicenseController(billingLicenseService);

router.post('/license/validate',         validate(ValidateLicenseSchema),     billingLicenseController.validate);
router.post('/license/create',          validate(CreateLicenseSchema),       billingLicenseController.createLicense);
router.post('/license/renew',           validate(RenewLicenseSchema),        billingLicenseController.renewLicense);
router.post('/license/revoke',          validate(RevokeLicenseSchema),       billingLicenseController.revokeLicense);
router.post('/license/remove-machine',  validate(RemoveMachineSchema),       billingLicenseController.removeMachine);
router.post('/license/update-max-devices', validate(UpdateMaxDevicesSchema), billingLicenseController.updateMaxDevices);
router.post('/customer/create',         validate(CreateCustomerSchema),      billingLicenseController.createCustomer);

// Consultas (solo admin)
router.get('/customers',        billingLicenseController.getCustomers);
router.get('/licenses',         billingLicenseController.getLicenses);
router.get('/license/machines', billingLicenseController.getMachines);

export default router;

