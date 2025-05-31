export class FileValidationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'FileValidationError';
    }
}

export class ContractError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'ContractError';
    }
}

export class StorageError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'StorageError';
    }
}

export function handleError(error: unknown): { status: number; message: string } {
    if (error instanceof FileValidationError) {
        return { status: 400, message: error.message };
    }
    if (error instanceof ContractError) {
        return { status: 400, message: error.message };
    }
    if (error instanceof StorageError) {
        return { status: 500, message: error.message };
    }
    if (error instanceof Error) {
        return { status: 500, message: error.message };
    }
    return { status: 500, message: 'An unexpected error occurred' };
} 