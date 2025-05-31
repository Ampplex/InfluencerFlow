# Contract Automation System Documentation

## System Overview
The Contract Automation System provides a streamlined solution for managing influencer-brand contracts without relying on third-party services like DocuSign. It offers a simple yet effective e-signature implementation with secure storage using Supabase.

## Architecture Components

### 1. Types and Interfaces
#### Contract Types (`contract.ts`)
- **ContractTemplate**: Base structure for contract data
- **Contract**: Complete contract entity with status tracking
- **ContractStatus**: Enum for contract lifecycle states
- **SignContractRequest**: Type for contract signing requests (includes mime_type validation)

#### Error Types (`errors.ts`)
- **FileValidationError**: For signature file validation issues
- **ContractError**: For contract-related business logic errors
- **StorageError**: For storage and file handling errors

### 2. Utilities
#### File Validation (`fileValidation.ts`)
- Signature file size validation (5MB limit)
- MIME type verification (PNG/JPEG only)
- Magic number checks for file integrity
- Comprehensive error handling

#### Error Handler
Centralized error handling with appropriate HTTP status codes:
- 400: Client errors (validation, invalid requests)
- 500: Server errors (storage, processing)

### 3. Controller (`contractController.ts`)
Handles all contract-related business logic:
- Contract preview generation
- Contract creation and management
- E-signature processing with validation
- Contract retrieval and listing
- Comprehensive error handling

### 4. PDF Generation (`pdfGenerator.ts`)
Provides professional PDF document creation:
- Dynamic template rendering
- Signature embedding
- Formatted sections for contract details
- Clean, professional layout

### 5. Routes (`contractRoutes.ts`)
RESTful API endpoints:
```typescript
POST /api/contracts/preview   // Preview contract without saving
POST /api/contracts/generate  // Create new contract
POST /api/contracts/sign      // Sign existing contract
GET  /api/contracts/:id      // Retrieve specific contract
GET  /api/contracts          // List contracts with filters
```

## API Usage Guide

### 1. Preview a Contract
```typescript
POST /api/contracts/preview
{
  "influencer_name": "John Doe",
  "brand_name": "Brand Co",
  "rate": 1000,
  "timeline": "30 days",
  "deliverables": "2 Instagram posts",
  "payment_terms": "50% upfront, 50% on completion"
}
Response: PDF file (application/pdf)
```

### 2. Generate a Contract
```typescript
POST /api/contracts/generate
{
  "influencer_name": "John Doe",
  "brand_name": "Brand Co",
  "rate": 1000,
  "timeline": "30 days",
  "deliverables": "2 Instagram posts",
  "payment_terms": "50% upfront, 50% on completion",
  "influencer_id": "inf-123",
  "brand_id": "brand-123"
}
```

### 3. Sign a Contract
```typescript
POST /api/contracts/sign
{
  "contract_id": "contract-uuid",
  "signature_file": <binary>,
  "user_id": "user-uuid",
  "mime_type": "image/png"  // Required for validation
}
```

### 4. Get a Contract
```typescript
GET /api/contracts/:id
```

### 5. List Contracts
```typescript
GET /api/contracts?user_id=xxx&role=influencer
```

## Security Features

### 1. Signature Validation
- File size limit: 5MB
- Allowed formats: PNG, JPEG
- Magic number verification
- MIME type validation
- Duplicate signature prevention

### 2. Error Handling
- Custom error types for different scenarios
- Appropriate HTTP status codes
- Detailed error messages
- Centralized error handling

### 3. Secure Storage
- All contracts stored in Supabase
- Encrypted signature storage
- Secure URL generation
- Separate storage for contracts and signatures

### 4. Input Validation
- Required field validation
- Data type verification
- Contract status checks
- User authorization validation

## Technical Requirements

### Dependencies
```json
{
  "dependencies": {
    "@supabase/supabase-js": "^2.49.8",
    "pdf-lib": "^1.17.1",
    "uuid": "^9.0.1",
    "express": "^4.18.2"
  }
}
```

### Environment Variables
```env
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
```

## Error Handling Examples

### 1. Signature Validation Errors
```typescript
// File size exceeded
{ status: 400, message: "Signature file size exceeds 5MB limit" }

// Invalid file type
{ status: 400, message: "Invalid signature file type. Only PNG and JPEG formats are allowed" }

// File integrity
{ status: 400, message: "Invalid image file format" }
```

### 2. Contract Errors
```typescript
// Missing data
{ status: 400, message: "Missing required contract information" }

// Already signed
{ status: 400, message: "Contract has already been signed" }
```

### 3. Storage Errors
```typescript
// Upload failures
{ status: 500, message: "Failed to upload signature: [detailed error]" }

// Storage access
{ status: 500, message: "Failed to upload signed contract: [detailed error]" }
```

## Best Practices

### 1. Contract Generation
- Preview before generation
- Use standardized templates
- Include all required sections
- Maintain consistent formatting

### 2. Signature Process
- Validate file types and size
- Check file integrity
- Prevent duplicate signatures
- Preserve original signatures

### 3. Storage Management
- Organize by contract ID
- Separate signature storage
- Regular cleanup of unused files
- Proper error handling

### 4. Error Handling
- Use appropriate error types
- Provide detailed messages
- Return correct status codes
- Log errors for debugging