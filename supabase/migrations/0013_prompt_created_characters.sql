alter table public.characters
  add column if not exists sort_order integer;

with ordered_characters as (
  select
    id,
    row_number() over (
      partition by chronicle_id
      order by introduced_at, id
    ) - 1 as backfilled_sort_order
  from public.characters
)
update public.characters
set sort_order = ordered_characters.backfilled_sort_order
from ordered_characters
where public.characters.id = ordered_characters.id
  and public.characters.sort_order is null;

alter table public.characters
  alter column sort_order set default 0,
  alter column sort_order set not null;

create or replace function public.complete_chronicle_setup(
  target_chronicle_id uuid,
  mortal_summary text,
  initial_skills jsonb default '[]'::jsonb,
  initial_resources jsonb default '[]'::jsonb,
  initial_characters jsonb default '[]'::jsonb,
  immortal_character jsonb default '{}'::jsonb,
  mark jsonb default '{}'::jsonb,
  setup_memories jsonb default '[]'::jsonb
)
returns jsonb
language plpgsql
as $$
declare
  chronicle_record public.chronicles%rowtype;
  new_session_id uuid;
  inserted_skill_count integer := 0;
  inserted_resource_count integer := 0;
  inserted_character_count integer := 0;
  inserted_memory_count integer := 0;
  memory_row record;
  skill_row record;
  resource_row record;
  character_row record;
  new_memory_id uuid;
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

  if chronicle_record.status <> 'draft' then
    raise exception 'Chronicle setup has already been completed.'
      using errcode = 'P0001';
  end if;

  insert into public.sessions (chronicle_id, status, snapshot_json)
  values (
    target_chronicle_id,
    'in_progress',
    jsonb_build_object(
      'currentPromptEncounter', 1,
      'currentPromptNumber', 1
    )
  )
  returning id into new_session_id;

  for skill_row in
    select value, ordinality
    from jsonb_array_elements(coalesce(initial_skills, '[]'::jsonb)) with ordinality
  loop
    insert into public.skills (
      chronicle_id,
      label,
      description,
      sort_order
    )
    values (
      target_chronicle_id,
      skill_row.value->>'label',
      nullif(skill_row.value->>'description', ''),
      skill_row.ordinality - 1
    );
    inserted_skill_count := inserted_skill_count + 1;
  end loop;

  for resource_row in
    select value, ordinality
    from jsonb_array_elements(coalesce(initial_resources, '[]'::jsonb)) with ordinality
  loop
    insert into public.resources (
      chronicle_id,
      label,
      description,
      is_stationary,
      sort_order
    )
    values (
      target_chronicle_id,
      resource_row.value->>'label',
      nullif(resource_row.value->>'description', ''),
      coalesce((resource_row.value->>'isStationary')::boolean, false),
      resource_row.ordinality - 1
    );
    inserted_resource_count := inserted_resource_count + 1;
  end loop;

  for character_row in
    select value, ordinality
    from jsonb_array_elements(coalesce(initial_characters, '[]'::jsonb)) with ordinality
  loop
    insert into public.characters (
      chronicle_id,
      name,
      description,
      kind,
      sort_order
    )
    values (
      target_chronicle_id,
      character_row.value->>'name',
      coalesce(character_row.value->>'description', ''),
      coalesce((character_row.value->>'kind')::public.character_kind, 'mortal'),
      character_row.ordinality - 1
    );
    inserted_character_count := inserted_character_count + 1;
  end loop;

  if coalesce(immortal_character->>'name', '') <> '' then
    insert into public.characters (
      chronicle_id,
      name,
      description,
      kind,
      sort_order
    )
    values (
      target_chronicle_id,
      immortal_character->>'name',
      coalesce(immortal_character->>'description', ''),
      coalesce((immortal_character->>'kind')::public.character_kind, 'immortal'),
      inserted_character_count
    );
    inserted_character_count := inserted_character_count + 1;
  end if;

  if coalesce(mark->>'label', '') <> '' then
    insert into public.marks (
      chronicle_id,
      label,
      description,
      is_concealed,
      is_active
    )
    values (
      target_chronicle_id,
      mark->>'label',
      coalesce(mark->>'description', ''),
      coalesce((mark->>'isConcealed')::boolean, false),
      true
    );
  end if;

  for memory_row in
    select value, ordinality
    from jsonb_array_elements(coalesce(setup_memories, '[]'::jsonb)) with ordinality
  loop
    insert into public.memories (
      chronicle_id,
      title,
      location,
      slot_index
    )
    values (
      target_chronicle_id,
      memory_row.value->>'title',
      'mind',
      least(memory_row.ordinality, 5)
    )
    returning id into new_memory_id;

    insert into public.memory_entries (
      memory_id,
      position,
      entry_text
    )
    values (
      new_memory_id,
      1,
      coalesce(memory_row.value->>'entryText', '')
    );

    inserted_memory_count := inserted_memory_count + 1;
  end loop;

  update public.chronicles
  set
    current_prompt_number = 1,
    current_prompt_encounter = 1,
    current_session_id = new_session_id,
    last_played_at = now(),
    mortal_summary = nullif($2, ''),
    prompt_version = 'base',
    status = 'active',
    vampire_name = coalesce(nullif(immortal_character->>'name', ''), vampire_name)
  where id = target_chronicle_id;

  insert into public.archive_events (
    chronicle_id,
    session_id,
    event_type,
    summary,
    metadata
  )
  values (
    target_chronicle_id,
    new_session_id,
    'setup_completed',
    'The life before undeath has been set down.',
    jsonb_build_object(
      'characters', inserted_character_count,
      'memories', inserted_memory_count,
      'resources', inserted_resource_count,
      'skills', inserted_skill_count
    )
  );

  return jsonb_build_object(
    'chronicleId', target_chronicle_id,
    'createdEntities', jsonb_build_object(
      'characters', inserted_character_count,
      'memories', inserted_memory_count,
      'resources', inserted_resource_count,
      'skills', inserted_skill_count
    ),
    'currentPromptEncounter', 1,
    'currentPromptNumber', 1,
    'nextRoute', format('/chronicles/%s/play', target_chronicle_id),
    'sessionId', new_session_id
  );
