# KasirKelontong Mobile (Flutter)

Mobile POS for Indonesian small shops. Horizontal Android tablet target. Full feature parity with the React/Vite SPA at `../frontend/`.

## Stack

- Flutter ≥ 3.24, Dart ≥ 3.4
- **Riverpod** (`flutter_riverpod`) — state + DI
- **go_router** — declarative routing
- **dio** — HTTP with two auth interceptors (admin `Token` / cashier `CashierToken`)
- **flutter_secure_storage** — token storage
- **hive** — local cache (stock list)
- **mobile_scanner** — camera barcode scan
- **google_sign_in** — admin Google OAuth
- **intl** — IDR currency + date formatting
- Plain Dart data classes (no freezed in v1 — keeps the scaffold buildable without codegen)

## Bootstrap

Flutter SDK is required and not yet installed in this repo. After installing Flutter:

```bash
cd mobile
flutter create . --org com.kasirkelontong --platforms=android --project-name kasir_kelontong
flutter pub get
```

`flutter create .` adds the Android native shell (`android/`, `ios/` if you keep iOS) without touching `lib/`, `pubspec.yaml`, or this README.

## Run

Backend running locally on `:8000` (`make dev` from repo root). Android emulator host loopback is `10.0.2.2`.

```bash
flutter run -d emulator-5554 \
  --dart-define API_URL=http://10.0.2.2:8000
```

Physical tablet on the same wifi:

```bash
flutter run --dart-define API_URL=http://<host-lan-ip>:8000
```

## Android setup notes

- `minSdkVersion 21`, `targetSdkVersion 34`.
- `AndroidManifest.xml` needs `<uses-permission android:name="android.permission.INTERNET"/>` (default) and `<uses-permission android:name="android.permission.CAMERA"/>` for `mobile_scanner`.
- For Google sign-in: create an Android OAuth client id in Google Cloud, register the SHA-1 of your debug/release keystore, drop the `google-services.json` into `android/app/`, and add the Gradle plugin per `google_sign_in` README.
- Landscape lock on POS page is handled in code via `SystemChrome.setPreferredOrientations` — no manifest change needed.

## Project layout

```
lib/
  main.dart
  app/         router, theme, env
  core/        api client, interceptors, storage, money, shared widgets
  features/    landing, auth, cashier_auth, stores, products, cashiers,
               stock, sales (POS), reports
test/          unit + widget
```

Feature folders follow `data/` (API + repository) / `domain/` (models) / `application/` (Riverpod controllers + providers) / `presentation/` (pages + widgets).

## Tablet target

- Material 3, `VisualDensity.comfortable`, min hit target 56dp.
- POS page locks to landscape and uses a two-column split (search left, cart 400dp right).
- Indonesian locale (`id_ID`) is the single supported locale.

## Out of scope (v1)

- iOS / web / desktop builds.
- Offline sale queue (only stock list is cached read-only).
- Mayar payment UI.
- Push notifications.
