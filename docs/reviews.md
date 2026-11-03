# Customer and technician reviews

Review pages start empty. The Supabase completed-repair, review, and reply queries still need to be connected; reviews are not published across devices yet.

## Access and eligibility

1. Sign in with a real account and open **My Reviews** from the sidebar, **More**, or **Profile**.
2. Only a completed repair belonging to the customer is eligible for a review. Pending browser-saved requests are not eligible.
3. Technician accounts can open **Customer Reviews**. No arbitrary technician profile is substituted when an account has no loaded profile.
4. Review controls support 1–5 stars, optional feedback up to 1,000 characters, and a single reply by the receiving technician.

Rating averages, counts, and distribution bars are calculated from supplied review records, never hard-coded ratings. Missing ratings display a dash. New browser storage is not seeded; clearing storage leaves it empty. Retired example records are ignored without deleting unrelated stored feedback.

## Boundaries

- Newly submitted repair requests remain pending in IndexedDB. They cannot be reviewed; the existing app does not yet connect technician assignment or completion to those requests.
- Client-side validation is **not** a production authorization boundary. Supabase operations must enforce authenticated ownership and completed-job eligibility server-side.
- Only the receiving technician can respond. Replies cannot change the customer rating or review text.
- Storage failures preserve form text and do not report successful publication. Unreadable stored data is not silently overwritten.
- Complete the Supabase review/reply integration before publishing feedback or claiming shared persistence.

## Admin overview: top technicians

The admin dashboard shows up to five verified technicians with at least one review and one completed repair. It uses the same review records as the customer and technician pages, so newly saved feedback updates the ranking.

The ranking score is `100 × (0.7 × average_rating / 5 + 0.3 × completed_repairs / highest_eligible_repair_total)`. Higher scores rank first; ties use average rating, completed repairs, review count, name, then ID. Scores are sorted at full precision and displayed to one decimal place.

The technician directory in `src/data/catalog.ts` starts empty. Populate it with server-verified completed-job counts and review aggregates when the backend is integrated. Browser-local pending requests never count toward completed repairs.
