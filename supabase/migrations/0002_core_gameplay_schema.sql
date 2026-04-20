create type public.session_status as enum (
  'in_progress',
  'paused',
  'closed'
);

create type public.memory_location as enum (
  'mind',
  'diary',
  'forgotten'
);

create type public.trait_status as enum (
  'active',
  'checked',
  'lost'
);

create type public.diary_status as enum (
  'active',
  'lost'
);

create type public.character_kind as enum (
  'mortal',
  'immortal'
);

create type public.character_status as enum (
  'active',
  'dead',
  'lost'
);

alter table public.chronicles
  add column if not exists mortal_summary text,
  add column if not exists prompt_version text not null default 'base';

create table public.prompt_catalog (
  prompt_number integer not null,
  encounter_index integer not null default 1,
  prompt_markdown text not null,
  prompt_version text not null default 'base',
  primary key (prompt_number, encounter_index, prompt_version)
);

create table public.sessions (
  id uuid primary key default gen_random_uuid(),
  chronicle_id uuid not null references public.chronicles(id) on delete cascade,
  status public.session_status not null default 'in_progress',
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  recap_markdown text,
  snapshot_json jsonb not null default '{}'::jsonb
);

alter table public.chronicles
  add constraint chronicles_current_session_id_fkey
  foreign key (current_session_id) references public.sessions(id) on delete set null;

create table public.prompt_runs (
  id uuid primary key default gen_random_uuid(),
  chronicle_id uuid not null references public.chronicles(id) on delete cascade,
  session_id uuid not null references public.sessions(id) on delete cascade,
  prompt_number integer not null,
  encounter_index integer not null default 1,
  prompt_version text not null default 'base',
  d10_roll integer not null check (d10_roll between 1 and 10),
  d6_roll integer not null check (d6_roll between 1 and 6),
  movement integer not null,
  prompt_markdown text not null,
  player_entry text not null,
  experience_text text not null,
  next_prompt_number integer not null,
  next_prompt_encounter integer not null default 1,
  created_at timestamptz not null default now(),
  unique (session_id, prompt_number, encounter_index)
);

create table public.diaries (
  id uuid primary key default gen_random_uuid(),
  chronicle_id uuid not null references public.chronicles(id) on delete cascade,
  title text not null,
  status public.diary_status not null default 'active',
  created_at timestamptz not null default now(),
  lost_at timestamptz
);

