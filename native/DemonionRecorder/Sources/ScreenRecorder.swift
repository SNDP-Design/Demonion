import Foundation
import ScreenCaptureKit
import AVFoundation
import AppKit

@available(macOS 13.0, *)
class ScreenRecorder: NSObject, SCStreamOutput, SCStreamDelegate, @unchecked Sendable {
    private var stream: SCStream?
    private var assetWriter: AVAssetWriter?
    private var videoInput: AVAssetWriterInput?
    private var audioInput: AVAssetWriterInput?
    private var isRecording = false
    private var recordingURL: URL?
    private var sessionStarted = false
    private var startTime: CMTime = .zero

    var onRecordingFinished: ((URL) -> Void)?
    var onError: ((Error) -> Void)?

    func startRecording(displayIndex: Int = 0, outputDirectory: URL? = nil) {
        Task {
            do {
                let content = try await SCShareableContent.excludingDesktopWindows(false, onScreenWindowsOnly: true)
                guard !content.displays.isEmpty else {
                    throw NSError(domain: "DemonionRecorder", code: 1, userInfo: [NSLocalizedDescriptionKey: "No displays found for screen capture."])
                }
                
                let selectedDisplay = displayIndex < content.displays.count ? content.displays[displayIndex] : content.displays[0]
                let filter = SCContentFilter(display: selectedDisplay, excludingApplications: [], exceptingWindows: [])
                
                let config = SCStreamConfiguration()
                config.width = selectedDisplay.width * 2
                config.height = selectedDisplay.height * 2
                config.minimumFrameInterval = CMTime(value: 1, timescale: 60) // Smooth 60 FPS
                config.pixelFormat = kCVPixelFormatType_32BGRA
                config.capturesAudio = true
                config.excludesCurrentProcessAudio = true
                
                // Prepare file output directory (~/Movies/Demonion/)
                let saveDir = outputDirectory ?? FileManager.default.urls(for: .moviesDirectory, in: .userDomainMask).first!.appendingPathComponent("Demonion", isDirectory: true)
                try FileManager.default.createDirectory(at: saveDir, withIntermediateDirectories: true)
                
                let formatter = DateFormatter()
                formatter.dateFormat = "yyyy-MM-dd_HH-mm-ss"
                let filename = "Demonion_Recording_\(formatter.string(from: Date())).mp4"
                let fileURL = saveDir.appendingPathComponent(filename)
                self.recordingURL = fileURL
                
                // Setup AVAssetWriter with Apple Silicon VideoToolbox H.264 hardware encoder
                let writer = try AVAssetWriter(outputURL: fileURL, fileType: .mp4)
                
                let videoSettings: [String: Any] = [
                    AVVideoCodecKey: AVVideoCodecType.h264,
                    AVVideoWidthKey: config.width,
                    AVVideoHeightKey: config.height,
                    AVVideoCompressionPropertiesKey: [
                        AVVideoAverageBitRateKey: 16_000_000, // 16 Mbps high quality
                        AVVideoExpectedSourceFrameRateKey: 60,
                        AVVideoProfileLevelKey: AVVideoProfileLevelH264HighAutoLevel
                    ]
                ]
                
                let vInput = AVAssetWriterInput(mediaType: .video, outputSettings: videoSettings)
                vInput.expectsMediaDataInRealTime = true
                if writer.canAdd(vInput) {
                    writer.add(vInput)
                }
                self.videoInput = vInput
                
                // Audio settings (AAC 44.1kHz stereo)
                let audioSettings: [String: Any] = [
                    AVFormatIDKey: kAudioFormatMPEG4AAC,
                    AVNumberOfChannelsKey: 2,
                    AVSampleRateKey: 44100,
                    AVEncoderBitRateKey: 128000
                ]
                let aInput = AVAssetWriterInput(mediaType: .audio, outputSettings: audioSettings)
                aInput.expectsMediaDataInRealTime = true
                if writer.canAdd(aInput) {
                    writer.add(aInput)
                }
                self.audioInput = aInput
                
                writer.startWriting()
                self.assetWriter = writer
                self.sessionStarted = false
                
                // Setup ScreenCaptureKit SCStream
                let newStream = SCStream(filter: filter, configuration: config, delegate: self)
                try newStream.addStreamOutput(self, type: .screen, sampleHandlerQueue: DispatchQueue(label: "com.demonion.recorder.screen"))
                try newStream.addStreamOutput(self, type: .audio, sampleHandlerQueue: DispatchQueue(label: "com.demonion.recorder.audio"))
                
                try await newStream.startCapture()
                self.stream = newStream
                self.isRecording = true
                print("SCStream recording started successfully to \(fileURL.path)")
            } catch {
                print("Failed to start ScreenCaptureKit recording: \(error)")
                DispatchQueue.main.async { [weak self] in
                    self?.onError?(error)
                }
            }
        }
    }

    func stopRecording() {
        guard isRecording, let currentStream = stream else { return }
        isRecording = false
        
        Task {
            do {
                try await currentStream.stopCapture()
                self.stream = nil
                
                if let writer = self.assetWriter {
                    self.videoInput?.markAsFinished()
                    self.audioInput?.markAsFinished()
                    
                    await writer.finishWriting()
                    print("AssetWriter finished recording to \(self.recordingURL?.path ?? "")")
                    
                    if let url = self.recordingURL {
                        DispatchQueue.main.async { [weak self] in
                            self?.onRecordingFinished?(url)
                        }
                    }
                }
            } catch {
                print("Error stopping capture: \(error)")
                DispatchQueue.main.async { [weak self] in
                    self?.onError?(error)
                }
            }
        }
    }

    // MARK: - SCStreamOutput
    func stream(_ stream: SCStream, didOutputSampleBuffer sampleBuffer: CMSampleBuffer, of type: SCStreamOutputType) {
        guard isRecording, let writer = assetWriter, writer.status == .writing else { return }
        guard CMSampleBufferDataIsReady(sampleBuffer) else { return }
        
        let pts = CMSampleBufferGetPresentationTimeStamp(sampleBuffer)
        if !sessionStarted {
            writer.startSession(atSourceTime: pts)
            sessionStarted = true
            startTime = pts
        }
        
        switch type {
        case .screen:
            if let input = videoInput, input.isReadyForMoreMediaData {
                input.append(sampleBuffer)
            }
        case .audio, .microphone:
            if let input = audioInput, input.isReadyForMoreMediaData {
                input.append(sampleBuffer)
            }
        @unknown default:
            break
        }
    }
    
    func stream(_ stream: SCStream, didStopWithError error: Error) {
        print("SCStream stopped with error: \(error)")
        DispatchQueue.main.async { [weak self] in
            self?.onError?(error)
        }
    }
}
