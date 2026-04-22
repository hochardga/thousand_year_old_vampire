create table public.feedback_submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  chronicle_id uuid references public.chronicles(id) on delete set null,
  source text not null check (source in ('recap')),
  category text not null check (category in ('delight', 'friction', 'bug', 'question')),
  body text not null check (char_length(trim(body)) between 20 and 4000),
  created_at timestamptz not null default timezone('utc'::text, now())
);

alter table public.feedback_submissions enable row level security;

create policy "feedback submissions are insertable by their owner"
on public.feedback_submissions
for insert
with check (
  auth.uid() = user_id
  and (
    chronicle_id is null
    or public.user_owns_chronicle(chronicle_id)
  )
);
