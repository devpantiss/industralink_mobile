# IndustriaLink Mobile App 📱

The official native mobile application for **IndustriaLink** — India's premier blue-collar industrial recruitment platform.

Built with **Expo React Native (SDK 58+, React Native 0.88+ with New Architecture & Hermes)** and **React Navigation v7**.

---

## 🚀 Quick Start Guide

### 1. Install Dependencies
```bash
cd industrialink-mobile
npm install
```

### 2. Start the Development Server
```bash
npx expo start
```
- Press `i` to launch in the iOS Simulator.
- Press `a` to launch in the Android Emulator.
- Scan the QR code with **Expo Go** on your physical phone.

### 3. Run Static Type Checking
```bash
npm run typecheck # or: npx tsc --noEmit
```

---

## 🎨 "Cobalt" Mobile Design System

- **Primary Action**: Cobalt Blue (`#2454E6` in light mode, `#3D6AF5` in dark mode)
- **Brand Accent**: Safety Industrial Yellow (`#F2B418`)
- **Theme Support**: Seamless toggling between **Light Mode** (Off-white `#F4F5F7` canvas) and **Cobalt Night** (`#11131A` canvas with elevated surfaces)
- **High-Visibility Pastel Fact Tiles**:
  - Green (`#DDF3E4`): Salary ranges (`₹24k–28k/mo`)
  - Blue (`#DDEBF8`): Shift patterns (`Day Shift`, `Night Shift`, `Rotational`)
  - Orange (`#FCE7D3`): Experience bands (`2+ yrs exp`)
  - Rose (`#FCE5EB`): Overtime pay (`Overtime Pay`)
  - Yellow (`#FFF2DC`): Urgent openings count
- **Symmetrical 4pt / 8pt Grid**:
  - Screen horizontal gutter: `16pt`
  - Card-to-card gap: `12pt`
  - Card radius: `16pt`
  - Minimum touch target: `48×48 pt` for ease of use by industrial workers.

---

## 🧭 Navigation Hierarchy (React Navigation v7)

- **Worker**: 5-Tab Native Bottom Tabs (`Home`, `FindJobs`, `Applications`, `SavedJobs`, `Profile`) + Stack for `JobDetail`.
- **Employer**: Hybrid Drawer Navigation + 4-Tab Bottom Navigation (`Dashboard`, `My Jobs`, `Candidates`, `Find Workers`) + 4-step `PostJobWizard` modal.
- **Admin**: Drawer Navigation (`VerificationsQueue`, `UserAccounts`, `Settings`).
- **Auth**: Native Stack (`LoginScreen`, `OtpVerifyScreen`, `SignupScreen`, `WorkerWelcome`, `EmployerWelcome`).

> **💡 Quick Role Switcher**: Tap the role badge (`WORKER` / `EMPLOYER` / `ADMIN`) in the top navigation bar at any time to instantly switch between portals during development!

---

## 🌐 Vernacular Multi-Language (i18n)

Supports instant switching between:
- **English (`en`)**
- **हिंदी (Hindi) (`hi`)**
- **ଓଡ଼ିଆ (Odia) (`or`)**

Switch languages anytime in **Settings > Regional Language**.

---

## 📦 Building Standalone Binaries (EAS Build)

### Direct Android APK (for test installation on physical phones)
```bash
eas build --platform android --profile preview
```

### Production App Store & Play Store
```bash
eas build --platform all --profile production
```