create table public.memories (
  id uuid primary key default gen_random_uuid(),
  chronicle_id uuid not null references public.chronicles(id) on delete cascade,
  title text not null,
  location public.memory_location not null default 'mind',
  slot_index integer check (slot_index between 1 and 5),
  diary_id uuid references public.diaries(id) on delete set null,
  forgotten_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.memory_entries (
  id uuid primary key default gen_random_uuid(),
  memory_id uuid not null references public.memories(id) on delete cascade,
  prompt_run_id uuid references public.prompt_runs(id) on delete set null,
  position integer not null check (position between 1 and 3),
  entry_text text not null,
  created_at timestamptz not null default now()
);

create table public.skills (
  id uuid primary key default gen_random_uuid(),
  chronicle_id uuid not null references public.chronicles(id) on delete cascade,
  label text not null,
  description text,
  status public.trait_status not null default 'active',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.resources (
  id uuid primary key default gen_random_uuid(),
  chronicle_id uuid not null references public.chronicles(id) on delete cascade,
  label text not null,
  description text,
  is_stationary boolean not null default false,
  status public.trait_status not null default 'active',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.characters (
  id uuid primary key default gen_random_uuid(),
  chronicle_id uuid not null references public.chronicles(id) on delete cascade,
  name text not null,
  description text not null,
  kind public.character_kind not null,
  status public.character_status not null default 'active',
  introduced_at timestamptz not null default now(),
  retired_at timestamptz
);

create table public.marks (
  id uuid primary key default gen_random_uuid(),
  chronicle_id uuid not null references public.chronicles(id) on delete cascade,
  label text not null,
  description text not null,
  is_concealed boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.archive_events (
  id uuid primary key default gen_random_uuid(),
  chronicle_id uuid not null references public.chronicles(id) on delete cascade,
  session_id uuid references public.sessions(id) on delete set null,
  event_type text not null,
  summary text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create trigger set_memories_updated_at
before update on public.memories
for each row
execute function public.set_updated_at();

create trigger set_skills_updated_at
before update on public.skills
for each row
execute function public.set_updated_at();

create trigger set_resources_updated_at
before update on public.resources
for each row
execute function public.set_updated_at();

create index idx_sessions_chronicle_status
  on public.sessions (chronicle_id, status);

create index idx_prompt_runs_chronicle_created_at
  on public.prompt_runs (chronicle_id, created_at desc);

create index idx_memories_chronicle_location
  on public.memories (chronicle_id, location, slot_index);

create unique index idx_memories_mind_slot_unique
  on public.memories (chronicle_id, slot_index)
  where location = 'mind';

create unique index idx_active_diary_unique
  on public.diaries (chronicle_id)
  where status = 'active';

create index idx_archive_events_chronicle_created_at
  on public.archive_events (chronicle_id, created_at desc);

create index idx_characters_chronicle_status
  on public.characters (chronicle_id, status);

create or replace function public.user_owns_chronicle(target_chronicle_id uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.chronicles
    where id = target_chronicle_id
      and user_id = auth.uid()
  );
$$;

alter table public.prompt_catalog enable row level security;
alter table public.sessions enable row level security;
alter table public.prompt_runs enable row level security;
alter table public.diaries enable row level security;
alter table public.memories enable row level security;
alter table public.memory_entries enable row level security;
alter table public.skills enable row level security;
alter table public.resources enable row level security;
alter table public.characters enable row level security;
alter table public.marks enable row level security;
alter table public.archive_events enable row level security;

create policy "prompt catalog is readable by authenticated users"
on public.prompt_catalog
for select
using (auth.role() = 'authenticated');

create policy "sessions are readable by their owner"
on public.sessions
for select
using (public.user_owns_chronicle(chronicle_id));

create policy "sessions are insertable by their owner"
on public.sessions
for insert
with check (public.user_owns_chronicle(chronicle_id));

create policy "sessions are updatable by their owner"
on public.sessions
for update
using (public.user_owns_chronicle(chronicle_id))
with check (public.user_owns_chronicle(chronicle_id));

create policy "prompt runs are readable by their owner"
on public.prompt_runs
for select
using (public.user_owns_chronicle(chronicle_id));

create policy "prompt runs are insertable by their owner"
on public.prompt_runs
for insert
with check (public.user_owns_chronicle(chronicle_id));

create policy "diaries are readable by their owner"
on public.diaries
for select
using (public.user_owns_chronicle(chronicle_id));

create policy "diaries are insertable by their owner"
on public.diaries
for insert
with check (public.user_owns_chronicle(chronicle_id));

create policy "diaries are updatable by their owner"
on public.diaries
for update
using (public.user_owns_chronicle(chronicle_id))
with check (public.user_owns_chronicle(chronicle_id));

create policy "memories are readable by their owner"
on public.memories
for select
using (public.user_owns_chronicle(chronicle_id));

create policy "memories are insertable by their owner"
on public.memories
for insert
with check (public.user_owns_chronicle(chronicle_id));

create policy "memories are updatable by their owner"
on public.memories
for update
using (public.user_owns_chronicle(chronicle_id))
with check (public.user_owns_chronicle(chronicle_id));

create policy "memory entries are readable by their owner"
on public.memory_entries
for select
using (
  exists (
    select 1
    from public.memories
    where id = memory_entries.memory_id
      and public.user_owns_chronicle(chronicle_id)
  )
);

create policy "memory entries are insertable by their owner"
on public.memory_entries
for insert
with check (
  exists (
    select 1
    from public.memories
    where id = memory_entries.memory_id
      and public.user_owns_chronicle(chronicle_id)
  )
);

create policy "skills are readable by their owner"
on public.skills
for select
using (public.user_owns_chronicle(chronicle_id));

create policy "skills are insertable by their owner"
on public.skills
for insert
with check (public.user_owns_chronicle(chronicle_id));

create policy "skills are updatable by their owner"
on public.skills
for update
using (public.user_owns_chronicle(chronicle_id))
with check (public.user_owns_chronicle(chronicle_id));

create policy "resources are readable by their owner"
on public.resources
for select
using (public.user_owns_chronicle(chronicle_id));

create policy "resources are insertable by their owner"
on public.resources
for insert
with check (public.user_owns_chronicle(chronicle_id));

create policy "resources are updatable by their owner"
on public.resources
for update
using (public.user_owns_chronicle(chronicle_id))
with check (public.user_owns_chronicle(chronicle_id));

create policy "characters are readable by their owner"
on public.characters
for select
using (public.user_owns_chronicle(chronicle_id));

create policy "characters are insertable by their owner"
on public.characters
for insert
with check (public.user_owns_chronicle(chronicle_id));

create policy "characters are updatable by their owner"
on public.characters
for update
using (public.user_owns_chronicle(chronicle_id))
with check (public.user_owns_chronicle(chronicle_id));

create policy "marks are readable by their owner"
on public.marks
for select
using (public.user_owns_chronicle(chronicle_id));

create policy "marks are insertable by their owner"
on public.marks
for insert
with check (public.user_owns_chronicle(chronicle_id));

create policy "marks are updatable by their owner"
on public.marks
for update
using (public.user_owns_chronicle(chronicle_id))
with check (public.user_owns_chronicle(chronicle_id));

create policy "archive events are readable by their owner"
on public.archive_events
for select
using (public.user_owns_chronicle(chronicle_id));

create policy "archive events are insertable by their owner"
on public.archive_events
for insert
with check (public.user_owns_chronicle(chronicle_id));

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
    mortal_summary = nullif(mortal_summary, ''),
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
  next_prompt_number := greatest(1, chronicle_record.current_prompt_number + movement);

  if movement = 0 and exists (
    select 1
    from public.prompt_catalog
    where prompt_number = chronicle_record.current_prompt_number
      and encounter_index = chronicle_record.current_prompt_encounter + 1
      and prompt_version = chronicle_record.prompt_version
  ) then
    next_prompt_number := chronicle_record.current_prompt_number;
    next_prompt_encounter := chronicle_record.current_prompt_encounter + 1;
  else
    next_prompt_encounter := 1;
  end if;

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
