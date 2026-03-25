import { Config } from '../models';
import Database from 'better-sqlite3';

export class ConfigService {
  private configModel: Config;

  constructor(private db: Database.Database) {
    this.configModel = new Config(db);
  }

  /**
   * Obtener toda la configuración
   */
  getConfig(customerId: string): Record<string, string> {
    return this.configModel.getAll(customerId);
  }

  /**
   * Guardar configuración
   */
  saveConfig(data: Record<string, string>, customerId: string): void {
    this.configModel.saveMultiple(data, customerId);
  }

  /**
   * Guardar logo path
   */
  setLogoPath(logoPath: string, customerId: string): void {
    this.configModel.set('logo_path', logoPath, customerId);
  }

  /**
   * Obtener logo path
   */
  getLogoPath(customerId: string): string | null {
    return this.configModel.get('logo_path', customerId);
  }
}
