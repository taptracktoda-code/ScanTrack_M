# Mobile operations updates

All six requested features are implemented in the Expo client and the existing
Laravel backend at `C:\Users\Andrie\Desktop\webappreviveeeee`.

## Where to find the updates

- Driver Home and Trips show **Today's Completed Trips** beside **Lifetime Total
  Trips**. Lifetime total includes all recorded trips; today's count includes
  completed trips whose arrival timestamp is within the Philippine calendar day.
- Page connection banners distinguish device **Offline**, **Reconnecting**, and
  API unavailability, with the last successful server contact. The driver's queue
  retains its last successful snapshot on failed refreshes and displays a stale
  warning plus its own last successful queue refresh time.
- The driver's queue displays live position, waiting drivers ahead, and total
  waiting drivers. Drivers-ahead comes from the backend snapshot.
- Entering position 1 produces a database notification and, when a registered
  device is available, a push alert. Opening it loads the current queue rather
  than treating the old notification's position as current.
- Managers open **Profile → Attendance**. This uses the shared Attendance screen,
  with **Daily Manager Reports** directly below **My Attendance**. Manager accounts
  have no personal driver attendance; this is explicitly explained in that
  section. Existing driver attendance remains intact. Reports have an independent
  date selector, refresh, loading, empty, and error state. There is no reports tab.
- Drivers open **Profile → Settings** for **Change Password**, **Report an Issue**,
  and **My Requests**. Change Password reuses the existing screen and OTP endpoints;
  the duplicate Driver Profile button has been removed. Normal back navigation
  returns to Settings. Manager password placement is unchanged.
- Managers open **Profile → Settings → Driver Issue Requests**, with a pending
  count. Approving requires a reason and an explicit removal confirmation;
  rejection requires a reason and leaves the queue unchanged.

Settings and manager Attendance use stack navigation reached from Profile. The
existing bottom tabs are preserved; no hamburger menu or new bottom tab was added.

## Backend behavior

Daily windows use `Asia/Manila`, converted to half-open UTC ranges `[start, end)`.
Counts use arrival time, not trip creation or departure time. Attendance reports
count unique drivers with ENTRY records and show ENTRY/EXIT event counts
separately. Passenger totals include only completed trips in the chosen window.

Trips and attendance logs now retain an organization snapshot at creation, so
future driver transfers do not move those historical records to another TODA's
reports. **Legacy records are backfilled using each driver's known assignment at
migration time. Prior memberships cannot be reconstructed from records that never
stored an organization.** No trip or attendance records are deleted/reset.

General **Others** reports can be submitted with a required reason even outside
the queue. These reports have no queue entry; manager approval or rejection records
the decision without changing queue or attendance status. Queue-related requests
still target a specific waiting entry. Deploy the backend changes and run
`2026_11_09_000001_allow_general_driver_reports.php` to support general reports.

Queue-related issue requests target a specific queue entry. Submission does not change queue
status. Driver ownership and manager TODA restrictions are enforced by authenticated
routes and scoped queries. A nullable unique pending-entry key prevents duplicate
pending requests. Client request IDs make uncertain submission retries idempotent.
Decisions lock the organization, driver, original entry, and request. A repeated
decision or approval of a closed entry is rejected, so an old request cannot remove
a newer check-in. Approval uses the same removal/audit/manual-exit service as
direct manager removal and retains the fresh-QR-check-in requirement.

Queue-head notification claims and database notifications commit together under
the organization lock. Each queue entry receives at most one next-in-line claim.
Queue creation, calling a driver, starting a trip, explicit QR exit, and manager
removal trigger the existing model's observer. External push sends are deferred
until transaction commit. Failed transactions cannot send premature alerts.
Push delivery itself remains best effort through the existing Expo push channel;
database notifications remain available if the push service is unavailable.

Client queue/trip/request mutations reject overlapping submissions. A network
failure, server error, or incomplete acknowledgment marks the outcome uncertain.
Before another mutation is sent, the client must successfully reload server state.
No client-side optimistic result is presented as a successful queue action.

API additions:

- `GET /api/manager/reports/daily?date=YYYY-MM-DD`
- `GET /api/manager/issues?page=1`
- `POST /api/manager/issues/{issue}/decision`
- `GET /api/driver/issues?page=1`
- `POST /api/driver/issues`

The existing driver dashboard and trip summary add `today_completed_trips`.
Queue snapshots add `drivers_ahead` and `refreshed_at`.

## Setup and deployment

The local MySQL migrations are applied. For another environment, deploy the
backend changes and run these migrations before installing the updated client:

```powershell
php artisan migrate --path=database/migrations/2026_11_08_000001_add_queue_removal_audit.php --path=database/migrations/2026_11_08_000002_add_mobile_operations.php --force
```

`backend-updates` preserves the backend implementation and tests. Its `apply.cjs`
checks hashes before writing to the sibling Laravel project and refuses to
overwrite unrecognized concurrent changes. `baseline.json` and `applied.json`
support those checks. This is a review/apply artifact, not a second running backend.
Do not rerun the older `backend-changes/apply.cjs` over the updated implementation.

The client adds the SDK-compatible `expo-network` module. **Build a fresh APK**
after these changes; an old installed binary does not contain the new native
module. Existing API URL, authentication, Firebase credentials, device push-token
registration, and notification permissions still apply. No APK was built or
published as part of this task.

The required [Expo v57 docs](https://docs.expo.dev/versions/v57.0.0/) were read
before code changes. The existing project is configured for SDK 58; its SDK and
React Native versions were preserved.

## Verification

- Full Laravel suite: **112 tests, 858 assertions**, passed. A subsequent added
  push-rollback assertion passed in the affected suite (**7 tests, 84 assertions**).
- Mobile unit tests: **82 tests** across 11 suites, passed.
- Web component tests: **3 tests**, passed. These check report order and role
  visibility, Driver Settings → existing Change Password routing, and manager
  request options/pending counts.
- Targeted lint for changed client files passed.
- Expo web export passed for **26 routes**, at `.expo/mobile-operations-preview`.
- Android JavaScript export passed with `--no-bytecode`, at
  `.expo/mobile-operations-android-js`. This was a diagnostic bundle check;
  bytecode remains enabled in the app configuration.
- The normal Android export could not complete locally: after resolving the
  initial execution permission issue, the Windows Hermes compiler crashed with
  exit code `3765269347`. A successful APK/Hermes build is still required; the
  JavaScript export does not substitute for that check.
- Repository-wide TypeScript still reports the existing color-scheme/ref typing
  problems in `app-tabs.tsx`, `app-tabs.web.tsx`, and `use-theme.ts`.
- Repository-wide lint still reports the existing synchronous effect update in
  `use-color-scheme.web.ts` and unused `colors` warning in `loading-state.tsx`.

Tests cover Philippine midnight boundaries, completion-time counts, FIFO advance,
once-per-entry alerts, rollback, uncertain client retries, report totals and
historical organization snapshots, duplicate requests, stale approvals, decision
validation, owner/TODA/role restrictions, and navigation destinations.

The first broad check attempt exhausted Windows virtual memory while Metro was
running. That preview was stopped; PHPUnit was run directly with Xdebug disabled
and Node checks used a bounded heap. The successful results above are from those
subsequent checks. On a phone, still verify airplane-mode recovery, foreground and
cold-start notification taps, OTP delivery, and the full manager/driver workflow.
