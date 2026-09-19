-- Enable once
create extension if not exists pg_cron;

-- The function that adds the next missing session for every active intake
create or replace function public.provision_next_sessions()
returns void language plpgsql as $$
declare
  r record;
  v_year_id int;
begin
  for r in
    select i.id as intake_id, i.start_year
    from intakes i
  loop
    for year_num in 1..3 loop
      -- upsert the academic year row
      insert into academic_years (intake_id, year_number, calendar_year)
      values (r.intake_id, year_num, r.start_year + year_num - 1)
      on conflict (intake_id, year_number) do nothing
      returning id into v_year_id;

      if v_year_id is null then
        select id into v_year_id
        from academic_years
        where intake_id = r.intake_id and year_number = year_num;
      end if;

      -- upsert session 1 (Oct 1) and session 2 (Apr 1) if date has passed
      if current_date >= make_date(r.start_year + year_num - 1, 10, 1) then
        insert into sessions (academic_year_id, session_number)
        values (v_year_id, 1)
        on conflict (academic_year_id, session_number) do nothing;
      end if;

      if current_date >= make_date(r.start_year + year_num, 4, 1) then
        insert into sessions (academic_year_id, session_number)
        values (v_year_id, 2)
        on conflict (academic_year_id, session_number) do nothing;
      end if;
    end loop;
  end loop;
end;
$$;

-- Function to populate academic_results and academic_timetables for eligible active cadets
create or replace function public.provision_session_cadet_records(p_session_id int)
returns void language plpgsql as $$
declare
  v_intake_id int;
  v_intake_start_year int;
  v_calendar_year int;
begin
  select ay.intake_id, i.start_year, ay.calendar_year
  into v_intake_id, v_intake_start_year, v_calendar_year
  from sessions s
  join academic_years ay on ay.id = s.academic_year_id
  join intakes i on i.id = ay.intake_id
  where s.id = p_session_id;

  if v_intake_id is null then
    return;
  end if;

  insert into academic_results (session_id, cadet_id)
  select p_session_id, c.id
  from cadets c
  left join study_programs sp on sp.id = c.study_program_id
  where c.intake_id = v_intake_id
    and c.is_active = true
    and (v_calendar_year - v_intake_start_year + 1) <= coalesce(sp.completion_year, 3)
  on conflict (session_id, cadet_id) do nothing;

  insert into academic_timetables (session_id, cadet_id, occupied_slots)
  select p_session_id, c.id, '[]'::jsonb
  from cadets c
  left join study_programs sp on sp.id = c.study_program_id
  where c.intake_id = v_intake_id
    and c.is_active = true
    and (v_calendar_year - v_intake_start_year + 1) <= coalesce(sp.completion_year, 3)
  on conflict (session_id, cadet_id) do nothing;
end;
$$;

-- Trigger to auto-provision cadet records whenever a session is created
create or replace function public.trg_auto_provision_session_cadet_records()
returns trigger language plpgsql as $$
begin
  perform public.provision_session_cadet_records(new.id);
  return new;
end;
$$;

drop trigger if exists trg_sessions_auto_provision on public.sessions;
create trigger trg_sessions_auto_provision
after insert on public.sessions
for each row execute function public.trg_auto_provision_session_cadet_records();

-- Schedule: run at midnight on Oct 1 and Apr 1 every year
select cron.schedule('provision-oct-session', '0 0 1 10 *', 'select public.provision_next_sessions()');
select cron.schedule('provision-apr-session', '0 0 1 4 *',  'select public.provision_next_sessions()');