const fs = require('fs');
const wav = require('wav');

function analyzeRecordedFile(filename) {
    if (!fs.existsSync(filename)) {
        console.log(`File ${filename} does not exist yet.`);
        return;
    }
    
    console.log(`\n=== Analyzing recorded file: ${filename} ===`);
    
    // Get file size
    const stats = fs.statSync(filename);
    console.log(`File size: ${(stats.size / 1024).toFixed(2)} KB`);
    
    // Create WAV reader
    const file = fs.createReadStream(filename);
    const reader = new wav.Reader();
    
    reader.on('format', function(format) {
        console.log('Recorded format:', format);
        
        // Calculate duration
        const totalBytes = stats.size - 44; // WAV header is typically 44 bytes
        const duration = totalBytes / format.byteRate;
        const totalSamples = totalBytes / (format.bitDepth / 8) / format.channels;
        
        console.log(`Duration: ${duration.toFixed(2)} seconds`);
        console.log(`Total samples: ${totalSamples}`);
        
        // Compare with original
        console.log('\n=== Comparison with original ===');
        console.log('Original (counting48k.wav): 9.66s, 463,866 samples');
        console.log(`Recorded (${filename}): ${duration.toFixed(2)}s, ${totalSamples} samples`);
        
        const ratio = totalSamples / 463866;
        console.log(`Recording ratio: ${ratio.toFixed(3)} (should be >1.0 due to additional recording time)`);
    });
    
    reader.on('end', function() {
        console.log('Analysis complete');
    });
    
    reader.on('error', function(err) {
        console.error('Analysis error:', err);
    });
    
    file.pipe(reader);
}

// Export for use in other modules
module.exports = analyzeRecordedFile;

// Run analysis if this file is executed directly
if (require.main === module) {
    const filename = process.argv[2] || 'counting48krec.wav';
    analyzeRecordedFile(filename);
}