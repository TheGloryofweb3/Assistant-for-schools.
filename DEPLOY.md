# Deploying GHGS AI for free (no laptop required to stay running)

This makes the whole app — sign-in AND the AI chat — run in the cloud, the
same way your brother's sites work. Total cost: $0. You'll use GitHub (to
store the code) and Vercel (to host it), exactly the kind of stack he used.

## Before you start
Rotate your Groq key one more time if you haven't already since it was
shared in a chat: https://console.groq.com/keys — revoke the old one, copy
the new one, you'll paste it into Vercel (never into any file) in step 4.

## 1. Put this folder on GitHub
1. Go to https://github.com → sign in (or create a free account)
2. Click **New repository** → name it e.g. `ghgs-ai` → Create
3. On your computer, inside this `ghgs-vercel` folder, run:
   ```powershell
   git init
   git add .
   git commit -m "Initial deploy"
   git branch -M main
   git remote add origin https://github.com/YOUR-USERNAME/ghgs-ai.git
   git push -u origin main
   ```
   (If `git` isn't installed, download it free from https://git-scm.com,
   or just use GitHub Desktop's "Add existing folder" button instead —
   no command line needed.)

## 2. Connect Vercel to that repo
1. Go to https://vercel.com → sign up free with your GitHub account
2. Click **Add New → Project**
3. Pick the `ghgs-ai` repo you just pushed → **Import**
4. Leave all the build settings as default (this project needs no build step)
5. Click **Deploy**

## 3. Add your Groq key as an environment variable
This is the step that keeps the key secret and off your laptop entirely.
1. In the Vercel project → **Settings → Environment Variables**
2. Add: Name = `GROQ_API_KEY`, Value = your new Groq key
3. Save, then go to **Deployments** and click **Redeploy** so it picks up the variable

## 4. That's it — test it
Vercel gives you a URL like `https://ghgs-ai-yourname.vercel.app`. Open it,
sign up, send a message. This now runs whether or not your laptop is on —
Vercel runs the AI proxy, and Firebase (already cloud-based) runs the login.

## 5. (Optional) Add your own domain
In the Vercel project → **Settings → Domains**, you can attach a custom
domain later if you buy one — not required for it to work.

## Going forward
Any time you edit `public/index.html` or `api/chat.js` and push to GitHub
(`git add . && git commit -m "update" && git push`), Vercel automatically
redeploys the new version within seconds. No manual server restarts, ever.
