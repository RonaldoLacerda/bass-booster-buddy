alter table public.track_usages add column if not exists environment text;
alter table public.subscriptions add column if not exists webhook_occurred_at timestamptz;
create or replace function public.consume_audio_track(p_environment text, p_file_name text default null, p_goal_id text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); sub public.subscriptions%rowtype; used_count integer; max_tracks integer := 1; period_start timestamptz;
begin
 if uid is null then raise exception 'Unauthorized'; end if;
 if p_environment not in ('sandbox','live') then raise exception 'Invalid environment'; end if;
 perform pg_advisory_xact_lock(hashtextextended(uid::text, 0));
 select * into sub from public.subscriptions where user_id = uid and status = 'active' and (environment = p_environment or (environment is null and paddle_subscription_id is null)) and (expires_at is null or expires_at > now()) order by started_at desc limit 1;
 if found then
  max_tracks := sub.tracks_limit;
  period_start := case when sub.paddle_subscription_id is not null then sub.started_at else date_trunc('month', now() at time zone 'UTC') at time zone 'UTC' end;
 end if;
 select count(*) into used_count from public.track_usages where user_id = uid and (environment = p_environment or environment is null) and (period_start is null or created_at >= period_start);
 if used_count >= max_tracks then return jsonb_build_object('ok',false,'remaining',0,'reason','Limite de faixas atingido. Escolha um plano ou aguarde a renovação.'); end if;
 insert into public.track_usages(user_id,file_name,goal_id,environment) values(uid,left(p_file_name,200),left(p_goal_id,50),p_environment);
 return jsonb_build_object('ok',true,'remaining',greatest(0,max_tracks-used_count-1));
end $$;
revoke all on function public.consume_audio_track(text,text,text) from public, anon;
grant execute on function public.consume_audio_track(text,text,text) to authenticated;
