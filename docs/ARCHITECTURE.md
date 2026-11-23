# Architecture — Makazi Offline Prototype

## 1. Design Constraints

- **Zero-Server / `file://` Compatibility**: Browsers block ES module `<script type="module">` requests on `file://` due to CORS restrictions. All JavaScript files are written as classic IIFE modules attached to a single global namespace (`window.Makazi`) and loaded in dependency order via `<script defer>` tags in `index.html`.
- **Node Test Compatibility**: Core, Data, Rules, and Services modules check `if (typeof module !== 'undefined' && module.exports)` so the exact same business logic runs under Node's built-in test runner (`node --test`).

---

## 2. Layered Architecture

```
index.html
  ├── css/         (Design tokens, base, layout, components, forms, tables, print)
  ├── js/core/     (Namespace, constants, dates, money, IDs, HTML escape, event bus)
  ├── js/data/     (Schema validation, migrations, sample seed, localStorage wrapper)
  ├── js/rules/    (Pure domain rules — zero DOM, zero storage)
  ├── js/services/ (Use-case orchestration: validate via rules -> persist -> emit event)
  └── js/ui/       (Reusable components, views, hash router, application shell)
```

### Layer Responsibilities

1. **Core (`js/core/`)**: Shared primitives (`dates.js`, `money.js`, `ids.js`, `utils.js`, `escape.js`, `events.js`). Every user-supplied value passes through `Makazi.core.escape.html()` before DOM insertion.
2. **Data (`js/data/`)**: `storage.js` wraps `localStorage` under key `makazi.v1` inside `try/catch` blocks, falls back to in-memory storage if browser storage is blocked, validates payloads via `schema.js`, migrates older shapes via `migrations.js`, and recovers safely from corrupted JSON by restoring `sampleData.js`.
3. **Rules (`js/rules/`)**: Pure, deterministic functions enforcing BR1–BR6 and validation rules. Easy to unit-test with zero mocking.
4. **Services (`js/services/`)**: Coordinate rules and storage, returning uniform `{ ok: true, data }` or `{ ok: false, error: "..." }` result objects and emitting `data:changed` on `events.js`.
5. **UI (`js/ui/`)**: Components (`toast`, `modal`, `confirm`, `table`, `badge`, `formField`, `emptyState`, `statCard`, `filterBar`, `tabs`) and 9 views managed by `router.js`. Views never contain business rules.
