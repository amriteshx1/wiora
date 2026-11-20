import { sql } from "./sql";

async function main() {
  await sql.unsafe("ALTER TABLE preparations ADD COLUMN IF NOT EXISTS research_input_hash text");
  await sql.unsafe(`
    CREATE TABLE IF NOT EXISTS preparation_credit_accounts (
      user_id text PRIMARY KEY REFERENCES "user"(id) ON DELETE CASCADE,
      balance integer NOT NULL DEFAULT 0,
      updated_at timestamp NOT NULL DEFAULT now()
    )
  `);
  await sql.unsafe(`
    CREATE TABLE IF NOT EXISTS preparation_credit_ledger (
      id text PRIMARY KEY,
      user_id text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
      delta integer NOT NULL,
      balance_after integer NOT NULL,
      entry_type text NOT NULL,
      plan text,
      preparation_id text REFERENCES preparations(id) ON DELETE SET NULL,
      polar_order_id text,
      polar_checkout_id text,
      polar_product_id text,
      created_at timestamp NOT NULL DEFAULT now()
    )
  `);
  await sql.unsafe("CREATE INDEX IF NOT EXISTS prep_credit_ledger_user_id_idx ON preparation_credit_ledger(user_id)");
  await sql.unsafe("CREATE INDEX IF NOT EXISTS prep_credit_ledger_prep_id_idx ON preparation_credit_ledger(preparation_id)");
  await sql.unsafe("CREATE UNIQUE INDEX IF NOT EXISTS prep_credit_ledger_order_entry ON preparation_credit_ledger(polar_order_id, entry_type)");

  const cols = await sql`
    select column_name from information_schema.columns
    where table_name = 'preparations' and column_name = 'research_input_hash'
  `;
  const tables = await sql`
    select table_name from information_schema.tables
    where table_name in ('preparation_credit_accounts', 'preparation_credit_ledger')
    order by table_name
  `;
  console.log(`research_input_hash=${cols.length} tables=${tables.map((row) => row.table_name).join(",")}`);
}

main().then(() => process.exit(0)).catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
