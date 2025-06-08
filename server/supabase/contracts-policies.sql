-- Enable RLS on contracts table
alter table public.contracts enable row level security;

-- Policy for brands to create contracts
create policy "Brands can create contracts"
  on public.contracts for insert
  with check (
    auth.role() = 'authenticated'
    and auth.uid() = brand_id
  );

-- Policy for brands to view their contracts
create policy "Brands can view their contracts"
  on public.contracts for select
  using (
    auth.role() = 'authenticated'
    and auth.uid() = brand_id
  );

-- Policy for influencers to view their contracts
create policy "Influencers can view their contracts"
  on public.contracts for select
  using (
    auth.role() = 'authenticated'
    and auth.uid() = influencer_id
  );

-- Policy for brands to update their contracts
create policy "Brands can update their contracts"
  on public.contracts for update
  using (
    auth.role() = 'authenticated'
    and auth.uid() = brand_id
    and status != 'SIGNED'
  );

-- Policy for influencers to update their contracts when signing
create policy "Influencers can update their contracts when signing"
  on public.contracts for update
  using (
    auth.role() = 'authenticated'
    and auth.uid() = influencer_id
    and status = 'PENDING_SIGNATURE'
  ); 