-- Enable RLS on storage.objects
alter table storage.objects enable row level security;

-- For contracts bucket
create policy "Brands can upload contract PDFs"
  on storage.objects for insert
  with check (
    bucket_id = 'contracts'
    and auth.role() = 'authenticated'
    and (
      auth.uid() = (
        select brand_id from public.contracts 
        where id::text = storage.filename(name)::text
      )
      or
      not exists (
        select 1 from public.contracts 
        where id::text = storage.filename(name)::text
      )
    )
  );

create policy "Contract PDFs are accessible by involved parties"
  on storage.objects for select
  using (
    bucket_id = 'contracts'
    and auth.role() = 'authenticated'
    and (
      auth.uid() = (
        select brand_id from public.contracts 
        where id::text = storage.filename(name)::text
      )
      or
      auth.uid() = (
        select influencer_id from public.contracts 
        where id::text = storage.filename(name)::text
      )
    )
  );

-- For signatures bucket
create policy "Users can upload their own signatures"
  on storage.objects for insert
  with check (
    bucket_id = 'signatures'
    and auth.role() = 'authenticated'
    and (
      auth.uid()::text = (
        select unnest(string_to_array(storage.filename(name), '_'))
        limit 1
      )
    )
  );

create policy "Signatures are accessible by involved parties"
  on storage.objects for select
  using (
    bucket_id = 'signatures'
    and auth.role() = 'authenticated'
    and (
      auth.uid() = (
        select brand_id from public.contracts 
        where id::text = (
          select unnest(string_to_array(storage.filename(name), '_'))
          limit 1
        )
      )
      or
      auth.uid() = (
        select influencer_id from public.contracts 
        where id::text = (
          select unnest(string_to_array(storage.filename(name), '_'))
          limit 1
        )
      )
    )
  );

-- Allow users to update their own files
create policy "Users can update their own files"
  on storage.objects for update
  using (
    auth.role() = 'authenticated'
    and (
      case
        when bucket_id = 'contracts' then
          auth.uid() = (
            select brand_id from public.contracts 
            where id::text = storage.filename(name)::text
          )
        when bucket_id = 'signatures' then
          auth.uid()::text = (
            select unnest(string_to_array(storage.filename(name), '_'))
            limit 1
          )
        else false
      end
    )
  ); 