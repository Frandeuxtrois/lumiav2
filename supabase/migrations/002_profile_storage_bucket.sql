-- Bucket publico para la foto de perfil. PhotoUpload sube photo.{ext} con upsert.

insert into storage.buckets (id, name, public)
values ('profile', 'profile', true)
on conflict (id) do nothing;

-- upsert:true necesita insert + update sobre storage.objects.
create policy "authenticated_manage_profile_photo" on storage.objects
  for all to authenticated
  using (bucket_id = 'profile')
  with check (bucket_id = 'profile');

create policy "anon_read_profile_objects" on storage.objects
  for select to anon
  using (bucket_id = 'profile');
