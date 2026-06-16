param (
    [switch]$Debug,
    [switch]$Release = $true
)

if ($Debug) {
    $Release = $false
}

Write-Host "Bereite den Android-Build vor..." -ForegroundColor Cyan

if (Test-Path "node_modules") {
    Remove-Item -Recurse -Force node_modules
}

npm install --legacy-peer-deps

$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
Write-Host "Nutze Java JDK von Android Studio: $env:JAVA_HOME" -ForegroundColor Yellow

Set-Location "android"

if ($Release -eq $true) {
    Write-Host "Erstelle Release APK..." -ForegroundColor Green
    .\gradlew assembleRelease
    $apkPath = "app\build\outputs\apk\release\app-release.apk"
} else {
    Write-Host "Erstelle Debug APK..." -ForegroundColor Green
    .\gradlew assembleDebug
    $apkPath = "app\build\outputs\apk\debug\app-debug.apk"
}

Set-Location ".."

Write-Host "Build abgeschlossen!" -ForegroundColor Green
Write-Host "Die APK liegt hier: android\$apkPath" -ForegroundColor Cyan
