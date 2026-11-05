# Welcome to your Expo app 👋

## Tap Track API

Set `EXPO_PUBLIC_API_URL` in `.env` to the Laravel API URL when it is hosted
on a separate machine, for example `http://192.168.1.10:8000/api`. The app adds
`/api` when the URL points to the host root and preserves it when already present.
When the value is empty during Expo development, the app uses the Expo packager's LAN
address with port `8000` automatically. The Android device and development
computer must share a network, and Laravel must listen on `0.0.0.0:8000`.
For web, point this setting at the same Laravel API used by the web portal; the
API host must be reachable from the browser and allow requests from the web
app's origin. The sample private LAN address is for local development only.
The driver app communicates only with Laravel; it never connects directly to
MySQL.

## Manager dashboard data

The manager app uses the authenticated Laravel endpoint
`/manager/dashboard` by default. Laravel must return driver and active queue
counts scoped to the signed-in manager's assigned TODA. Total drivers includes every
driver status; Active counts drivers whose status is Active. Waiting counts
`WAITING` queue entries, and On trip reflects `SERVING` entries (the backend
does not currently maintain a separate trip status). `EXPO_PUBLIC_MANAGER_DASHBOARD_ENDPOINT`
can override this endpoint if necessary. The manager screen refreshes it every
15 seconds while focused. It accepts a response
containing `summary` fields `total_drivers`, `active_drivers`, `waiting_drivers`,
`on_trip`, and optional `recent_activity`. The authenticated `/user` response
supplies the manager's TODA assignment/name (for example `toda_name` or
`toda.name`). Native mobile sessions keep the API token in Expo SecureStore.
The app uses AsyncStorage only on web, where Expo SecureStore is not available.
The Manager login accepts a Manager role returned by the configured manager
login route or shared `/login` and `/auth/login` routes; it does not assume a
role from the selected login screen. Driver and Super Admin accounts cannot
enter Manager screens.

Manager data is requested through authenticated `/manager/*` API routes and
the `/user` profile endpoint. The Laravel API must scope responses and
mutations to the Manager's assigned TODA; mobile-side filtering is not an
access control. Manager QR scans always use `/manager/qr/scan`, including when
the organization is missing from the profile, so authorization and
organization validation remain the Laravel API's responsibility. Activity
history uses `EXPO_PUBLIC_MANAGER_TRANSACTIONS_ENDPOINT` when configured and
otherwise uses the Manager dashboard's `summary.recent_activity`. Activity and
driver account lists are loaded from the backend rather than a device-wide
cache.

## Manager-created driver accounts

The Manager's **Add Driver** screen creates accounts directly with authenticated
`POST /manager/drivers` and loads the assigned organization's accounts from
`GET /manager/drivers`. The request contains first and last name, email,
contact number, license number and expiration date, plate number, vehicle type,
and address; organization assignment and permissions must be
derived and enforced by Laravel from the authenticated Manager, not supplied
by the app. The backend must create an immediately usable Driver account and
generate and securely deliver a temporary password. If the response includes
`temporary_password`, `temp_password`, or `credentials.password`, the app shows
it once in the creation confirmation; otherwise the backend must deliver it
directly to the driver's email.

The public mobile registration page no longer submits driver applications for
Super Admin verification; it directs drivers to contact their TODA Manager.
This client change does not replace Laravel authorization: account creation,
organization scoping, and temporary-password delivery must be implemented and
verified on the backend before release.
The camera uses Expo Camera's QR barcode support, which includes Google ML Kit
on Android in SDK 57. The scanner releases the camera when its tab is not
focused and provides a torch toggle on supported devices.

## Driver TODA assignment

The driver profile reads the authenticated driver's assigned TODA from
`/driver/profile` and displays it as **Assigned TODA**. The profile response may
provide `toda_name`, `toda.name`, `toda`, `organization_name`,
`organization.name`, `organization`, `association_name`, or `association.name`.
Override the profile route with
`EXPO_PUBLIC_DRIVER_PROFILE_ENDPOINT` if the Laravel API uses a different path.

## Driver trips

Drivers can start a trip by entering a destination and passenger count, then
complete it from the active trip card. The authenticated Laravel API stores each
trip and provides the driver's active trip, today's trips, history, and summary.
Only one trip can be in progress for a driver at a time. The Trips screen
refreshes its list and summary every 10 seconds while focused; this is polling,
not a push/WebSocket connection.

The API endpoints are:

- `POST /driver/trips`
- `POST /driver/trips/{trip_id}/complete`
- `GET /driver/trips/active`
- `GET /driver/trips/today`
- `GET /driver/trips/history`
- `GET /driver/trips/summary`

Apply the Laravel database migration before using these endpoints.

## Live driver and Manager notifications

The mobile app registers an Expo push token for each signed-in Driver or Manager.
The Laravel API stores notifications in the authenticated account and sends Expo
pushes for terminal QR scans, queue calls, trip updates, and Manager-created
Driver accounts. Notifications appear in the system tray while the app is
backgrounded and update the in-app list while it is open. The app keeps a
60-second foreground refresh as a fallback.

To enable delivery, deploy the matching `ScanTrack_W` backend changes and run
`php artisan migrate --force`. For Android Firebase setup:

1. In Firebase, register an Android app with package ID
   `com.dingsss.TapTrackDriverApp` and download its `google-services.json`.
2. Either place that file at the mobile project root and include it in the EAS
   build source, or configure an EAS file environment variable named
   `GOOGLE_SERVICES_JSON` containing the file. The app config reads either
   source and rejects EAS builds when the file is missing. Firebase's Android
   config contains app identifiers; the separate service-account private key
   must remain secret.
3. Configure the Firebase service-account key for FCM V1 in EAS credentials.
   This is a separate credential from `google-services.json`; keep the private
   key secret and out of source control.
4. Build and install a new APK, then allow notifications when prompted.

Android remote push notifications cannot be tested in Expo Go.

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

### Other setup steps

- To set up ESLint for linting, run `npx expo lint`, or follow our guide on ["Using ESLint and Prettier"](https://docs.expo.dev/guides/using-eslint/)
- If you'd like to set up unit testing, follow our guide on ["Unit Testing with Jest"](https://docs.expo.dev/develop/unit-testing/)
- Learn more about the TypeScript setup in this template in our guide on ["Using TypeScript"](https://docs.expo.dev/guides/typescript/)

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
