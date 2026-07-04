# Cloudflare Pages Deployment

This project has been prepared for free static deployment on Cloudflare Pages.

## What is already set up

- Static build output via `scripts/build_static.py`
- Wrangler config via `wrangler.jsonc`
- Local deploy helper via `scripts/deploy_cloudflare_pages.sh`
- Local project creation helper via `scripts/create_cloudflare_project.sh`
- GitHub Actions workflow at repo root:
  `.github/workflows/deploy-personal-site-cloudflare-pages.yml`

## 1. Install dependencies

```bash
cd /Users/mac/Documents/personal-site
npm install
```

## 2. Create a Cloudflare Pages project

You can create it with Wrangler after logging in:

```bash
npx wrangler login
bash scripts/create_cloudflare_project.sh <your-project-name> main
```

Cloudflare documents `wrangler pages project create [PROJECT-NAME]` and
`wrangler pages deploy [DIRECTORY]` in the Wrangler Pages commands docs:
https://developers.cloudflare.com/workers/wrangler/commands/pages/

## 3. Prepare credentials

Create a Cloudflare API token with:
- `Account`
- `Cloudflare Pages`
- `Edit`

Cloudflare's CI guide documents that permission model here:
https://developers.cloudflare.com/pages/how-to/use-direct-upload-with-continuous-integration/

Then prepare:

- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_PAGES_PROJECT_NAME`

## 4. Deploy locally from your machine

```bash
cd /Users/mac/Documents/personal-site
cp .env.example .env
# fill in real values
export $(grep -v '^#' .env | xargs)
npm run cf:deploy
```

## 5. Preview locally with Cloudflare Pages

```bash
cd /Users/mac/Documents/personal-site
npm run preview:pages
```

Cloudflare documents `wrangler pages dev` here:
https://developers.cloudflare.com/pages/functions/local-development/

## 6. GitHub Actions automatic deployment

The workflow has already been added at the git repo root and is scoped to
changes under `personal-site/**`.

Add these repository secrets in GitHub:

- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_PAGES_PROJECT_NAME`

Then pushes to `main` that touch `personal-site/**` can auto-deploy.

## Important architectural note

This project uses the `Direct Upload` model through Wrangler. Cloudflare's
official Pages docs state that a Direct Upload project cannot later be switched
to Git integration:
https://developers.cloudflare.com/pages/get-started/direct-upload/

That is acceptable here because the goal is agent-friendly automated management.
