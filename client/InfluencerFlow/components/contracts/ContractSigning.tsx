import React, { useRef, useState } from 'react';
import SignaturePad from 'react-signature-canvas';
import { Contract, ContractStatus } from '../../types/contract';
import { contractService } from '../../services/contractService';

interface ContractSigningProps {
  contract: Contract;
  onSign?: (contract: Contract) => void;
  onCancel?: () => void;
}

export const ContractSigning: React.FC<ContractSigningProps> = ({ contract, onSign, onCancel }) => {
  const signaturePadRef = useRef<SignaturePad>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearSignature = () => {
    if (signaturePadRef.current) {
      signaturePadRef.current.clear();
    }
  };

  const handleSign = async () => {
    if (!signaturePadRef.current || signaturePadRef.current.isEmpty()) {
      setError('Please provide your signature');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Get signature as PNG blob
      const signatureDataUrl = signaturePadRef.current.toDataURL('image/png');
      const signatureBlob = await fetch(signatureDataUrl).then(res => res.blob());
      const signatureFile = new File([signatureBlob], 'signature.png', { type: 'image/png' });

      // Get current user
      const user = await contractService.getCurrentUser();

      // Sign contract
      const signedContract = await contractService.signContract(
        contract.id,
        signatureFile,
        user.userId
      );

      if (onSign) {
        onSign(signedContract);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (contract.status === ContractStatus.SIGNED) {
    return (
      <div className="text-center p-6">
        <div className="text-green-600 mb-4">
          <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-xl font-semibold mb-2">Contract Already Signed</h3>
        <p className="text-gray-600">This contract has already been signed and cannot be modified.</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Sign Contract</h2>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Contract Details</h3>
        <div className="bg-gray-50 p-4 rounded-lg">
          <p><strong>Brand:</strong> {contract.contract_data.brand_name}</p>
          <p><strong>Influencer:</strong> {contract.contract_data.influencer_name}</p>
          <p><strong>Rate:</strong> ${contract.contract_data.rate}</p>
          <p><strong>Timeline:</strong> {contract.contract_data.timeline}</p>
        </div>
      </div>

      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Your Signature</h3>
        <div className="border-2 border-gray-300 rounded-lg overflow-hidden">
          <SignaturePad
            ref={signaturePadRef}
            canvasProps={{
              className: 'w-full h-64 bg-white',
            }}
          />
        </div>
        <div className="mt-2 flex justify-end">
          <button
            onClick={clearSignature}
            className="text-sm text-gray-600 hover:text-gray-800"
          >
            Clear Signature
          </button>
        </div>
      </div>

      <div className="flex justify-end gap-4">
        <button
          onClick={onCancel}
          disabled={loading}
          className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          onClick={handleSign}
          disabled={loading}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Signing...' : 'Sign Contract'}
        </button>
      </div>
    </div>
  );
}; 