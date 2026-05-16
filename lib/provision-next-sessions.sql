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

-- Schedule: run at midnight on Oct 1 and Apr 1 every year
select cron.schedule('provision-oct-session', '0 0 1 10 *', 'select public.provision_next_sessions()');
select cron.schedule('provision-apr-session', '0 0 1 4 *',  'select public.provision_next_sessions()');