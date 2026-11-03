# Admin reports

`/admin/reports` now filters all totals and charts together using **Daily**, **Weekly**, **Monthly**, and **Yearly** calendar periods. The reference-date picker accepts any date inside the requested period. Weeks run Monday through Sunday. Completion timestamps are interpreted in `Asia/Manila` before date filtering, including the first day and excluding the first day of the next period.

The initial view uses the current month in Philippines time. `src/data/reports.ts` starts with an empty collection until authorized reporting queries are connected. Browser-local pending requests are not treated as completed repairs or payments.

- Revenue aggregates supplied completed-job amounts in integer centavos. No payments integration is implemented.
- The brand donut and its textual legend show repair counts and percentage shares, ordered highest first, with alphabetical tie-breaking. Common brand spelling/case variants are combined; missing brands appear as **Unknown**. Brand colors remain stable between periods.
- Service-type counts use the exact same completed jobs, and display counts and percentage shares.
- Empty periods show zero totals and explicit empty states, not fake chart segments. An invalid or cleared date shows a validation message instead of stale totals.
- The donut uses responsive SVG with accessible title/description and a textual legend, without adding a chart dependency.

For Supabase integration, supply authorized completed-job reporting queries using the same business timezone and boundaries. Aggregate revenue from the agreed financial source and label its accounting basis explicitly. API failures must not produce fabricated totals.
