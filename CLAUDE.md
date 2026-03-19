# Zápisník nápadov

Jednoduchá Next.js aplikácia na zaznamenávanie a správu nápadov s Supabase backendom.

## Technológie

- **Next.js 15** (App Router, TypeScript)
- **React 19** (client component s hooks)
- **Supabase** (@supabase/supabase-js) - databáza a API

## Štruktúra projektu

```
src/
├── lib/
│   └── supabase.ts        # Supabase klient (singleton)
└── app/
    ├── layout.tsx          # Root layout (lang="sk")
    ├── globals.css         # Globálne štýly (plain CSS, bez Tailwind)
    └── page.tsx            # Hlavná stránka - celá CRUD logika
```

## Príkazy

```bash
npm install        # Inštalácia závislostí
npm run dev        # Vývojový server (localhost:3000)
npm run build      # Produkčný build
npm run start      # Spustenie produkčného buildu
npm run lint       # ESLint kontrola
```

## Environment premenné

Vytvoriť súbor `.env.local` podľa `.env.local.example`:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## Supabase schéma

Tabuľka `categories`:

| Stĺpec | Typ  | Popis                                    |
|---------|------|------------------------------------------|
| `id`    | int8 | Primary key, generated always as identity |
| `name`  | text | Názov kategórie                          |

Tabuľka `ideas`:

| Stĺpec       | Typ  | Popis                                    |
|---------------|------|------------------------------------------|
| `id`          | int8 | Primary key, generated always as identity |
| `content`     | text | Text nápadu                              |
| `category_id` | int8 | FK na categories(id), nullable           |
| `user_id`     | uuid | FK na auth.users(id), identifikátor užívateľa |

SQL na vytvorenie:

```sql
create table categories (
  id bigint generated always as identity primary key,
  name text not null
);

create table ideas (
  id bigint generated always as identity primary key,
  content text not null,
  category_id bigint references categories(id),
  user_id uuid references auth.users(id) not null
);
```

SQL na pridanie stĺpca `user_id` do existujúcej tabuľky:

```sql
alter table ideas add column user_id uuid references auth.users(id);
```

## Architektúra

- Celá aplikácia beží v jednom client componente (`page.tsx`)
- Supabase klient je importovaný z `src/lib/supabase.ts`
- Autentifikácia cez Supabase Auth (email + heslo)
- Neprihlásený užívateľ vidí login/register formulár, prihlásený vidí zápisník
- Každý nápad je viazaný na `user_id`, načítavajú sa len nápady prihláseného užívateľa
- Žiadne server components ani API routes - priama komunikácia klienta so Supabase
- Nápady sú zoradené od najnovšieho (order by id desc)
- Kategórie sa načítavajú zo Supabase tabuľky `categories` a zobrazujú v dropdown pri pridávaní
- Nové kategórie je možné vytvárať priamo v UI cez tlačidlo "+" vedľa dropdownu (inline formulár)
- Nápady obsahujú JOIN na `categories` cez `category_id` (nullable FK)
- Ak nápad nemá kategóriu, zobrazí sa "Bez kategórie"
- Štýly sú v čistom CSS (bez CSS frameworkov)
- UI je v slovenčine

## Konvencie

- Path alias `@/*` mapuje na `src/*`
- Chybové hlášky v slovenčine priamo v komponente
- Optimistické mazanie (okamžité odstránenie z UI po úspešnom API volaní)
