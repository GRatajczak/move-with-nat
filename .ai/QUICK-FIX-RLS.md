# 🚨 Quick Fix - RLS Error

## Widzisz błąd: "new row violates row-level security policy"?

**Dlaczego to się dzieje?**  
Twoja baza danych ma włączony Row-Level Security (RLS), ale **brakuje polityk INSERT/UPDATE/DELETE** dla tabeli `exercises`. Możesz tylko czytać dane (SELECT), ale nie możesz ich modyfikować.

### Szybkie rozwiązanie (2 minuty):

#### 1. Otwórz Supabase Dashboard

Przejdź do: [https://supabase.com/dashboard](https://supabase.com/dashboard)

#### 2. Znajdź Service Role Key

1. Wybierz swój projekt
2. **Settings** → **API**
3. Sekcja **Project API keys**
4. Skopiuj **`service_role`** key (długi token zaczynający się od `eyJ...`)

⚠️ **NIE kopiuj** `anon` key - potrzebujesz **service_role**!

#### 3. Dodaj do .env

**Jeśli plik `.env` nie istnieje**, utwórz go w głównym katalogu projektu (obok `package.json`).

Następnie dodaj/zaktualizuj następujące zmienne:

```bash
SUPABASE_SERVICE_ROLE_KEY=wklej-tutaj-skopiowany-klucz
```

Przykład:

```bash
SUPABASE_URL=https://abc123.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiYzEyMyIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNjg0NTYwMDAwLCJleHAiOjE5OTk5OTk5OTl9.xxx
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiYzEyMyIsInJvbGUiOiJzZXJ2aWNlX3JvbGUiLCJpYXQiOjE2ODQ1NjAwMDAsImV4cCI6MTk5OTk5OTk5OX0.yyy
```

#### 4. Restart serwera

```bash
# Ctrl+C aby zatrzymać
npm run dev
```

#### 5. Testuj w Postmanie

Teraz wszystkie requesty powinny działać! 🎉

---

## Sprawdzenie czy działa

### Test w terminalu:

```bash
curl -X POST http://localhost:3000/api/exercises \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Exercise",
    "vimeoToken": "test123"
  }'
```

**Oczekiwany rezultat:** Status `201` i JSON z nowym ćwiczeniem

**Jeśli nadal błąd:** Sprawdź czy:

- ✅ Skopiowałeś **service_role** key (nie anon!)
- ✅ Dodałeś go do `.env` jako `SUPABASE_SERVICE_ROLE_KEY`
- ✅ Zrestartowałeś serwer po dodaniu klucza

---

## Co się stało?

Supabase ma włączone Row-Level Security (RLS) dla tabeli `exercises`, ale:

- ✅ Polityka SELECT istnieje (możesz czytać)
- ❌ **Brakuje** polityk INSERT, UPDATE, DELETE (nie możesz modyfikować)

**Service role key** omija RLS i pozwala na wszystkie operacje - używaj go tylko lokalnie!

**Alternatywa:** Możesz dodać brakujące polityki RLS zamiast używać service_role key. Przygotowana migracja znajduje się w: `supabase/migrations/20251112000000_add_exercises_rls_policies.sql`

Szczegółowe info: `.ai/RLS-SETUP.md`

---

## ⚠️ WAŻNE

**Service role key jest TAJNY!**

- ❌ **NIE** commituj go do git
- ❌ **NIE** używaj w produkcji
- ❌ **NIE** udostępniaj nikomu
- ✅ Używaj tylko lokalnie do testowania
- ✅ Plik `.env` jest już w `.gitignore`

---

## Po zakończeniu testów

### Opcja 1: Usuń service_role key (zalecane dla produkcji)

Usuń lub zakomentuj `SUPABASE_SERVICE_ROLE_KEY` z `.env`:

```bash
# SUPABASE_SERVICE_ROLE_KEY=...  # zakomentowane
```

### Opcja 2: Dodaj brakujące polityki RLS

Zamiast używać service_role key, możesz dodać polityki INSERT/UPDATE/DELETE:

1. Przejdź do Supabase Dashboard → SQL Editor
2. Użyj polityk z `.ai/RLS-SETUP.md` (sekcja "Rozwiązanie 3")
3. Skonfiguruj prawdziwą autentykację z JWT tokenami

Szczegółowy przewodnik: `.ai/RLS-SETUP.md`
