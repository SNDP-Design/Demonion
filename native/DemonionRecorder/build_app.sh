#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_NAME="DemonionRecorder"
BUILD_DIR="${SCRIPT_DIR}/build"
APP_BUNDLE="${BUILD_DIR}/${APP_NAME}.app"
CONTENTS_DIR="${APP_BUNDLE}/Contents"
MACOS_DIR="${CONTENTS_DIR}/MacOS"
RESOURCES_DIR="${CONTENTS_DIR}/Resources"

echo "🔨 Building native macOS Menu Bar App: ${APP_NAME}..."

mkdir -p "${MACOS_DIR}" "${RESOURCES_DIR}"

# Compile Swift sources with ScreenCaptureKit and AVFoundation frameworks
swiftc \
  -O \
  -target arm64-apple-macosx13.0 \
  -sdk "$(xcrun --show-sdk-path)" \
  -framework ScreenCaptureKit \
  -framework AVFoundation \
  -framework AppKit \
  -framework UserNotifications \
  "${SCRIPT_DIR}/Sources/ScreenRecorder.swift" \
  "${SCRIPT_DIR}/Sources/AppDelegate.swift" \
  "${SCRIPT_DIR}/Sources/main.swift" \
  -o "${MACOS_DIR}/${APP_NAME}"

# Generate Info.plist
cat <<EOF > "${CONTENTS_DIR}/Info.plist"
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleExecutable</key>
    <string>${APP_NAME}</string>
    <key>CFBundleIdentifier</key>
    <string>com.demonion.recorder</string>
    <key>CFBundleName</key>
    <string>${APP_NAME}</string>
    <key>CFBundlePackageType</key>
    <string>APPL</string>
    <key>CFBundleShortVersionString</key>
    <string>1.0.0</string>
    <key>LSMinimumSystemVersion</key>
    <string>13.0</string>
    <key>LSUIElement</key>
    <true/>
    <key>NSScreenCaptureUsageDescription</key>
    <string>Demonion Recorder requires screen recording access to capture high quality 60 FPS video without lag.</string>
    <key>NSMicrophoneUsageDescription</key>
    <string>Demonion Recorder requires microphone access to capture voice narration.</string>
</dict>
</plist>
EOF

chmod +x "${MACOS_DIR}/${APP_NAME}"
echo "✅ Build completed successfully!"
echo "🚀 App location: ${APP_BUNDLE}"
