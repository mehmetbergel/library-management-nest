import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialMigration1738420770113 implements MigrationInterface {
  name = 'InitialMigration1738420770113';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "book" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, "averageRating" numeric(5,2) NOT NULL DEFAULT '0', CONSTRAINT "PK_a3afef72ec8f80e6e5c310b28a4" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "loan" ("id" SERIAL NOT NULL, "score" numeric(5,2), "borrowedAt" TIMESTAMP NOT NULL DEFAULT now(), "returnedAt" TIMESTAMP, "userId" integer, "bookId" integer, CONSTRAINT "PK_4ceda725a323d254a5fd48bf95f" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "user" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "loan" ADD CONSTRAINT "FK_ef7a63b4c4f0edd90e389edb103" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "loan" ADD CONSTRAINT "FK_1465982ea6993042a656754f4cc" FOREIGN KEY ("bookId") REFERENCES "book"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "loan" DROP CONSTRAINT "FK_1465982ea6993042a656754f4cc"`,
    );
    await queryRunner.query(
      `ALTER TABLE "loan" DROP CONSTRAINT "FK_ef7a63b4c4f0edd90e389edb103"`,
    );
    await queryRunner.query(`DROP TABLE "user"`);
    await queryRunner.query(`DROP TABLE "loan"`);
    await queryRunner.query(`DROP TABLE "book"`);
  }
}
