import { Migration } from "@mikro-orm/migrations";

export class Migration20260303000200 extends Migration {
  override async up(): Promise<void> {
    this.addSql(`
      alter table "seller"
      add column if not exists "deleted_at" timestamptz null;
    `);
  }

  override async down(): Promise<void> {
    this.addSql(`
      alter table "seller"
      drop column if exists "deleted_at";
    `);
  }
}

