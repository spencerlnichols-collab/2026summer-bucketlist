# Setup Guide — Spencer & Abby's Bucket List

Two steps: Supabase (shared database) → Vercel (public URL). Both are free.

---

## Step 1 — Supabase (shared real-time state)

1. Go to [supabase.com](https://supabase.com) → **Start your project** → create a free account
2. Create a new project (name it anything, pick any region, set a DB password)
3. Once created, go to **SQL Editor** in the left sidebar and run this:

```sql
create table if not exists checks (
  item_id integer primary key,
  checked boolean default false,
  updated_at timestamp with time zone default now()
);

-- allow anyone with the anon key to read/write (no login needed)
alter table checks enable row level security;

create policy "allow all" on checks
  for all using (true) with check (true);
```

4. Go to **Project Settings → API** and copy:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public key** → `VITE_SUPABASE_ANON_KEY`

5. Create a `.env` file in this folder (copy from `.env.example`):

```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
```

6. Also go to **Realtime** in the sidebar → enable replication for the `checks` table so live syncing works.

---

## Step 2 — Deploy to Vercel (public URL)

1. Push this folder to a GitHub repo:
   ```bash
   cd bucket-list
   git init
   git add .
   git commit -m "summer bucket list"
   gh repo create summer-bucket-list --public --push --source .
   ```

2. Go to [vercel.com](https://vercel.com) → **Add New Project** → import the GitHub repo

3. During setup, add your environment variables under **Environment Variables**:
   - `VITE_SUPABASE_URL` = your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY` = your Supabase anon key

4. Click **Deploy** — Vercel will give you a URL like `summer-bucket-list.vercel.app`

5. Send Abby the link. You're done. ✅

---

## Adding your photos

The polaroid placeholders in the header are ready for real photos of you two.

Open `src/components/Header.jsx` and find the `slots` / `captions` arrays near the bottom of the file. Replace the empty `{}` objects with:

```js
{ src: '/photos/us1.jpg', caption: 'Linda Mar at sunset' }
```

Then put your photo files in `public/photos/` and redeploy.

**Or** — for photos that sync between you automatically — we can add Supabase Storage photo upload later. Just ask.

---

## Running locally

```bash
npm install
cp .env.example .env   # then fill in your Supabase keys
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).
