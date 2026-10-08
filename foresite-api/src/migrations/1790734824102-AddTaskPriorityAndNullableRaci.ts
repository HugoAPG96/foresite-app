import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTaskPriorityAndNullableRaci1790734824102 implements MigrationInterface {
  name = 'AddTaskPriorityAndNullableRaci1790734824102';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE tasks ALTER COLUMN phase_id DROP NOT NULL`);
    await queryRunner.query(`ALTER TABLE tasks ALTER COLUMN accountable_id DROP NOT NULL`);
    await queryRunner.query(
      `ALTER TABLE tasks ADD COLUMN priority VARCHAR(10) NOT NULL DEFAULT 'media' CHECK (priority IN ('alta','media','baja'))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE tasks DROP COLUMN priority`);
    await queryRunner.query(`ALTER TABLE tasks ALTER COLUMN accountable_id SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE tasks ALTER COLUMN phase_id SET NOT NULL`);
  }
}
