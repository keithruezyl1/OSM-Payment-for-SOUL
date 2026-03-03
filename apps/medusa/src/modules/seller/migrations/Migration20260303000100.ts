import { Migration } from "@mikro-orm/migrations";

export class Migration20260303000100 extends Migration {
  override async up(): Promise<void> {
    this.addSql(`
      create table if not exists "seller" (
        "id" text not null,
        "name" text not null,
        "handle" text not null,
        "rating" double precision not null default 4.6,
        "review_count" integer not null default 0,
        "city" text not null,
        "state" text not null,
        "zip" text not null,
        "country_code" text not null default 'US',
        "logo_url" text null,
        "banner_url" text null,
        "deleted_at" timestamptz null,
        "created_at" timestamptz not null default now(),
        "updated_at" timestamptz not null default now(),
        constraint "seller_pkey" primary key ("id")
      );
    `);

    this.addSql(
      `create unique index if not exists "IDX_seller_handle_unique" on "seller" ("handle");`,
    );
  }

  override async down(): Promise<void> {
    this.addSql(`drop index if exists "IDX_seller_handle_unique";`);
    this.addSql(`drop table if exists "seller";`);
  }
}
