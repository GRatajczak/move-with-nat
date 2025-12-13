# Cloudflare Pages Deployment

## Przegląd

Projekt jest skonfigurowany do automatycznego wdrażania na Cloudflare Pages przy każdym pushu do gałęzi `master` lub `dev`.

## Wymagania wstępne

1. Konto Cloudflare z dostępem do Cloudflare Pages
2. Projekt Cloudflare Pages utworzony w panelu Cloudflare
3. Cloudflare API Token z odpowiednimi uprawnieniami

## Typy sekretów w GitHub

Projekt używa dwóch typów sekretów:

### Repository Secrets

- Dostępne dla wszystkich workflow w repozytorium
- GitHub → Settings → Secrets and variables → Actions → Repository secrets
- Używane dla: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_PROJECT_NAME`

### Environment Secrets (production)

- Dostępne tylko dla jobów z określonym `environment: production`
- GitHub → Settings → Environments → production → Environment secrets
- Używane dla: `SUPABASE_URL`, `SUPABASE_KEY`
- **Zalety**: Lepsza kontrola dostępu, możliwość wymagania approvals

## Konfiguracja projektu

### 1. Adapter Astro

Projekt używa `@astrojs/cloudflare` adapter, który jest już skonfigurowany w `astro.config.mjs`:

```javascript
adapter: cloudflare({
  platformProxy: {
    enabled: true,
  },
}),
```

### 2. GitHub Secrets

Musisz skonfigurować następujące sekrety w swoim repozytorium GitHub (Settings → Secrets and variables → Actions):

#### Wymagane sekrety Cloudflare:

- `CLOUDFLARE_API_TOKEN` - Token API z Cloudflare Dashboard
  - Aby utworzyć token: Cloudflare Dashboard → My Profile → API Tokens → Create Token
  - Wybierz szablon "Edit Cloudflare Workers" lub utwórz custom token z uprawnieniami:
    - Account → Cloudflare Pages → Edit
    - Zone → Zone → Read (jeśli używasz custom domain)

- `CLOUDFLARE_ACCOUNT_ID` - ID konta Cloudflare
  - Znajdziesz w Cloudflare Dashboard → Workers & Pages → Overview (w prawym panelu)

- `CLOUDFLARE_PROJECT_NAME` - Nazwa projektu Cloudflare Pages
  - To jest nazwa, którą nadałeś projektowi w Cloudflare Pages

#### Wymagane sekrety Supabase (dla GitHub Actions):

**⚠️ WAŻNE**: Te sekrety muszą być skonfigurowane jako **Environment secrets** w environment "production":

- GitHub → Settings → Environments → production → Add secret

- `SUPABASE_URL` - URL twojego projektu Supabase (używane podczas build)
- `SUPABASE_KEY` - Anon/Public key z Supabase (używane podczas build)

Aby uzyskać te wartości:

1. Zaloguj się do Supabase Dashboard
2. Wybierz swój projekt
3. Przejdź do Settings → API
4. Skopiuj "Project URL" (`SUPABASE_URL`) i "anon public" key (`SUPABASE_KEY`)

## Proces CI/CD

Workflow `.github/workflows/build.yml` działa w dwóch trybach:

### Automatyczny workflow (przy push):

1. **Lint** - Sprawdza jakość kodu
2. **Unit Tests** - Uruchamia testy jednostkowe z coverage
3. **Build** - Buduje aplikację i zapisuje artefakty (przechowywane 7 dni)

**Deployment NIE jest automatyczny!** Artefakty są tylko budowane i zapisywane.

### Ręczny deployment:

Deployment na Cloudflare Pages wymaga **ręcznego uruchomienia**. Aby wdrożyć aplikację:

1. Przejdź do **GitHub → Actions → "Build and Deploy to Cloudflare Pages"**
2. Kliknij **"Run workflow"** (przycisk po prawej stronie)
3. Wybierz branch (master/dev)
4. Wybierz środowisko:
   - **production** - deployment produkcyjny na główną domenę
   - **preview** - deployment testowy/staging
5. Kliknij **"Run workflow"** (zielony przycisk)

Workflow pobierze ostatni build dla wybranego SHA i wdroży go na Cloudflare Pages.

### Wyzwalacze

**Automatyczne** (bez deployment):

- Push do gałęzi `master` - uruchamia lint, testy i build
- Push do gałęzi `dev` - uruchamia lint, testy i build

**Ręczne** (z deployment):

- `workflow_dispatch` - wymaga ręcznego uruchomienia przez interfejs GitHub Actions

### Uprawnienia

Workflow wymaga następujących uprawnień:

```yaml
permissions:
  contents: read
  deployments: write
