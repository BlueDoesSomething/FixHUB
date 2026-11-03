# Responsive app layout

- Below **1024 CSS pixels**, customer, technician, and admin workspaces use a persistent five-button bottom menu. At **1024 pixels and above**, the sidebar and desktop top bar replace it.
- Every role has a **More** destination for secondary tools. Customer: reviews, care, status, tracking, location, application, and profile. Technician: reviews and profile. Admin: applications and profile.
- Bottom-menu items and More links come from the same `src/data/navigation.ts` configuration. Desktop-only tools are not crammed into the bottom menu; mobile-only More links are not shown in the desktop sidebar.
- Active styling follows nested routes: repair steps remain in Request, saved requests in Repairs, nested chats in Messages, and secondary tools in More.
- The shared shell uses dynamic viewport height (`100dvh`, with `100vh` fallback). Ionic reserves the bottom bar's height outside the page scroller, including the device's bottom safe area. Do not add `position: fixed` or arbitrary bottom margins to individual pages to compensate for navigation.
- Shared grids can shrink below their normal card widths. Small screens get wrapping table rows, two-column statistics, stacked detail panels, larger touch targets, and 16px form controls to avoid iOS focus zoom.
- Navigation retains role-based routes; authentication and data access are described in `supabase-setup.md`.

## Checks

```powershell
npm run test:unit -- --run
npm run build
```

With the development server running, run `tests/e2e/specs/responsive-navigation.cy.ts` for narrow phone, tablet, desktop-resize, nested navigation, safe-area, and scrolled-content checks.
