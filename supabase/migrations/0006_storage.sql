-- ============================================================================
-- Velox Viral — 0006_storage
-- Storage buckets for post media and avatars, with owner-scoped policies.
--
-- Path convention is {user_id}/{filename}, and every policy asserts that the
-- first path segment equals auth.uid(). That makes cross-user access
-- impossible at the storage layer, not just in application code.
-- ============================================================================

-- post-media: private. Serving happens through short-lived signed URLs, so a
-- draft's media is never guessable by URL.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'post-media',
  'post-media',
  false,
  524288000, -- 500 MB, sized for short-form video
  array[
    'image/jpeg','image/png','image/webp','image/gif',
    'video/mp4','video/quicktime','video/webm'
  ]
)
on conflict (id) do update
  set file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types,
      public = excluded.public;

-- avatars: public, since a profile picture is rendered in shared contexts.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,
  5242880, -- 5 MB
  array['image/jpeg','image/png','image/webp']
)
on conflict (id) do update
  set file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types,
      public = excluded.public;

-- ---------------------------------------------------------------------------
-- post-media policies — owner-only, all operations
-- ---------------------------------------------------------------------------
drop policy if exists "post_media_select_own" on storage.objects;
create policy "post_media_select_own" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'post-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "post_media_insert_own" on storage.objects;
create policy "post_media_insert_own" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'post-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "post_media_update_own" on storage.objects;
create policy "post_media_update_own" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'post-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "post_media_delete_own" on storage.objects;
create policy "post_media_delete_own" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'post-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ---------------------------------------------------------------------------
-- avatars policies — world-readable, owner-writable
-- ---------------------------------------------------------------------------
drop policy if exists "avatars_public_read" on storage.objects;
create policy "avatars_public_read" on storage.objects
  for select using (bucket_id = 'avatars');

drop policy if exists "avatars_insert_own" on storage.objects;
create policy "avatars_insert_own" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "avatars_update_own" on storage.objects;
create policy "avatars_update_own" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "avatars_delete_own" on storage.objects;
create policy "avatars_delete_own" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
