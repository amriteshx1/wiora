create table if not exists credit_accounts (
  user_id text primary key references "user"(id) on delete cascade,
  balance integer not null default 0,
  updated_at timestamp not null default now()
);

create table if not exists credit_ledger (
  id text primary key,
  user_id text not null references "user"(id) on delete cascade,
  delta integer not null,
  balance_after integer not null,
  entry_type text not null,
  plan text,
  run_id text references simulation_runs(id) on delete set null,
  polar_order_id text,
  polar_checkout_id text,
  polar_product_id text,
  created_at timestamp not null default now()
);

create index if not exists credit_ledger_user_id_idx on credit_ledger (user_id);
create unique index if not exists credit_ledger_order_entry on credit_ledger (polar_order_id, entry_type);
create unique index if not exists credit_ledger_run_entry on credit_ledger (run_id, entry_type);
create unique index if not exists simulation_runs_one_open_idx on simulation_runs (preparation_id) where status in ('unpaid', 'paid', 'active');
