alter table public.diaries
  add column if not exists memory_capacity integer not null default 4 check (memory_capacity >= 1);

update public.diaries
set memory_capacity = 4
where memory_capacity is null;

create or replace function public.active_diary_usage(
  target_chronicle_id uuid
)
returns table (
  diary_id uuid,
  diary_title text,
  memory_capacity integer,
  memory_count integer
)
language sql
stable
as $$
  select
    diaries.id as diary_id,
    diaries.title as diary_title,
    diaries.memory_capacity,
    count(memories.id)::integer as memory_count
  from public.diaries
  left join public.memories
    on memories.diary_id = diaries.id
   and memories.location = 'diary'
  where diaries.chronicle_id = target_chronicle_id
    and diaries.status = 'active'
  group by diaries.id, diaries.title, diaries.memory_capacity;
$$;

create or replace function public.ensure_active_diary(
  target_chronicle_id uuid
)
returns table (
  diary_id uuid,
  created_new boolean
)
language plpgsql
as $$
begin
  select id, false
  into diary_id, created_new
  from public.diaries
  where chronicle_id = target_chronicle_id
    and status = 'active'
  limit 1;

  if found then
    return next;
    return;
  end if;

  insert into public.diaries (chronicle_id, title, memory_capacity)
  values (target_chronicle_id, 'The Diary', 4)
  returning id into diary_id;

  created_new := true;
  return next;
end;
$$;

create or replace function public.apply_memory_overflow(
  target_chronicle_id uuid,
  target_memory_id uuid,
  overflow_mode text
)
returns jsonb
language plpgsql
as $$
declare
  overflow_target public.memories%rowtype;
  overflow_events jsonb := '[]'::jsonb;
  active_diary_id uuid;
  diary_created boolean := false;
  active_diary_title text;
  active_diary_capacity integer;
  active_diary_memory_count integer;
begin
  overflow_target := public.require_in_mind_memory(
    target_chronicle_id,
    target_memory_id
  );

  if overflow_mode = 'forget-existing' then
    update public.memories
    set
      diary_id = null,
      forgotten_at = now(),
      location = 'forgotten',
      slot_index = null
    where id = overflow_target.id;

    overflow_events := overflow_events || jsonb_build_array(
      jsonb_build_object(
        'eventType', 'memory_forgotten',
        'summary', 'An old memory has been surrendered to the dark.'
      )
    );
  elsif overflow_mode = 'move-to-diary' then
    select diary_id, created_new
    into active_diary_id, diary_created
    from public.ensure_active_diary(target_chronicle_id);

    select diary_id, diary_title, memory_capacity, memory_count
    into active_diary_id, active_diary_title, active_diary_capacity, active_diary_memory_count
    from public.active_diary_usage(target_chronicle_id);

    if coalesce(active_diary_memory_count, 0) >= active_diary_capacity then
      raise exception 'The diary is already full.'
        using errcode = 'P0001';
    end if;

    if diary_created then
      overflow_events := overflow_events || jsonb_build_array(
        jsonb_build_object(
          'eventType', 'diary_created',
          'summary', 'A diary has been opened against forgetting.'
        )
      );
    end if;

    update public.memories
    set
      diary_id = active_diary_id,
      location = 'diary',
      slot_index = null
    where id = overflow_target.id;

    overflow_events := overflow_events || jsonb_build_array(
      jsonb_build_object(
        'eventType', 'memory_moved_to_diary',
        'summary', 'A memory has been placed into the diary.'
      )
    );
  else
    raise exception 'A memory decision is required when the mind is full.'
      using errcode = 'P0001';
  end if;

  return overflow_events;
end;
$$;
