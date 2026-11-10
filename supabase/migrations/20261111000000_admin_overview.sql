-- Aggregate on the server so dashboard counts and rankings are not subject to
-- PostgREST's default 1,000-row limit. Admin identity is checked for every call.
create function public.admin_overview()
returns jsonb
language plpgsql stable security definer set search_path = ''
as $$
declare result jsonb;
begin
  if not public.is_admin() then raise exception 'Admin access required.'; end if;
  select jsonb_build_object(
    'users', (select count(*) from public.profiles),
    'technicians', (select count(*) from public.technician_profiles where is_active),
    'activeRepairs', (select count(*) from public.repair_requests where status in ('pending', 'accepted', 'en_route', 'arrived', 'in_progress')),
    'completed', (select count(*) from public.repair_requests where status = 'completed'),
    'applications', (select count(*) from public.technician_applications where status in ('pending', 'under_review')),
    'weekly', (select coalesce(jsonb_agg(jsonb_build_object('day', d.day, 'total', coalesce(r.total, 0)) order by d.day), '[]'::jsonb)
      from generate_series((now() at time zone 'Asia/Manila')::date - 6, (now() at time zone 'Asia/Manila')::date, interval '1 day') d(day)
      left join lateral (select count(*) total from public.repair_requests
        where status = 'completed' and (updated_at at time zone 'Asia/Manila')::date = d.day::date) r on true),
    'recent', (select coalesce(jsonb_agg(row_data order by created_at desc), '[]'::jsonb) from
      (select jsonb_build_object('id', r.id, 'reference', r.reference, 'device', r.device,
        'brand', r.brand, 'status', r.status, 'createdAt', r.created_at,
        'customer', coalesce(p.full_name, 'Customer')) row_data, r.created_at
       from public.repair_requests r left join public.profiles p on p.user_id = r.customer_id
       order by r.created_at desc limit 5) recent_rows),
    'topTechnicians', (select coalesce(jsonb_agg(row_data order by score desc, average_rating desc, repairs desc, review_count desc, name), '[]'::jsonb)
      from (select jsonb_build_object('id', ranked.id, 'name', ranked.name,
        'specialty', ranked.specialty, 'repairs', ranked.repairs, 'averageRating', ranked.average_rating,
        'reviewCount', ranked.review_count, 'score', ranked.score) row_data,
        ranked.score, ranked.average_rating, ranked.repairs, ranked.review_count, ranked.name
        from (select t.id, coalesce(p.full_name, 'Technician') name,
          coalesce(array_to_string(a.specializations, ', '), 'Technician') specialty,
          r.repairs, v.review_count, v.average_rating,
          100 * (0.7 * v.average_rating / 5 + 0.3 * r.repairs /
            nullif(max(r.repairs) over (), 0)) score
          from public.technician_profiles t
          join public.profiles p on p.user_id = t.user_id
          join public.technician_applications a on a.id = t.application_id
          cross join lateral (select count(*) repairs from public.repair_requests
            where technician_id = t.id and status = 'completed') r
          cross join lateral (select count(*) review_count, round(avg(rating), 2) average_rating
            from public.reviews where technician_id = t.id) v
          where t.is_active and r.repairs > 0 and v.review_count > 0) ranked
        order by score desc, average_rating desc, repairs desc, review_count desc, name limit 5) top_rows)
  ) into result;
  return result;
end;
$$;
revoke all on function public.admin_overview() from public, anon;
grant execute on function public.admin_overview() to authenticated;