```

Uprawnienie `deployments: write` umożliwia integrację z GitHub Deployments, dzięki czemu możesz zobaczyć status deploymentu bezpośrednio w GitHub.

## Zmienne środowiskowe w Cloudflare (Runtime)

**WAŻNE**: Oprócz sekretów w GitHub Actions (używanych podczas build), musisz skonfigurować zmienne środowiskowe bezpośrednio w Cloudflare Pages dla runtime:

1. Idź do Cloudflare Dashboard → Workers & Pages → Twój projekt
2. Przejdź do Settings → Environment variables
3. Dodaj zmienne dla Production i Preview (bez prefiksu PUBLIC\_):
   - `SUPABASE_URL` - URL projektu Supabase
   - `SUPABASE_KEY` - Anon/Public key z Supabase
   - `SUPABASE_SERVICE_ROLE_KEY` - Service Role Key (opcjonalnie, dla operacji admin)
   - `SENDGRID_API_KEY` - API Key SendGrid
   - `SENDGRID_FROM_EMAIL` - Email nadawcy
   - `SENDGRID_TEMPLATE_ACTIVATION` - ID szablonu aktywacji konta
   - `SENDGRID_TEMPLATE_PASSWORD_RESET` - ID szablonu resetu hasła
   - `PUBLIC_APP_URL` - URL aplikacji (np. https://twoja-domena.pages.dev)

**Uwaga o prefiksie PUBLIC\_**: W tym projekcie używamy zmiennych **bez prefiksu PUBLIC\_** dla danych wrażliwych (dostęp tylko server-side). Jedynie `PUBLIC_APP_URL` używa prefiksu PUBLIC\_, ponieważ może być bezpiecznie dostępna w kodzie klienta.

## Weryfikacja deployment

Po każdym deploymencie:

1. Workflow wyświetli URL deployment w logach (`Print deployment URL` step)
2. Możesz zobaczyć deployment w GitHub → Actions → Workflow run → Deployments tab
3. W Cloudflare Dashboard zobaczysz nowy deployment w projekcie Pages

## Jak wdrożyć zmiany (krok po kroku)

### 1. Rozwój i testy

```bash
# Pracuj na branchu feature/dev
git checkout -b feature/new-feature
# ... zmiany ...
git commit -m "Add new feature"
git push origin feature/new-feature
```

### 2. Pull Request

- Utwórz PR do `master`
- Workflow `pull-request.yml` automatycznie uruchomi wszystkie testy
- Poczekaj na przejście wszystkich testów

### 3. Merge do master

```bash
# Po zatwierdzeniu PR, merge do master
git checkout master
git pull origin master
```

- Workflow `build.yml` automatycznie uruchomi lint, testy i build
- **Aplikacja NIE zostanie jeszcze wdrożona** - artefakty są tylko zapisane

### 4. Ręczny deployment

1. Przejdź do **GitHub → Actions**
2. Wybierz workflow **"Build and Deploy to Cloudflare Pages"**
3. Kliknij **"Run workflow"** (przycisk po prawej stronie)
4. Wybierz:
   - **Branch**: `master` (dla produkcji) lub `dev` (dla preview)
   - **Environment**: `production` lub `preview`
5. Kliknij **"Run workflow"** (zielony przycisk)
6. Obserwuj postęp w zakładce Actions
7. Po zakończeniu, sprawdź URL deployment w logach

## Lokalne testowanie z Cloudflare

Aby przetestować lokalnie z emulacją Cloudflare runtime:

```bash
# Development z Cloudflare Workers runtime
npm run dev

# Preview production build lokalnie
npm run build
npm run preview
```

## Troubleshooting

### Build fails

- Sprawdź logi w GitHub Actions
- Upewnij się, że wszystkie zmienne środowiskowe są poprawnie skonfigurowane
- Zweryfikuj, że `dist/` folder jest tworzony podczas build

### Deployment fails

- Sprawdź czy CLOUDFLARE_API_TOKEN ma odpowiednie uprawnienia
- Zweryfikuj czy CLOUDFLARE_PROJECT_NAME odpowiada nazwie projektu w Cloudflare
- Upewnij się, że CLOUDFLARE_ACCOUNT_ID jest poprawne

### Runtime errors

- Sprawdź logi w Cloudflare Dashboard → Workers & Pages → Twój projekt → Logs
- Upewnij się, że wszystkie environment variables są skonfigurowane w Cloudflare Pages
- Zweryfikuj kompatybilność z Cloudflare Workers runtime

## Różnice między Node.js a Cloudflare adapters

Cloudflare Pages używa Cloudflare Workers runtime, który jest lżejszy niż Node.js. Główne różnice:

1. **Runtime API**: Cloudflare Workers ma własne APIs (KV, Durable Objects, R2)
2. **Node.js APIs**: Nie wszystkie Node.js APIs są dostępne
3. **Cold starts**: Cloudflare Workers mają bardzo szybkie cold starts
4. **Pricing**: Pay-per-request model zamiast pay-per-time

## Rekomendacje

1. **Branch Protection**: Skonfiguruj branch protection rules dla `master` aby wymagać przejścia wszystkich checks przed merge
2. **Preview Deployments**: Cloudflare automatycznie tworzy preview URLs dla każdego brancha
3. **Monitoring**: Włącz Cloudflare Analytics i Workers Analytics dla monitoringu performance
4. **Custom Domain**: Skonfiguruj custom domain w Cloudflare Pages settings
