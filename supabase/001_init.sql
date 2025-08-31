-- MIT License
-- Autor atual: David Assef
-- Descrição: Migração inicial - Tabelas, índices e RLS para ReciboFast
-- Data: 29-08-2025

-- Extensões úteis
create extension if not exists pgcrypto;

-- Tabelas principais
create table if not exists rf_profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    nome text,
    documento text,
    created_at timestamptz default now()
);

create table if not exists rf_payers (
    id uuid primary key default gen_random_uuid(),
    owner_id uuid not null references auth.users(id) on delete cascade,
    nome text not null,
    documento text,
    contato text,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

create table if not exists rf_contracts (
    id uuid primary key default gen_random_uuid(),
    owner_id uuid not null references auth.users(id) on delete cascade,
    payer_id uuid references rf_payers(id) on delete set null,
    descricao text,
    valor_mensal numeric(12,2) not null default 0,
    vencimento_dia int,
    ativo boolean default true,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

create table if not exists rf_incomes (
    id uuid primary key default gen_random_uuid(),
    owner_id uuid not null references auth.users(id) on delete cascade,
    contract_id uuid references rf_contracts(id) on delete set null,
    categoria text,
    competencia text not null,
    valor numeric(12,2) not null,
    status text not null default 'pendente',
    due_date date,
    total_pago numeric(12,2) not null default 0,
    deleted_at timestamptz,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

create table if not exists rf_payments (
    id uuid primary key default gen_random_uuid(),
    income_id uuid not null references rf_incomes(id) on delete cascade,
    valor numeric(12,2) not null,
    pago_em timestamptz not null default now(),
    metodo text,
    obs text,
    created_at timestamptz default now()
);

create table if not exists rf_receipts (
    id uuid primary key default gen_random_uuid(),
    owner_id uuid not null references auth.users(id) on delete cascade,
    income_id uuid references rf_incomes(id) on delete set null,
    numero bigserial,
    emitido_em timestamptz default now(),
    pdf_url text,
    hash text,
    created_at timestamptz default now()
);

create table if not exists rf_signatures (
    id uuid primary key default gen_random_uuid(),
    owner_id uuid not null references auth.users(id) on delete cascade,
    file_path text not null,
    width_px int,
    height_px int,
    created_at timestamptz default now()
);

create table if not exists rf_settings (
    owner_id uuid primary key references auth.users(id) on delete cascade,
    timezone text,
    locale text,
    template_padrao text
);

-- Índices
create index if not exists idx_payers_owner on rf_payers(owner_id);
create index if not exists idx_contracts_owner on rf_contracts(owner_id);
create index if not exists idx_incomes_owner on rf_incomes(owner_id);
create index if not exists idx_incomes_competencia on rf_incomes(owner_id, competencia);
create index if not exists idx_incomes_due on rf_incomes(owner_id, due_date);
create index if not exists idx_receipts_owner on rf_receipts(owner_id);

-- RLS
alter table rf_payers enable row level security;
alter table rf_contracts enable row level security;
alter table rf_incomes enable row level security;
alter table rf_payments enable row level security;
alter table rf_receipts enable row level security;
alter table rf_signatures enable row level security;
alter table rf_settings enable row level security;

create policy payers_isolate on rf_payers
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy contracts_isolate on rf_contracts
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy incomes_isolate on rf_incomes
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy receipts_isolate on rf_receipts
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy signatures_isolate on rf_signatures
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy settings_isolate on rf_settings
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- Trigger para updated_at
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end; $$ language plpgsql;

create trigger tg_payers_updated before update on rf_payers
for each row execute function set_updated_at();
create trigger tg_contracts_updated before update on rf_contracts
for each row execute function set_updated_at();
create trigger tg_incomes_updated before update on rf_incomes
for each row execute function set_updated_at();

-- Trigger para total_pago
create or replace function apply_payment_total()
returns trigger as $$
begin
  update rf_incomes set total_pago = coalesce(total_pago,0) + new.valor, updated_at = now()
  where id = new.income_id;
  return new;
end; $$ language plpgsql;

create trigger tg_payments_total after insert on rf_payments
for each row execute function apply_payment_total();
