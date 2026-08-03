import AppKit

if #available(macOS 13.0, *) {
    let app = NSApplication.shared
    let delegate = AppDelegate()
    app.delegate = delegate
    app.setActivationPolicy(.accessory) // Hides from Dock, lives purely in Menu Bar!
    app.run()
} else {
    print("DemonionRecorder requires macOS 13.0 or higher for ScreenCaptureKit.")
}
