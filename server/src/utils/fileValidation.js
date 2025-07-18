const MAX_SIGNATURE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED_SIGNATURE_TYPES = ['image/png', 'image/jpeg', 'image/jpg'];

function validateSignatureFile(file, mimeType) {
    console.log('validateSignatureFile: Received file buffer length:', file.length);
    console.log('validateSignatureFile: Received MIME type:', mimeType);

    // Check file size
    if (file.length > MAX_SIGNATURE_SIZE_BYTES) {
        throw new Error('Signature file size exceeds 5MB limit');
    }

    // Check file type
    if (!ALLOWED_SIGNATURE_TYPES.includes(mimeType)) {
        throw new Error('Invalid signature file type. Only PNG and JPEG formats are allowed');
    }

    // Check if file is actually an image
    try {
        // Check magic numbers for PNG or JPEG
        const header = file.slice(0, 4).toString('hex');
        console.log('validateSignatureFile: Extracted file header (first 4 bytes hex):', header);

        // Debugging: Explicitly log the evaluation of the condition
        const isPngHeader = header.startsWith('89504e47');
        const isJpegHeader = header.startsWith('ffd8');
        console.log(`validateSignatureFile: isPngHeader: ${isPngHeader}, isJpegHeader: ${isJpegHeader}`);

        if (!isPngHeader && !isJpegHeader) {
            throw new Error('Invalid image format detected by header check');
        }
        console.log('validateSignatureFile: Header check passed.'); // This should appear if it's a PNG/JPEG
    } catch (error) {
        console.error('validateSignatureFile: Unexpected error in header check:', error);
        throw new Error('Failed to validate signature file due to unexpected error');
    }
    console.log('validateSignatureFile: All validations passed.'); // This should appear at the very end if no errors
}

module.exports = { validateSignatureFile }; 