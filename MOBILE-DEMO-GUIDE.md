# Tap Track Mobile Demo Guide

## Demo purpose

Tap Track's mobile app supports two account types:

- **Driver** — checks duty and attendance information, presents a personal QR code, views TODA events, and records trips.
- **Manager** — monitors drivers in the assigned TODA, scans driver QR codes, reviews scan history, creates driver accounts, and manages events and trip destinations.

The mobile app sends authenticated requests to the Laravel API. Operational records such as attendance scans and trips are saved and validated by the backend, not stored as a device-only transaction history.

## Suggested demo setup

- Have a working Laravel API and test Manager and Driver accounts ready.
- Have at least one active driver with an active QR code, assigned to the Manager's TODA.
- Configure at least one active trip destination and, optionally, a TODA event.
- For the QR flow, use two devices (or a device and a second display): one to show the Driver QR code and one logged in as Manager to scan it.
- Make sure the phone and API host can reach each other. The driver app communicates with Laravel; it does not connect directly to the database.

## Suggested walkthrough

### 1. Sign in

1. Open the login screen and choose **Driver** or **Manager**.
2. Sign in with the matching account.
3. Show that the app opens the appropriate portal. Driver accounts and Manager accounts have separate screens and access.

Public mobile registration does not create a driver account. A driver contacts their TODA Manager, who creates the account.

### 2. Manager overview

1. Sign in as Manager and open **Dashboard**.
2. Point out the assigned TODA, driver counts, driver duty status, recent activity, event schedule, and trip destinations.
3. Show the dashboard refresh behavior: dashboard summary refreshes every 15 seconds while the screen is focused; events and destinations refresh periodically.

The dashboard values depend on the Laravel API response. If the Manager dashboard endpoint is not configured or the API does not return the expected values, live counts may not appear.

### 3. Add a driver (optional)

1. Open **Add Driver**.
2. Enter the driver's first and last name, email, contact number, license number and expiration date, plate number, vehicle type, and address, then create the account.
3. Explain that the backend assigns the driver to the authenticated Manager's TODA and generates/delivers the temporary password.
4. Show the driver list and, if returned by the API, the one-time temporary password confirmation.

### 4. Record an attendance transaction

1. Sign in as Driver on the second device and open **My QR Code** or the QR code in **Profile**.
2. As Manager, open **QR Scan**, grant camera permission if requested, and scan the Driver's code.
3. Show the result: success or failure, driver/vehicle details when provided, transaction type, and time.
4. Open **History** or the dashboard's recent activity to show the recorded scan.
5. Return to the Driver app and show the updated attendance entry/exit details.

The Manager app submits the scanned QR identifier to the API. The API validates the driver and determines whether the scan is recorded as entry or exit. Invalid, inactive, duplicate, unauthorized, and wrong-organization scans can be rejected. The app displays the server's result; it does not independently create an attendance transaction.

### 5. Review driver attendance and schedule

- **Attendance** has Daily, Monthly, and Summary views. Daily view includes a date selector, entry/exit times, and attendance history; other views show attendance and work-hour summaries.
- **Schedule** shows events for a selected date and upcoming TODA events, including event time, location, and description.

### 6. Record a trip

1. In the Driver app, open **Trips**.
2. Choose an active destination configured by the Manager and enter a passenger count of at least one.
3. Tap **Start Trip** and show the active trip card and trip summary.
4. Tap **Complete Trip** and confirm. Show the updated trip record, including its arrival time when returned by the API.
5. Switch between **Today's Trips** and **Trip History**.

The API records both trip actions. Only one trip can be in progress for a driver at a time. Trip information refreshes every 10 seconds while the Trips screen is open.

### 7. Profile and account options

- Drivers can view their assigned TODA, vehicle, QR status, and account status; edit profile details; update their profile picture; change their password; and change on-duty/off-duty status.
- Managers can edit profile details and picture, change their password, and log out.
- Both roles have a password recovery flow. Driver QR status and account creation are managed through the backend.

## Mobile functions at a glance

| Area | Driver | Manager |
|---|---|---|
| Home/Dashboard | Attendance status, today's entry/exit, queue position and trip summary, QR shortcut | TODA summary counts, driver duty status, recent activity, event and destination management |
| Attendance | Daily records, monthly view, attendance summary | Records attendance by scanning driver QR codes; reviews scan activity |
| QR | Displays active personal QR code | Scans QR codes and displays the API's transaction result |
| Trips | Starts/completes trips; views today's trips, trip history, and summary | Configures active destinations drivers can select |
| Schedule | Views events by date and upcoming events | Creates, edits, and deletes TODA events |
| Driver accounts | Uses account created by Manager | Creates and views driver accounts for assigned TODA |
| Profile | Edits contact details and picture; changes duty status and password | Edits contact details and picture; changes password |

## Transaction summary

| Transaction | Started from | What is recorded |
|---|---|---|
| Attendance entry/exit | Manager **QR Scan** | QR identifier is sent to the API; the API validates the scan and returns the transaction type and time. Successful scans appear in attendance/activity history. |
| Trip start | Driver **Trips** | Selected destination and passenger count are submitted; the backend creates an active trip and departure time. |
| Trip completion | Driver active trip card | The backend marks the active trip complete and records the arrival time. |
| Driver account creation | Manager **Add Driver** | Driver details are submitted; the backend creates the account, applies TODA assignment and permissions, and generates/delivers a temporary password. |
| TODA event changes | Manager Dashboard | Add, edit, or delete operations update the schedule shown to drivers. |
| Trip destination changes | Manager Dashboard | Adding a destination makes it available for new trips; deactivation removes it from new trip choices while keeping existing trip records. |

## Presenter notes

- Keep the demo focused on one clear story: **Manager scans a Driver QR code, the attendance transaction is confirmed, and both roles can review the result**. Follow with a trip start/completion if time allows.
- Use test accounts and test data. Do not display real credentials or temporary passwords to an audience.
- QR scanning requires camera permission and a working camera. Torch use depends on device support.
- The app depends on Laravel routes and API data for authentication, authorization, attendance, trips, drivers, events, and destinations. Backend setup or missing data can affect what appears in the demo.
