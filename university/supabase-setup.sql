-- RichMadeIt University: Google-login buyer allowlist
-- Run once in Supabase Dashboard > SQL Editor.

create table if not exists public.approved_buyers (
  email text primary key check (email = lower(email)),
  active boolean not null default true,
  paid_at timestamptz not null default now(),
  note text,
  created_at timestamptz not null default now()
);

alter table public.approved_buyers enable row level security;
revoke all on public.approved_buyers from anon;
grant select on public.approved_buyers to authenticated;

drop policy if exists "buyers read own approval" on public.approved_buyers;
create policy "buyers read own approval"
on public.approved_buyers
for select
to authenticated
using (lower(email) = lower(coalesce(auth.jwt()->>'email','')));

insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values (
  'paid-workbooks',
  'paid-workbooks',
  false,
  10485760,
  array['text/html']
)
on conflict (id) do update
set public=false,
    file_size_limit=excluded.file_size_limit,
    allowed_mime_types=excluded.allowed_mime_types;

drop policy if exists "approved buyers read workbook" on storage.objects;
create policy "approved buyers read workbook"
on storage.objects
for select
to authenticated
using (
  bucket_id='paid-workbooks'
  and name='Richmadeit-University-Interactive-Workbook.html'
  and exists (
    select 1
    from public.approved_buyers buyer
    where buyer.email=lower(coalesce(auth.jwt()->>'email',''))
      and buyer.active=true
  )
);

-- APPROVE A PAID BUYER (change the Gmail and note, then run this statement):
-- insert into public.approved_buyers(email,note)
-- values (lower('buyer@gmail.com'),'Paid $49')
-- on conflict(email) do update
-- set active=true, paid_at=now(), note=excluded.note;

-- REVOKE ACCESS IF NEEDED:
-- update public.approved_buyers
-- set active=false
-- where email=lower('buyer@gmail.com');
