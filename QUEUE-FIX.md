# QR scan and live queue fix

## Root cause

The confirmed Laravel backend is `C:\Users\Andrie\Desktop\webappreviveeeee`.
The earlier update targeted a different repository, `ScanTrack_W`; the queue
fix has now been adapted to this backend's own controllers and services.

- `QrScanService` recorded terminal attendance without writing to the existing
  organization queue. Repeated scans could toggle attendance to EXIT.
- `DriverApiController::dashboard` returned no queue data. The mobile UI tried
  to reconstruct a position from attendance records, including matching names
  and log IDs, which cannot identify the current FIFO queue reliably.
- Trip creation and completion never changed queue entries.
- The existing Manager QR scan controller had no registered `/manager/qr/scan`
  API route, so mobile Manager scans could not reach it.
- The scanner accepted HTTP 422 responses and treated an omitted `success`
  field as success. Dashboard requests could finish out of order.

## Behavior

Manager scans default to **Join queue**. A valid scan creates QR ENTRY attendance
and one WAITING queue entry in the same database transaction. Organization and
driver locks serialize scans with manual queue additions and trip changes.
Repeated joins are rejected while the driver has an active queue entry or trip.
The scanner confirms joining only when the server returns success, driver ID,
persisted queue entry ID, WAITING status, and current position.

**Record exit** preserves terminal checkout as an explicit action. It cancels a
waiting entry and advances remaining positions. A serving driver must complete
the trip before exiting. Existing Admin attendance scans keep their original
entry/exit behavior and cooldown.

Driver dashboard data includes the current queue snapshot. Position is a rank
among WAITING entries ordered by queue number and ID. Position 1 displays
**Next in Line**, other waiting positions display **Waiting**, and SERVING
displays **On Trip**. Starting a trip requires the driver's turn (or an existing
manager-called SERVING entry) and moves their entry to SERVING. Completion
marks it COMPLETED. Drivers rejoin only through another explicit join scan.

Manager driver records expose queue status and position from the same table.
Both dashboards poll every five seconds while focused, refresh on app resume,
and react immediately to local scan/trip events. Other devices update on their
next poll. Slow refreshes are serialized and old API responses cannot overwrite
newer responses. Network failures leave registration unconfirmed.

The missing `/manager/qr/scan` route now registers the existing controller.
No duplicate queue endpoints, database tables, or migrations were introduced.
Existing queue migrations must already be installed. Tests use an isolated application
copy and in-memory SQLite, leaving existing database records untouched.

## Files

Mobile:

- `src/app/(tabs)/index.tsx`: current queue display; removes attendance ranking.
- `src/app/admin/scan.tsx`: join/exit actions, strict confirmation, failure messages.
- `src/app/admin/dashboard.tsx`: refreshes and displays current queue positions.
- `src/app/admin/driver-registration.tsx`: shares queue refresh behavior.
- `src/services/api.ts`: existing scan request action and queue change events.
- `src/services/queueUpdates.ts`: local invalidation events; no queue data cache.
- `src/hooks/use-queue-refresh.ts` and tests: polling, foreground refresh, cleanup.
- `src/utils/driverQueue.ts` and tests: server state parsing and scan validation.
- `src/utils/managerDrivers.ts`: retains queue position in Manager records.
- `src/components/page.tsx`: prevents out-of-order API responses.
- `README.md`, `QUEUE-FIX.md`: API contract and validation notes.

Laravel (`webappreviveeeee`):

- `app/Http/Requests/QrScanRequest.php`: validates optional join/exit action.
- `routes/api.php`: registers the missing authenticated Manager scan route.
- `app/Services/QrScanService.php`: atomic scan/queue registration, duplicate guards.
- `app/Services/DriverQueueService.php`: current queue snapshot.
- `app/Http/Controllers/Api/DriverApiController.php`: dashboard and trip transitions.
- `app/Http/Controllers/Api/ManagerApiController.php`: queue fields and safe completion.
- `tests/Feature/DriverTripsTest.php`: fixture includes the required queue entry.
- `tests/Feature/MobileQueueWorkflowTest.php`: multi-driver workflow and access checks.

## Validation

- Mobile Jest: **72 tests passed**, including queue parsing, strict scan responses,
  duplicate counting, foreground refresh, polling cleanup, and slow requests.
- Changed TypeScript files: ESLint passed.
- Expo web static export passed.
- Laravel queue/trip/QR tests: **18 tests, 167 assertions passed**.
- Full Laravel suite in the confirmed backend: **95 tests, 674 assertions passed**.
- TypeScript checking still reports pre-existing errors in `app-tabs.tsx`,
  `app-tabs.web.tsx`, and `use-theme.ts`; no changed-file errors were reported.
- Physical camera scanning, multi-device latency, and MySQL concurrent-load
  testing require a running app/device environment and remain unverified.
