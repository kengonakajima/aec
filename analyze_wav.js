const fs = require('fs');
const wav = require('wav');

function analyzeWav(filename) {
    console.log(`Analyzing: ${filename}`);
    
    // Get file size
    const stats = fs.statSync(filename);
    console.log(`File size: ${(stats.size / 1024).toFixed(2)} KB`);
    
    // Create WAV reader
    const file = fs.createReadStream(filename);
    const reader = new wav.Reader();
    
    reader.on('format', function(format) {
        console.log('\n=== WAV Format Information ===');
        console.log(`Audio Format: ${format.audioFormat} (1=PCM)`);
        console.log(`Channels: ${format.channels}`);
        console.log(`Sample Rate: ${format.sampleRate} Hz`);
        console.log(`Byte Rate: ${format.byteRate} bytes/sec`);
        console.log(`Block Align: ${format.blockAlign} bytes`);
        console.log(`Bits per Sample: ${format.bitDepth}`);
        
        // Calculate duration
        const totalBytes = stats.size - 44; // WAV header is typically 44 bytes
        const duration = totalBytes / format.byteRate;
        const totalSamples = totalBytes / (format.bitDepth / 8) / format.channels;
        
        console.log(`\n=== Calculated Properties ===`);
        console.log(`Duration: ${duration.toFixed(2)} seconds`);
        console.log(`Total samples: ${totalSamples}`);
        console.log(`Samples per channel: ${Math.floor(totalSamples / format.channels)}`);
        
        // Store format info for later use
        global.wavFormat = format;
        global.wavDuration = duration;
        global.wavSamples = totalSamples;
    });
    
    reader.on('end', function() {
        console.log('\n=== Analysis Complete ===');
    });
    
    file.pipe(reader);
}

// Analyze the counting48k.wav file
analyzeWav('counting48k.wav');