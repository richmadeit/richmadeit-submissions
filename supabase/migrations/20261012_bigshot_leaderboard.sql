-- Isolated game tables. No existing submission data is modified.
create table public.bigshot_rounds (
 id text primary key check (id ~ '^[a-f0-9]{48}$'),
 player_id text not null check (player_id ~ '^[a-f0-9]{64}$'),
 seed bigint not null check (seed between 0 and 4294967295),
 created_at timestamptz not null default now(),
 network text not null
);
create index bigshot_round_player_time on public.bigshot_rounds(player_id,created_at);
create index bigshot_round_network_time on public.bigshot_rounds(network,created_at);
create table public.bigshot_scores (
 round_id text primary key,
 player_id text not null,
 name varchar(20) not null check(length(name)>=2),
 social varchar(30) check(social is null or social ~ '^[A-Za-z0-9._]{1,30}$'),
 score integer not null check(score between 0 and 360),
 submitted_at timestamptz not null default now(),
 day date not null default (now() at time zone 'America/Chicago')::date
);
create index bigshot_score_player on public.bigshot_scores(player_id);
create index bigshot_score_day on public.bigshot_scores(day,score desc);
alter table public.bigshot_rounds enable row level security;
alter table public.bigshot_scores enable row level security;
revoke all on public.bigshot_rounds,public.bigshot_scores from anon,authenticated;
grant all on public.bigshot_rounds,public.bigshot_scores to service_role;

create function public.bigshot_open_round(p_id text,p_player text,p_seed bigint,p_network text) returns jsonb
language plpgsql security definer set search_path=public as $$
begin
 perform pg_advisory_xact_lock(hashtext('bigshot:'||p_network));
 if (select count(*) from bigshot_rounds where player_id=p_player and created_at>now()-interval '1 minute')>=8
 or (select count(*) from bigshot_rounds where network=p_network and created_at>now()-interval '1 minute')>=120 then
  return jsonb_build_object('error','Give it a moment before starting another ranked round.','status',429);
 end if;
 delete from bigshot_rounds where created_at<now()-interval '1 day';
 insert into bigshot_rounds(id,player_id,seed,network) values(p_id,p_player,p_seed,p_network);
 return jsonb_build_object('round',p_id);
end; $$;

create function public.bigshot_get_round(p_id text,p_player text) returns jsonb
language sql security definer set search_path=public as $$
 select jsonb_build_object('id',id,'seed',seed,'age',extract(epoch from now()-created_at))
 from bigshot_rounds where id=p_id and player_id=p_player;
$$;

create function public.bigshot_save_score(p_id text,p_player text,p_name text,p_social text,p_score integer) returns jsonb
language plpgsql security definer set search_path=public as $$
declare r bigshot_rounds%rowtype; best integer;
begin
 select * into r from bigshot_rounds where id=p_id and player_id=p_player for update;
 if not found then return jsonb_build_object('error','This round is unavailable. Play another round.','status',400); end if;
 if r.created_at>now()-interval '55 seconds' or r.created_at<now()-interval '1 day' then return jsonb_build_object('error','Finish a fresh 60-second round first.','status',400); end if;
 insert into bigshot_scores(round_id,player_id,name,social,score) values(p_id,p_player,p_name,nullif(p_social,''),p_score) on conflict(round_id) do nothing;
 select max(score) into best from bigshot_scores where player_id=p_player;
 return jsonb_build_object('saved',true,'score',p_score,'best',best);
end; $$;

create function public.bigshot_board(p_scope text) returns jsonb
language sql security definer set search_path=public as $$
 with best as (
  select distinct on(player_id) player_id,name,social,score,submitted_at from bigshot_scores
  where p_scope<>'today' or day=(now() at time zone 'America/Chicago')::date
  order by player_id,score desc,submitted_at asc
 ), ranked as (
  select row_number() over(order by score desc,submitted_at asc,player_id) as rank,name,social,score from best order by score desc,submitted_at asc,player_id limit 25
 )
 select jsonb_build_object('scope',p_scope,'entries',coalesce(jsonb_agg(to_jsonb(ranked) order by rank),'[]'::jsonb),'timezone','America/Chicago') from ranked;
$$;
revoke all on function public.bigshot_open_round(text,text,bigint,text), public.bigshot_get_round(text,text), public.bigshot_save_score(text,text,text,text,integer), public.bigshot_board(text) from public,anon,authenticated;
grant execute on function public.bigshot_open_round(text,text,bigint,text), public.bigshot_get_round(text,text), public.bigshot_save_score(text,text,text,text,integer), public.bigshot_board(text) to service_role;
