import { randomUUID } from 'crypto';
import { BeforeInsert, PrimaryColumn } from 'typeorm';

/**
 * Entidad base: el UUID se genera en la aplicación (crypto.randomUUID) y se guarda
 * como VARCHAR(36). Así no depende de extensiones de PostgreSQL (uuid-ossp/pgcrypto)
 * ni del DEFAULT de la columna — causa del error "null value in column id".
 */
export abstract class BaseEntity {
  @PrimaryColumn({ type: 'varchar', length: 36 })
  id: string;

  @BeforeInsert()
  generateId() {
    if (!this.id) this.id = randomUUID();
  }
}
