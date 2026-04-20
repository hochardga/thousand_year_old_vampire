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
    select value
    from jsonb_array_elements(coalesce(initial_characters, '[]'::jsonb))
  loop
    insert into public.characters (
      chronicle_id,
      name,
      description,
      kind
    )
    values (
      target_chronicle_id,
      character_row.value->>'name',
      coalesce(character_row.value->>'description', ''),
      coalesce((character_row.value->>'kind')::public.character_kind, 'mortal')
    );
    inserted_character_count := inserted_character_count + 1;
  end loop;

  if coalesce(immortal_character->>'name', '') <> '' then
    insert into public.characters (
      chronicle_id,
      name,
      description,
      kind
    )
    values (
      target_chronicle_id,
      immortal_character->>'name',
      coalesce(immortal_character->>'description', ''),
      coalesce((immortal_character->>'kind')::public.character_kind, 'immortal')
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
