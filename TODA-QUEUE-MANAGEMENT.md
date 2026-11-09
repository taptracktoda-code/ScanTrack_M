# Queue removal and My TODA

Managers open **Driver Management**, choose a waiting driver, and select
**Remove from queue**. The form offers **Left terminal** or **Other**; Other
requires a written reason of at most 500 characters. A review screen confirms
the driver and reason before submitting. Serving and completed entries cannot
be removed. The server targets the selected queue entry, so an old confirmation
cannot remove a driver's newer check-in.

The backend cancels the waiting entry and records the reason, manager, and
timestamp in a transaction using the same organization lock as QR check-in and
trip creation. Remaining drivers retain FIFO order and see their new positions
on the next five-second dashboard refresh. Removal closes open attendance with
a manual exit and sends a notification through the existing database/push
notification service. Push delivery requires a registered device token. A
returning driver must show their QR code again and join the end; the manual
enqueue endpoint cannot bypass that requirement. Existing QR duplicate-scan
protection still applies immediately after a recorded exit.

Managers can read the paginated **Queue removal activity** section in History.
The backend scopes removals and activity to the authenticated manager's TODA;
drivers and super admins cannot call these manager endpoints.

Drivers open **Profile → My TODA** to view their assigned organization and its
active managers, including names and available photos. Multiple active managers
are displayed when assigned. The official phone number comes from the TODA's
contact number; manager account contact fields and email addresses are never
returned. Empty assignments display “No manager assigned yet.” The section
refreshes on focus, foreground return, and every five seconds while focused.

## Backend setup

The backend changes have been applied to the existing Laravel project at
`C:\Users\Andrie\Desktop\webappreviveeeee`. The `backend-changes` directory in
this workspace preserves the new backend files and the idempotent application
script, including changes to routes, current queue entry IDs, timestamp casts,
and the manual enqueue guard. It does not create a second queue system.

The local MySQL service was initially stopped. It was running during the later
mobile operations update, and the queue audit migration is now applied locally.
For a new environment, run this in the Laravel project:

```powershell
php artisan migrate --path=database/migrations/2026_11_08_000001_add_queue_removal_audit.php --force
```

This adds nullable audit columns and an index to the existing queue table.
Apply it before using the updated app. Existing queue mutations remain in
the existing tables.

For the subsequent daily reports, alerts, Settings, and issue request changes,
see [MOBILE-OPERATIONS.md](MOBILE-OPERATIONS.md). Its backend implementation
supersedes the older removal controller preserved in `backend-changes`.

API additions:

- `POST /api/manager/queue/{entry}/remove` — `reason: left_terminal | other`, optional `details` (required for Other).
- `GET /api/manager/queue/removals?page=1` — paginated TODA removal history.
- `GET /api/driver/toda` — the authenticated driver's TODA and public manager projection.
- Existing `GET /api/manager/drivers` now includes `queue_entry_id`.

## Verification

Backend regression coverage uses SQLite in memory, independently of the stopped
local MySQL database. It covers cancellation, FIFO advancement, notifications,
audit fields, stale removals, duplicate entries, reason validation, serving and
completed entries, fresh QR rejoining, the manual enqueue bypass, role/TODA
boundaries, private contact fields, and manager/driver reassignment.

```powershell
php artisan test --compact --filter='TodaQueueRemovalTest|RemovedDriverCheckInTest|MobileQueueWorkflowTest|QueueManagementTest|MobileNotificationApiTest'
```

The mobile test suite and targeted lint checks pass. Repository-wide TypeScript
and lint checks still report existing issues in `app-tabs.tsx`,
`app-tabs.web.tsx`, `use-theme.ts`, and `use-color-scheme.web.ts`, plus an unused
variable warning in `loading-state.tsx`. No phone/device UI validation was
performed.

Final checks: 15 backend tests passed (167 assertions); all 72 original mobile
tests passed, and the updated manager driver suite passed all 16 tests including
the new queue-entry targeting regression. Targeted lint passed for the changed
mobile files. Expo web export succeeded for all 22 routes; its generated output
is in `.expo/toda-queue-preview` (ignored by Git).

The required [Expo v57 documentation](https://docs.expo.dev/versions/v57.0.0/)
was read before coding. The existing project dependencies were preserved.
