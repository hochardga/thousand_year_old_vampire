create or replace function public.resolve_prompt_run(
  target_chronicle_id uuid,
  target_session_id uuid,
  player_entry text,
  experience_text text,
  memory_decision jsonb default null,
  trait_mutations jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
as $$
declare
  chronicle_record public.chronicles%rowtype;
  prompt_record public.prompt_catalog%rowtype;
  session_record public.sessions%rowtype;
  new_prompt_run_id uuid;
  d10_roll integer := floor(random() * 10 + 1)::integer;
  d6_roll integer := floor(random() * 6 + 1)::integer;
  candidate_prompt_number integer;
  movement integer;
  next_prompt_number integer;
  next_prompt_encounter integer := 1;
  active_diary_id uuid;
  selected_memory_id uuid;
  target_memory_id uuid;
  selected_memory_location public.memory_location;
  selected_memory_entry_count integer;
  available_slot integer;
  next_entry_position integer;
  event_payload jsonb := '[]'::jsonb;
  mutation_row record;
begin
  select *
  into chronicle_record
  from public.chronicles
  where id = target_chronicle_id
    and user_id = auth.uid()
  for update;

  if not found then
    raise exception 'Chronicle not found.'
      using errcode = 'P0001';
  end if;

  select *
  into session_record
  from public.sessions
  where id = target_session_id
    and chronicle_id = target_chronicle_id
  for update;

  if not found then
    raise exception 'Session not found.'
      using errcode = 'P0001';
  end if;

  if chronicle_record.current_session_id is distinct from target_session_id then
    raise exception 'The active session no longer matches this request.'
      using errcode = 'P0001';
  end if;

  if session_record.status <> 'in_progress' then
    raise exception 'Session is not active.'
      using errcode = 'P0001';
  end if;

  select *
  into prompt_record
  from public.prompt_catalog
  where prompt_number = chronicle_record.current_prompt_number
    and encounter_index = chronicle_record.current_prompt_encounter
    and prompt_version = chronicle_record.prompt_version;

  if not found then
    raise exception 'Prompt not found in prompt catalog.'
      using errcode = 'P0001';
  end if;

  movement := d10_roll - d6_roll;
  candidate_prompt_number := greatest(1, chronicle_record.current_prompt_number + movement);

  loop
    select coalesce(max(encounter_index), 0) + 1
    into next_prompt_encounter
    from public.prompt_runs
    where chronicle_id = target_chronicle_id
      and prompt_number = candidate_prompt_number
      and prompt_version = chronicle_record.prompt_version;

    if exists (
      select 1
      from public.prompt_catalog
      where prompt_number = candidate_prompt_number
        and encounter_index = next_prompt_encounter
        and prompt_version = chronicle_record.prompt_version
    ) then
      next_prompt_number := candidate_prompt_number;
      exit;
    end if;

    candidate_prompt_number := candidate_prompt_number + 1;
    next_prompt_encounter := 1;

    if candidate_prompt_number > 500 then
      raise exception 'The next prompt could not be found.'
        using errcode = 'P0001';
    end if;
  end loop;

  insert into public.prompt_runs (
    chronicle_id,
    session_id,
    prompt_number,
    encounter_index,
    prompt_version,
    d10_roll,
    d6_roll,
    movement,
    prompt_markdown,
    player_entry,
    experience_text,
    next_prompt_number,
    next_prompt_encounter
  )
  values (
    target_chronicle_id,
    target_session_id,
    chronicle_record.current_prompt_number,
    chronicle_record.current_prompt_encounter,
    chronicle_record.prompt_version,
    d10_roll,
    d6_roll,
    movement,
    prompt_record.prompt_markdown,
    player_entry,
    experience_text,
    next_prompt_number,
    next_prompt_encounter
  )
  returning id into new_prompt_run_id;

  event_payload := event_payload || jsonb_build_array(
    jsonb_build_object(
      'eventType', 'prompt_resolved',
      'summary', 'The entry has been set into memory.'
    )
  );

  if memory_decision is null then
    memory_decision := jsonb_build_object('mode', 'create-new');
  end if;

  if coalesce(memory_decision->>'mode', 'create-new') = 'append-existing' then
    target_memory_id := nullif(memory_decision->>'targetMemoryId', '')::uuid;

    select count(*)
    into next_entry_position
    from public.memory_entries
    where memory_id = target_memory_id;

    if next_entry_position >= 3 then
      raise exception 'That memory is already full.'
        using errcode = 'P0001';
    end if;

    insert into public.memory_entries (
      memory_id,
      prompt_run_id,
      position,
      entry_text
    )
    values (
      target_memory_id,
      new_prompt_run_id,
      next_entry_position + 1,
      experience_text
    );
  else
    select count(*)
    into selected_memory_entry_count
    from public.memories
    where chronicle_id = target_chronicle_id
      and location = 'mind';

    if selected_memory_entry_count >= 5 then
      selected_memory_id := nullif(memory_decision->>'memoryId', '')::uuid;

      if coalesce(memory_decision->>'mode', '') = 'forget-existing' then
        update public.memories
        set
          diary_id = null,
          forgotten_at = now(),
          location = 'forgotten',
          slot_index = null
        where id = selected_memory_id
          and chronicle_id = target_chronicle_id;

        event_payload := event_payload || jsonb_build_array(
          jsonb_build_object(
            'eventType', 'memory_forgotten',
            'summary', 'An old memory has been surrendered to the dark.'
          )
        );
      elsif coalesce(memory_decision->>'mode', '') = 'move-to-diary' then
        select id
        into active_diary_id
        from public.diaries
        where chronicle_id = target_chronicle_id
          and status = 'active'
        limit 1;

        if active_diary_id is null then
          insert into public.diaries (chronicle_id, title)
          values (target_chronicle_id, 'The Diary')
          returning id into active_diary_id;

          event_payload := event_payload || jsonb_build_array(
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
        where id = selected_memory_id
          and chronicle_id = target_chronicle_id;

        event_payload := event_payload || jsonb_build_array(
          jsonb_build_object(
            'eventType', 'memory_moved_to_diary',
            'summary', 'A memory has been placed into the diary.'
          )
        );
      else
        raise exception 'A memory decision is required when the mind is full.'
          using errcode = 'P0001';
      end if;
    end if;

    select min(slot_number)
    into available_slot
    from generate_series(1, 5) as slot_number
    where slot_number not in (
      select slot_index
      from public.memories
      where chronicle_id = target_chronicle_id
        and location = 'mind'
        and slot_index is not null
    );

    if available_slot is null then
      raise exception 'No in-mind memory slot is available.'
        using errcode = 'P0001';
    end if;

    insert into public.memories (
      chronicle_id,
      title,
      location,
      slot_index
    )
    values (
      target_chronicle_id,
      left(experience_text, 80),
      'mind',
      available_slot
    )
    returning id into target_memory_id;

    insert into public.memory_entries (
      memory_id,
      prompt_run_id,
      position,
      entry_text
    )
    values (
      target_memory_id,
      new_prompt_run_id,
      1,
      experience_text
    );
  end if;

  for mutation_row in
    select value
    from jsonb_array_elements(coalesce(trait_mutations->'skills', '[]'::jsonb))
  loop
    update public.skills
    set status = case mutation_row.value->>'action'
      when 'check' then 'checked'
      when 'lose' then 'lost'
      else status
    end
    where id = (mutation_row.value->>'id')::uuid
      and chronicle_id = target_chronicle_id;
  end loop;

  for mutation_row in
    select value
    from jsonb_array_elements(coalesce(trait_mutations->'resources', '[]'::jsonb))
  loop
    update public.resources
    set status = case mutation_row.value->>'action'
      when 'check' then 'checked'
      when 'lose' then 'lost'
      else status
    end
    where id = (mutation_row.value->>'id')::uuid
      and chronicle_id = target_chronicle_id;
  end loop;

  for mutation_row in
    select value
    from jsonb_array_elements(coalesce(trait_mutations->'characters', '[]'::jsonb))
  loop
    update public.characters
    set
      retired_at = case
        when mutation_row.value->>'action' in ('age-out', 'lose') then now()
        else retired_at
      end,
      status = case mutation_row.value->>'action'
        when 'age-out' then 'dead'
        when 'lose' then 'lost'
        else status
      end
    where id = (mutation_row.value->>'id')::uuid
      and chronicle_id = target_chronicle_id;
  end loop;

  for mutation_row in
    select value
    from jsonb_array_elements(coalesce(trait_mutations->'marks', '[]'::jsonb))
  loop
    update public.marks
    set
      description = coalesce(nullif(mutation_row.value->>'description', ''), description),
      is_active = coalesce((mutation_row.value->>'isActive')::boolean, is_active),
      is_concealed = coalesce((mutation_row.value->>'isConcealed')::boolean, is_concealed)
    where id = (mutation_row.value->>'id')::uuid
      and chronicle_id = target_chronicle_id;
  end loop;

  insert into public.archive_events (
    chronicle_id,
    session_id,
    event_type,
    summary,
    metadata
  )
  values (
    target_chronicle_id,
    target_session_id,
    'prompt_resolved',
    'The entry has been set into memory.',
    jsonb_build_object(
      'd10', d10_roll,
      'd6', d6_roll,
      'movement', movement,
      'nextPromptEncounter', next_prompt_encounter,
      'nextPromptNumber', next_prompt_number,
      'promptRunId', new_prompt_run_id
    )
  );

  update public.sessions
  set snapshot_json = jsonb_build_object(
    'currentPromptEncounter', next_prompt_encounter,
    'currentPromptNumber', next_prompt_number
  )
  where id = target_session_id;

  update public.chronicles
  set
    current_prompt_number = next_prompt_number,
    current_prompt_encounter = next_prompt_encounter,
    current_session_id = target_session_id,
    last_played_at = now()
  where id = target_chronicle_id;

  return jsonb_build_object(
    'archiveEvents', event_payload,
    'nextPrompt', jsonb_build_object(
      'encounterIndex', next_prompt_encounter,
      'promptNumber', next_prompt_number
    ),
    'promptRunId', new_prompt_run_id,
    'rolled', jsonb_build_object(
      'd10', d10_roll,
      'd6', d6_roll,
      'movement', movement
    )
  );
end;
$$;
