const fs = require('fs');
const wav = require('wav');
const Speaker = require('speaker');
const record = require('node-record-lpcm16');

class PlaybackRecorder {
    constructor() {
        this.isRecording = false;
        this.recordingData = [];
        this.recorder = null;
        this.playbackStartTime = null;
        this.recordingStartTime = null;
    }

    async playAndRecord(inputFile, outputFile, delayMs = 0, silenceDurationMs = 1000) {
        console.log(`Starting playback and recording...`);
        console.log(`Input: ${inputFile} -> Output: ${outputFile}`);
        console.log(`Recording delay: ${delayMs}ms`);
        console.log(`Initial silence duration: ${silenceDurationMs}ms`);

        return new Promise((resolve, reject) => {
            try {
                // Setup playback
                const playbackStream = fs.createReadStream(inputFile);
                const wavReader = new wav.Reader();
                let speaker = null;
                
                wavReader.on('format', (format) => {
                    console.log('Playback format:', format);
                    
                    // Create speaker with same format as input
                    speaker = new Speaker({
                        channels: format.channels,
                        bitDepth: format.bitDepth,
                        sampleRate: format.sampleRate
                    });
                    
                    // Setup recording with same format
                    this.setupRecording(format, outputFile);
                    
                    // Start recording with a small delay to avoid initialization noise
                    setTimeout(() => {
                        this.startRecording();
                    }, 300); // 300ms delay to let audio system stabilize
                    
                    // Play silence first, then the actual audio
                    this.playWithSilence(wavReader, speaker, format, silenceDurationMs);
                    this.playbackStartTime = Date.now();
                });

                wavReader.on('end', () => {
                    console.log('Playback finished');
                    
                    // Stop recording after a short delay to capture any echo
                    setTimeout(() => {
                        this.stopRecording();
                        console.log('Recording finished');
                        resolve();
                    }, 1000); // 1 second additional recording
                });

                wavReader.on('error', (err) => {
                    console.error('Playback error:', err);
                    reject(err);
                });

                // Start the pipeline
                playbackStream.pipe(wavReader);

            } catch (error) {
                console.error('Setup error:', error);
                reject(error);
            }
        });
    }

    setupRecording(format, outputFile) {
        // Create WAV writer with the same format as input
        this.wavWriter = new wav.Writer({
            channels: format.channels,
            sampleRate: format.sampleRate,
            bitDepth: format.bitDepth
        });
        
        this.outputStream = fs.createWriteStream(outputFile);
        this.wavWriter.pipe(this.outputStream);
        
        // Setup recorder
        this.recorder = record.record({
            sampleRate: format.sampleRate,
            channels: format.channels,
            bitDepth: format.bitDepth,
            audioType: 'wav',
            silence: '0.0',  // Don't stop on silence
            thresholdStart: 0.0,
            thresholdEnd: 0.0
        });

        console.log('Recording setup complete');
    }

    startRecording() {
        if (!this.recorder) {
            console.error('Recorder not initialized');
            return;
        }

        console.log('Starting recording...');
        this.isRecording = true;
        this.recordingStartTime = Date.now();
        
        // Pipe recorder to WAV writer
        this.recorder.stream().pipe(this.wavWriter, { end: false });
    }

    stopRecording() {
        if (!this.isRecording) {
            return;
        }

        console.log('Stopping recording...');
        this.isRecording = false;
        
        if (this.recorder) {
            this.recorder.stop();
        }
        
        if (this.wavWriter) {
            this.wavWriter.end();
        }
        
        if (this.outputStream) {
            this.outputStream.end();
        }

        const recordingDuration = Date.now() - this.recordingStartTime;
        console.log(`Recording duration: ${recordingDuration}ms`);
    }

    playWithSilence(wavReader, speaker, format, silenceDurationMs) {
        console.log(`Playing ${silenceDurationMs}ms of silence first...`);
        
        // Calculate silence buffer size
        const silenceSamples = Math.floor((format.sampleRate * silenceDurationMs) / 1000);
        const silenceBytes = silenceSamples * format.channels * (format.bitDepth / 8);
        const silenceBuffer = Buffer.alloc(silenceBytes, 0); // All zeros = silence
        
        // Write silence to speaker
        speaker.write(silenceBuffer);
        
        // After silence, play the actual audio
        setTimeout(() => {
            console.log('Starting actual audio playback...');
            wavReader.pipe(speaker);
        }, silenceDurationMs);
    }
}

// Test function
async function testPlaybackRecording() {
    const recorder = new PlaybackRecorder();
    
    try {
        // Use 2 second silence to ensure recording captures everything and avoid initial noise
        await recorder.playAndRecord('counting48k.wav', 'counting48krec.wav', 0, 2000);
        console.log('Test completed successfully!');
        
        // Analyze the recorded file
        console.log('\n=== Analyzing recorded file ===');
        setTimeout(() => {
            const analyzeScript = require('./analyze_wav');
            // The analyze script will run automatically
        }, 1000);
        
    } catch (error) {
        console.error('Test failed:', error);
    }
}

// Export for use in other modules
module.exports = PlaybackRecorder;

// Run test if this file is executed directly
if (require.main === module) {
    testPlaybackRecording();
}