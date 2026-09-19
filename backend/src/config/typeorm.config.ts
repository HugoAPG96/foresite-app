import { DataSource, DataSourceOptions } from 'typeorm';
import { config as loadEnv } from 'dotenv';

loadEnv();

/**
 * Configuración de conexión a PostgreSQL (Neon).
 * DB_SYNCHRONIZE debe quedar en "false" en producción: las migraciones
 * son la única forma segura de cambiar el esquema fuera de desarrollo local.
 */
export const typeOrmConfig: DataSourceOptions = {
  type: 'postgres',
  url: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  synchronize: process.env.DB_SYNCHRONIZE === 'true',
  entities: [__dirname + '/../modules/**/entities/*.entity{.ts,.js}'],
  migrations: [__dirname + '/../migrations/*{.ts,.js}'],
};

export default new DataSource(typeOrmConfig);
