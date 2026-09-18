# RichMadeIt University — Google-only buyer access

This setup gives each paid buyer access through their own Google account. You never create or track passwords.

## 1. Create the Supabase project

Create a project at Supabase, then open **SQL Editor**. Paste and run `supabase-setup.sql`.

## 2. Turn on Google login

In Supabase, open **Authentication → Providers → Google** and enable Google. Create the Google OAuth credentials requested by Supabase and copy the Supabase callback URL shown on that screen into the Google Cloud OAuth client.

In **Authentication → URL Configuration**:

- Set **Site URL** to your live website origin, such as `https://yourdomain.com`.
- Add the exact login page as an allowed redirect URL, such as `https://yourdomain.com/university/workbook-login.html`.
- Add a local URL only while testing locally.

## 3. Add the public browser settings

Open `supabase-config.js` and replace both placeholders with:

- the Supabase **Project URL**;
- the Supabase **publishable key** (or legacy anon key).

These two browser values are designed to be public. Never put a service-role key in this file.

## 4. Upload the workbook privately

The SQL creates a private Storage bucket named `paid-workbooks`. In **Storage**, upload:

`Richmadeit-University-Interactive-Workbook.html`

Upload it at the bucket root with that exact filename. Do not place it in the public website folder.

## 5. Upload the public website files

Upload the contents of `UNIVERSITY_COMPARISON_SITE` to your existing `university` directory. Do **not** upload the private workbook there. The public login URL will be:

`https://yourdomain.com/university/workbook-login.html`

## 6. Approve a paid buyer

After payment, ask the buyer for the Gmail they will use. In **SQL Editor**, run:

```sql
insert into public.approved_buyers(email,note)
values (lower('buyer@gmail.com'),'Paid $49')
on conflict(email) do update
set active=true, paid_at=now(), note=excluded.note;
```

Then send the buyer the login URL. They tap **Continue with Google** and choose that exact Gmail.

## 7. Revoke access

```sql
update public.approved_buyers
set active=false
where email=lower('buyer@gmail.com');
```

## Buyer message

> Your RichMadeIt University workbook access is approved. Open the private login page and continue with the same Google email you sent after payment. No password is required. Your private Telegram creator-group invitation is included after verification.

## Security notes

- The workbook is in a private bucket, not the public site.
- Row Level Security checks the signed-in Google email against `approved_buyers`.
- The login page creates a short-lived workbook link only for an approved buyer.
- Never expose a Supabase service-role key, Google client secret, or database password in website files.
