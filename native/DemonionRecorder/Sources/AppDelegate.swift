import AppKit
import Foundation
import UserNotifications

@available(macOS 13.0, *)
class AppDelegate: NSObject, NSApplicationDelegate, UNUserNotificationCenterDelegate {
    private var statusItem: NSStatusItem!
    private var recorder: ScreenRecorder!
    private var isRecording = false
    private var menu: NSMenu!
    private var recordMenuItem: NSMenuItem!
    private var statusTitleItem: NSMenuItem!
    
    func applicationDidFinishLaunching(_ notification: Notification) {
        // Request Notification permissions
        UNUserNotificationCenter.current().delegate = self
        UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .sound]) { _, _ in }

        recorder = ScreenRecorder()
        recorder.onRecordingFinished = { [weak self] fileURL in
            self?.handleRecordingFinished(fileURL: fileURL)
        }
        recorder.onError = { [weak self] error in
            self?.handleRecordingError(error: error)
        }

        // Setup NSStatusItem in system menu bar
        statusItem = NSStatusBar.system.statusItem(withLength: NSStatusItem.variableLength)
        updateStatusIcon(recording: false)
        
        // Build Menu
        menu = NSMenu()
        
        statusTitleItem = NSMenuItem(title: "Demonion Screen Recorder", action: nil, keyEquivalent: "")
        statusTitleItem.isEnabled = false
        menu.addItem(statusTitleItem)
        
        menu.addItem(NSMenuItem.separator())
        
        recordMenuItem = NSMenuItem(title: "⏺ Start Recording", action: #selector(toggleRecording), keyEquivalent: "r")
        recordMenuItem.keyEquivalentModifierMask = [.command, .shift]
        recordMenuItem.target = self
        menu.addItem(recordMenuItem)
        
        menu.addItem(NSMenuItem.separator())
        
        let openFolderItem = NSMenuItem(title: "📁 Open Recordings Folder", action: #selector(openRecordingsFolder), keyEquivalent: "")
        openFolderItem.target = self
        menu.addItem(openFolderItem)
        
        let openWebItem = NSMenuItem(title: "🎬 Open Demonion Web Editor", action: #selector(openWebEditor), keyEquivalent: "")
        openWebItem.target = self
        menu.addItem(openWebItem)
        
        menu.addItem(NSMenuItem.separator())
        
        let quitItem = NSMenuItem(title: "Quit Demonion Recorder", action: #selector(quitApp), keyEquivalent: "q")
        quitItem.target = self
        menu.addItem(quitItem)
        
        statusItem.menu = menu
        
        // Register local/global hotkey monitor for Cmd+Shift+R
        NSEvent.addLocalMonitorForEvents(matching: .keyDown) { [weak self] event in
            if event.modifierFlags.contains([.command, .shift]) && event.charactersIgnoringModifiers == "r" {
                self?.toggleRecording()
                return nil
            }
            return event
        }
        
        print("DemonionRecorder menu bar app initialized.")
    }
    
    private func updateStatusIcon(recording: Bool) {
        if let button = statusItem.button {
            if recording {
                button.title = " 🔴 REC "
                button.contentTintColor = .systemRed
            } else {
                button.image = NSImage(systemSymbolName: "record.circle", accessibilityDescription: "Demonion Recorder")
                button.contentTintColor = nil
            }
        }
    }

    @objc private func toggleRecording() {
        if isRecording {
            isRecording = false
            recordMenuItem.title = "⏺ Start Recording"
            statusTitleItem.title = "Demonion Screen Recorder (Processing...)"
            updateStatusIcon(recording: false)
            recorder.stopRecording()
        } else {
            isRecording = true
            recordMenuItem.title = "⏹ Stop Recording"
            statusTitleItem.title = "Demonion Screen Recorder (Recording 🔴)"
            updateStatusIcon(recording: true)
            recorder.startRecording()
        }
    }

    @objc private func openRecordingsFolder() {
        let moviesDir = FileManager.default.urls(for: .moviesDirectory, in: .userDomainMask).first!.appendingPathComponent("Demonion", isDirectory: true)
        try? FileManager.default.createDirectory(at: moviesDir, withIntermediateDirectories: true)
        NSWorkspace.shared.open(moviesDir)
    }

    @objc private func openWebEditor() {
        if let url = URL(string: "http://localhost:5173") {
            NSWorkspace.shared.open(url)
        }
    }

    @objc private func quitApp() {
        if isRecording {
            recorder.stopRecording()
        }
        NSApplication.shared.terminate(nil)
    }

    private func handleRecordingFinished(fileURL: URL) {
        statusTitleItem.title = "Demonion Screen Recorder"
        
        // Post notification
        let content = UNMutableNotificationContent()
        content.title = "Screen Recording Finished! 🎬"
        content.body = "Saved 60 FPS recording to \(fileURL.lastPathComponent)"
        content.sound = .default
        
        let request = UNNotificationRequest(identifier: UUID().uuidString, content: content, trigger: nil)
        UNUserNotificationCenter.current().add(request, withCompletionHandler: nil)
        
        // Highlight in Finder
        NSWorkspace.shared.activateFileViewerSelecting([fileURL])
    }

    private func handleRecordingError(error: Error) {
        isRecording = false
        recordMenuItem.title = "⏺ Start Recording"
        statusTitleItem.title = "Demonion Screen Recorder"
        updateStatusIcon(recording: false)
        
        let alert = NSAlert()
        alert.messageText = "Recording Error"
        alert.informativeText = error.localizedDescription
        alert.alertStyle = .warning
        alert.runModal()
    }
}
