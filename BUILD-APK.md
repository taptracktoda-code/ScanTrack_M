# Build and share ScanTrack.apk

The installed app name is **ScanTrack**. The existing Android application ID is
`com.dingsss.TapTrackDriverApp`, and the existing Expo slug and project ID stay the
same. The `preview` profile creates a standalone, signed APK for direct installation;
`production` keeps its existing behavior.

EAS hosts the APK at its own artifact URL. A cloud build has no supported `eas.json`
setting for choosing the browser download filename. The script below downloads the
completed build as **artifacts/ScanTrack.apk**. It does not change the hosted EAS URL.

Run these commands in PowerShell:

```powershell
Set-Location 'C:\Users\Andrie\Desktop\mobileqrbasedapp'
npx.cmd eas-cli@latest login
$scanTrackBuildJson = npx.cmd eas-cli@latest build --platform android --profile preview --wait --non-interactive --json
if ($LASTEXITCODE -ne 0) { throw 'EAS build failed. Check the build logs before downloading.' }
$scanTrackBuild = @((($scanTrackBuildJson -join "`n") | ConvertFrom-Json))[0]
if ($scanTrackBuild.status -ne 'FINISHED') { throw 'The APK build has not finished successfully.' }
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\download-apk.ps1 -BuildId $scanTrackBuild.id
```

The build command uses your existing EAS API environment and Android signing
credentials. Keep the configured `EXPO_PUBLIC_API_URL` and Firebase configuration.
The existing app config requires `google-services.json` locally or the EAS file
environment variable `GOOGLE_SERVICES_JSON`. If EAS needs first-time credential
setup, run the build interactively instead:

```powershell
npx.cmd eas-cli@latest build --platform android --profile preview --wait
```

Then use the completed build ID printed by EAS:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\download-apk.ps1 -BuildId 'PASTE-FINISHED-BUILD-ID-HERE'
```

The downloader checks the project ID, Android platform, preview profile, completed
status, HTTPS artifact link, and APK archive contents before saving the file.
Add `-Force` to replace an existing `artifacts/ScanTrack.apk`; otherwise it preserves
the previous file. You can also choose a directory with `-OutputDirectory`.

Share the resulting **ScanTrack.apk** file or upload it to your own download host.
Uploading it under that name can give you a URL such as
`https://yourdomain.com/downloads/ScanTrack.apk`. EAS artifact URLs keep their own
names. Renaming the local APK does not modify its signature or application ID.

Local checks:

```powershell
npx.cmd expo config --type public
npx.cmd expo install --check
npx.cmd expo export --platform android --output-dir .\dist\android-check
```

The export checks Metro's release bundle and assets. A successful EAS build is
still needed to verify the complete native compilation, signing, and installation.
The ignored `android/` directory is generated locally; its app label is synchronized
to ScanTrack, while EAS prebuilds from the tracked Expo configuration.

Validation on this workspace: Expo preview config introspection succeeded, Android
Metro export and Hermes compilation succeeded, and the downloader passed fixture
checks for the output filename, existing-file protection, failed builds, another
project's build, AAB rejection, and temporary-file cleanup. No signed cloud APK was
built during these checks. The online `expo install --check` reports existing newer
recommended SDK 58 package versions (including Expo, Expo Router, React Native,
and safe-area-context). Dependency upgrades were not included in this naming
change; full native EAS compilation remains to be checked when you build.

References: [APK builds](https://docs.expo.dev/build-reference/apk/),
[EAS JSON configuration](https://docs.expo.dev/eas/json/), and
[EAS CLI commands](https://docs.expo.dev/eas/cli/).
