# How to Build the Android APK

Your app is now wrapped with Capacitor and ready to be built as an Android APK.

## Quick Steps

### 1. Build the web app first
```bash
npm run build
```

### 2. Sync to Android
```bash
npx cap sync android
```

### 3. Build the APK (requires Android Studio on your computer)

**Option A: Using Android Studio**
1. Download the `android` folder from this project
2. Open it in Android Studio on your computer
3. Go to Build → Build Bundle(s) / APK(s) → Build APK(s)
4. Find your APK in `android/app/build/outputs/apk/debug/`

**Option B: Using Command Line (requires Android SDK)**
```bash
cd android
./gradlew assembleDebug
```
The APK will be at: `android/app/build/outputs/apk/debug/app-debug.apk`

## Installing the APK

1. Transfer the APK file to your Android phone
2. Open the APK file on your phone
3. Allow "Install from unknown sources" if prompted
4. Install and enjoy your app!

## For Play Store (Signed APK)

For publishing to Google Play Store, you need:
1. A signed release APK or AAB (Android App Bundle)
2. A Google Play Developer account ($25 one-time fee)
3. App icons, screenshots, and descriptions

To build a release version:
```bash
cd android
./gradlew assembleRelease
```

## App Details
- Package ID: `com.caliph.attendance`
- App Name: Caliph Attendance
