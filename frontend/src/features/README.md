# Feature modules

Keep business code in role-owned modules:

- `auth/` contains session types, route guards, and auth screens.
- `influencer/`, `store-admin/`, and `admin/` own each workspace's pages, API clients, components, and hooks.
- `shared/` is only for UI or domain code genuinely used by more than one role.

Routes in `src/routes` should stay thin: they define URL, protection, layout, and import the relevant feature page.
