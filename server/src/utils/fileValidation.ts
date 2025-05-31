import { FileValidationError } from '../types/errors';

const MAX_SIGNATURE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED_SIGNATURE_TYPES = ['image/png', 'image/jpeg', 'image/jpg'];

export function validateSignatureFile(file: Buffer, mimeType: string): void {
    // Check file size
    if (file.length > MAX_SIGNATURE_SIZE_BYTES) {
        throw new FileValidationError('Signature file size exceeds 5MB limit');
    }

    // Check file type
    if (!ALLOWED_SIGNATURE_TYPES.includes(mimeType)) {
        throw new FileValidationError('Invalid signature file type. Only PNG and JPEG formats are allowed');
    }

    // Check if file is actually an image
    try {
        // Check magic numbers for PNG or JPEG
        const header = file.slice(0, 4).toString('hex');
        if (!header.startsWith('89504e47') && // PNG
            !header.startsWith('ffd8')) {     // JPEG
            throw new FileValidationError('Invalid image file format');
        }
    } catch (error) {
        if (error instanceof FileValidationError) throw error;
        throw new FileValidationError('Failed to validate signature file');
    }
} 