/**
 * @typedef {import('typeorm').MigrationInterface} MigrationInterface
 * @typedef {import('typeorm').QueryRunner} QueryRunner
 */

/**
 * @class
 * @implements {MigrationInterface}
 */
module.exports = class CreateSchema1794224103595 {
    name = 'CreateSchema1794224103595'

    /**
     * @param {QueryRunner} queryRunner
     */
    async up(queryRunner) {
        await queryRunner.query(`CREATE TABLE "brands" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "name" varchar NOT NULL, "logo" varchar NOT NULL, "country" varchar NOT NULL, "foundation_year" integer NOT NULL, "luxury" boolean NOT NULL DEFAULT (0))`);
        await queryRunner.query(`CREATE TABLE "models" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "name" varchar NOT NULL, "available_colors" varchar NOT NULL, "year" integer NOT NULL, "price" float NOT NULL, "brandId" integer NOT NULL)`);
        await queryRunner.query(`CREATE TABLE "sales" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "customer" varchar NOT NULL, "date" datetime NOT NULL, "price" float NOT NULL, "modelId" integer NOT NULL)`);
        await queryRunner.query(`CREATE TABLE "users" ("username" varchar PRIMARY KEY NOT NULL, "name" varchar NOT NULL, "password" varchar NOT NULL, "registrationDate" datetime NOT NULL)`);
        await queryRunner.query(`CREATE TABLE "temporary_models" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "name" varchar NOT NULL, "available_colors" varchar NOT NULL, "year" integer NOT NULL, "price" float NOT NULL, "brandId" integer NOT NULL, CONSTRAINT "FK_1f36b4eb435f410c6749378cf8c" FOREIGN KEY ("brandId") REFERENCES "brands" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "temporary_models"("id", "name", "available_colors", "year", "price", "brandId") SELECT "id", "name", "available_colors", "year", "price", "brandId" FROM "models"`);
        await queryRunner.query(`DROP TABLE "models"`);
        await queryRunner.query(`ALTER TABLE "temporary_models" RENAME TO "models"`);
        await queryRunner.query(`CREATE TABLE "temporary_sales" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "customer" varchar NOT NULL, "date" datetime NOT NULL, "price" float NOT NULL, "modelId" integer NOT NULL, CONSTRAINT "FK_2d39e9b53e83788528f3db7522b" FOREIGN KEY ("modelId") REFERENCES "models" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "temporary_sales"("id", "customer", "date", "price", "modelId") SELECT "id", "customer", "date", "price", "modelId" FROM "sales"`);
        await queryRunner.query(`DROP TABLE "sales"`);
        await queryRunner.query(`ALTER TABLE "temporary_sales" RENAME TO "sales"`);
    }

    /**
     * @param {QueryRunner} queryRunner
     */
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "sales" RENAME TO "temporary_sales"`);
        await queryRunner.query(`CREATE TABLE "sales" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "customer" varchar NOT NULL, "date" datetime NOT NULL, "price" float NOT NULL, "modelId" integer NOT NULL)`);
        await queryRunner.query(`INSERT INTO "sales"("id", "customer", "date", "price", "modelId") SELECT "id", "customer", "date", "price", "modelId" FROM "temporary_sales"`);
        await queryRunner.query(`DROP TABLE "temporary_sales"`);
        await queryRunner.query(`ALTER TABLE "models" RENAME TO "temporary_models"`);
        await queryRunner.query(`CREATE TABLE "models" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "name" varchar NOT NULL, "available_colors" varchar NOT NULL, "year" integer NOT NULL, "price" float NOT NULL, "brandId" integer NOT NULL)`);
        await queryRunner.query(`INSERT INTO "models"("id", "name", "available_colors", "year", "price", "brandId") SELECT "id", "name", "available_colors", "year", "price", "brandId" FROM "temporary_models"`);
        await queryRunner.query(`DROP TABLE "temporary_models"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TABLE "sales"`);
        await queryRunner.query(`DROP TABLE "models"`);
        await queryRunner.query(`DROP TABLE "brands"`);
    }
}
