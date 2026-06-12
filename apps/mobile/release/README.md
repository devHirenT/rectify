# Shikaku Master — Android release

**`shikaku-master-1.0.0.apk`** — signed release build (universal APK, all ABIs).

| | |
|---|---|
| Package | `com.shikaku.master` |
| Version | 1.0.0 (versionCode 1) |
| Min SDK | 23 (Android 6.0) |
| Target SDK | 34 (Android 14) |
| Size | ~67 MB (universal — every CPU ABI bundled) |
| Signing | release keystore, `CN=Shikaku Master` (self-signed) |

## Install (sideload)
```bash
adb install apps/mobile/release/shikaku-master-1.0.0.apk
```
Or copy the `.apk` to a device and open it (enable "Install unknown apps" for your file manager).

## Rebuild from source
```bash
cd apps/mobile
ANDROID_HOME=$HOME/Library/Android/sdk npx expo prebuild --platform android --clean
cd android && ./gradlew assembleRelease
# output: android/app/build/outputs/apk/release/app-release.apk
```
Requires: JDK 17, Android SDK platform 34 + build-tools 34.0.0, NDK 26.1.x.

## Notes / production hardening
- This is signed with a **sample keystore** (`android/app/shikaku-release.keystore`,
  store/key password `shikaku123`) committed only for convenience — **generate and
  secure your own keystore before a real Play Store release**, and keep it out of git.
- For the Play Store, ship an **AAB** with ABI splits (`./gradlew bundleRelease`) to
  cut the ~67 MB universal APK down to per-device downloads.
- The app uses MMKV, expo-av, expo-haptics (native modules) — it must run on a
  dev/standalone build (this APK), not Expo Go.
