# Download one completed Android preview build, validate it, and name it ScanTrack.apk.
[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [guid]$BuildId,
    [string]$OutputDirectory = (Join-Path $PSScriptRoot '..\artifacts'),
    [switch]$Force
)

$ErrorActionPreference = 'Stop'
$projectRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$outputRoot = [System.IO.Path]::GetFullPath($OutputDirectory)
$destination = Join-Path $outputRoot 'ScanTrack.apk'
$temporaryFile = Join-Path $outputRoot ('ScanTrack-' + [guid]::NewGuid().ToString('N') + '.download')
if ((Test-Path -LiteralPath $destination) -and -not $Force) {
    throw "File already exists: $destination. Use -Force to replace the previous downloaded APK."
}

Push-Location -LiteralPath $projectRoot
try {
    $projectId = (Get-Content -LiteralPath (Join-Path $projectRoot 'app.json') -Raw | ConvertFrom-Json).expo.extra.eas.projectId
    $buildJson = & npx.cmd --yes eas-cli@latest build:view $BuildId.ToString() --json
    if ($LASTEXITCODE -ne 0) { throw 'Unable to read the EAS build. Check the build ID and sign in with npx.cmd eas-cli@latest login.' }
    $build = ($buildJson -join "`n") | ConvertFrom-Json
    if ($build.id -ne $BuildId.ToString() -or $build.project.id -ne $projectId) {
        throw 'The build does not belong to this Expo project.'
    }
    if ($build.platform -ne 'ANDROID' -or $build.status -ne 'FINISHED') {
        throw 'Select a finished Android build. No APK was downloaded.'
    }
    if ($build.buildProfile -ne 'preview') { throw 'Select an Android build made with the preview profile.' }
    $downloadUrl = $build.artifacts.buildUrl
    $artifactUri = $null
    if (-not [uri]::TryCreate($downloadUrl, [System.UriKind]::Absolute, [ref]$artifactUri) -or $artifactUri.Scheme -ne 'https') {
        throw 'The build has no valid HTTPS application artifact URL.'
    }

    New-Item -ItemType Directory -Path $outputRoot -Force | Out-Null
    Write-Host 'Downloading the completed preview build...'
    Invoke-WebRequest -Uri $artifactUri -OutFile $temporaryFile -UseBasicParsing
    Add-Type -AssemblyName System.IO.Compression
    Add-Type -AssemblyName System.IO.Compression.FileSystem
    $archive = [System.IO.Compression.ZipFile]::OpenRead($temporaryFile)
    try {
        if (-not $archive.GetEntry('AndroidManifest.xml') -or -not $archive.GetEntry('classes.dex')) {
            throw 'The downloaded artifact is not an installable Android APK. An AAB cannot be renamed into an APK.'
        }
    } finally { $archive.Dispose() }

    Move-Item -LiteralPath $temporaryFile -Destination $destination -Force:$Force
    Write-Host "Saved APK: $destination"
    Get-Item -LiteralPath $destination
} finally {
    if (Test-Path -LiteralPath $temporaryFile) { Remove-Item -LiteralPath $temporaryFile }
    Pop-Location
}
