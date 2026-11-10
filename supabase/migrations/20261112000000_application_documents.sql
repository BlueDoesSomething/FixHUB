-- Private, authenticated application attachments; never expose a public URL.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('application-documents', 'application-documents', false, 5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'application/pdf'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy application_documents_upload on storage.objects
for insert to authenticated with check (
  bucket_id = 'application-documents'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and exists (select 1 from public.technician_applications a
    where a.id::text = (storage.foldername(name))[2] and a.applicant_id = (select auth.uid())
      and a.status in ('pending', 'needs_information'))
);

create policy application_documents_read on storage.objects
for select to authenticated using (
  bucket_id = 'application-documents' and
  ((storage.foldername(name))[1] = (select auth.uid())::text or public.is_admin())
);