end;
$$;

create or replace function public.create_prompt_character(
  target_chronicle_id uuid,
  new_character jsonb
)
returns uuid
language plpgsql
as $$
declare
  created_character_id uuid;
  locked_chronicle public.chronicles%rowtype;
  new_character_description text;
  new_character_kind public.character_kind;
  new_character_name text;
  new_sort_order integer;
begin
  if new_character is null then
    return null;
  end if;

  select *
  into locked_chronicle
  from public.chronicles
  where id = target_chronicle_id
  for update;

  if not found then
    raise exception 'Chronicle not found.'
      using errcode = 'P0001';
  end if;

  new_character_name := btrim(coalesce(new_character->>'name', ''));
  new_character_description := btrim(coalesce(new_character->>'description', ''));
  new_character_kind := coalesce(
    nullif(new_character->>'kind', '')::public.character_kind,
    'mortal'
  );

  if new_character_name = '' then
    raise exception 'A character name is required.'
      using errcode = 'P0001';
  end if;

  if new_character_description = '' then
    raise exception 'A character description is required.'
      using errcode = 'P0001';
  end if;

  if exists (
    select 1
    from public.characters
    where chronicle_id = target_chronicle_id
      and btrim(name) = new_character_name
  ) then
    raise exception 'A character with this name already exists.'
      using errcode = 'P0001';
  end if;

  select coalesce(max(sort_order), -1) + 1
  into new_sort_order
  from public.characters
  where chronicle_id = target_chronicle_id;

  insert into public.characters (
    chronicle_id,
    name,
    description,
    kind,
    sort_order
  )
  values (
    target_chronicle_id,
    new_character_name,
    new_character_description,
    new_character_kind,
    new_sort_order
  )
  returning id into created_character_id;

  return created_character_id;
end;
$$;

drop function if exists public.resolve_prompt_run(uuid, uuid, text, text, jsonb, jsonb, jsonb, jsonb, jsonb);

create or replace function public.resolve_prompt_run(
  target_chronicle_id uuid,
  target_session_id uuid,
  player_entry text,
  experience_text text,
  memory_decision jsonb default null,
  trait_mutations jsonb default '{}'::jsonb,
  new_skill jsonb default null,
  new_resource jsonb default null,
  new_mark jsonb default null,
  new_character jsonb default null
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
  selected_memory_id uuid;
  target_memory_id uuid;
  mind_memory_count integer;
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
    select greatest(
      coalesce(max(encounter_index), 0),
      case
        when candidate_prompt_number = chronicle_record.current_prompt_number
          then chronicle_record.current_prompt_encounter
        else 0
      end
    ) + 1
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

    perform public.require_in_mind_memory(
      target_chronicle_id,
      target_memory_id,
      'Only memories still held in mind can accept new entries.'
    );

    next_entry_position := public.memory_entry_count(target_memory_id);

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
    into mind_memory_count
    from public.memories
    where chronicle_id = target_chronicle_id
      and location = 'mind';

    if mind_memory_count >= 5 then
      selected_memory_id := nullif(memory_decision->>'memoryId', '')::uuid;
      event_payload := event_payload || public.apply_memory_overflow(
        target_chronicle_id,
        selected_memory_id,
        coalesce(memory_decision->>'mode', '')
      );
    end if;

    available_slot := public.next_open_memory_slot(target_chronicle_id);

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

  perform public.create_prompt_skill(target_chronicle_id, new_skill);
  perform public.create_prompt_resource(target_chronicle_id, new_resource);
  perform public.create_prompt_mark(target_chronicle_id, new_mark);
  perform public.create_prompt_character(target_chronicle_id, new_character);

  insert into public.archive_events (
    chronicle_id,
    session_id,
    event_type,
    summary,
    metadata
  )
  select
    target_chronicle_id,
    target_session_id,
    event_row.value->>'eventType',
    event_row.value->>'summary',
    case
      when event_row.value->>'eventType' = 'prompt_resolved' then
        jsonb_build_object(
          'd10', d10_roll,
          'd6', d6_roll,
          'movement', movement,
          'nextPromptEncounter', next_prompt_encounter,
          'nextPromptNumber', next_prompt_number,
          'promptRunId', new_prompt_run_id
        )
      else '{}'::jsonb
    end
  from jsonb_array_elements(event_payload) as event_row(value);

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
