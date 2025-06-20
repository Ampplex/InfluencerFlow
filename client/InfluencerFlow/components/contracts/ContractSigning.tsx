import React, { useRef, useState } from 'react';
import SignaturePad from 'react-signature-canvas';
import { motion } from 'framer-motion';
import { Contract, ContractStatus } from '../../types/contract';
import { contractService } from '../../services/contractService';
import { HoverBorderGradient } from '../../src/components/ui/hover-border-gradient';
import { Alert, AlertDescription } from '../../src/components/ui/alert';
import { X, CheckCircle, AlertCircle, RefreshCw, Loader2, PenSquare, FileSignature, Landmark, Calendar } from 'lucide-react';

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

      // Use a placeholder for user object or add a TODO comment

      // Sign contract
      const signedContract = await contractService.signContract(
        contract.id,
        signatureFile,
        'TODO_USER_ID' // Replace with actual user ID
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
      <motion.div 
        className="text-center p-6 max-w-2xl mx-auto"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="w-20 h-20 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-12 h-12 text-green-600 dark:text-green-400" />
        </div>
        <h3 className="text-2xl font-semibold mb-2 text-slate-900 dark:text-slate-100">Contract Already Signed</h3>
        <p className="text-gray-600 dark:text-slate-400 font-mono">
          // This agreement has been finalized and cannot be modified.
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div 
      className="p-6 bg-white dark:bg-slate-900 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-800 max-w-3xl mx-auto"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex items-center mb-8">
        <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center mr-4">
          <FileSignature className="w-6 h-6 text-slate-600 dark:text-slate-400" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Sign Contract</h2>
          <p className="font-mono text-sm text-slate-500 dark:text-slate-400">
            // Legally e-sign to finalize the agreement
          </p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error}
          </AlertDescription>
        </Alert>
      )}

      <div className="mb-8 space-y-6">
        <div className="font-mono text-sm text-slate-600 dark:text-slate-400">
          contract_details() {"{"}
        </div>
        <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-xl border border-slate-200 dark:border-slate-700 space-y-4 ml-4">
          <div className="flex items-center">
            <Landmark className="w-5 h-5 text-slate-500 dark:text-slate-400 mr-4" />
            <div className="flex-1">
              <p className="text-sm text-slate-500 dark:text-slate-400">Brand</p>
              <p className="font-semibold text-slate-800 dark:text-slate-200">{contract.contract_data.brand_name}</p>
            </div>
            <div className="flex-1">
              <p className="text-sm text-slate-500 dark:text-slate-400">Influencer</p>
              <p className="font-semibold text-slate-800 dark:text-slate-200">{contract.contract_data.influencer_name}</p>
            </div>
          </div>
          <div className="border-t border-slate-200 dark:border-slate-700 my-2"></div>
          <div className="flex items-center">
            <p className="text-lg font-bold text-green-600 dark:text-green-400 w-1/2">${contract.contract_data.rate}</p>
            <div className="flex items-center text-slate-500 dark:text-slate-400">
              <Calendar className="w-5 h-5 mr-2" />
              <span>{contract.contract_data.timeline}</span>
            </div>
          </div>
        </div>
        <div className="font-mono text-sm text-slate-600 dark:text-slate-400">
          {"}"}
        </div>
      </div>

      <div className="mb-6 space-y-6">
        <div className="font-mono text-sm text-slate-600 dark:text-slate-400">
          signature_pad() {"{"}
        </div>
        <div className="ml-4">
          <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl overflow-hidden bg-slate-50 dark:bg-slate-800/50">
            <SignaturePad
              ref={signaturePadRef}
              canvasProps={{
                className: 'w-full h-64',
              }}
            />
          </div>
          <div className="mt-2 flex justify-end">
            <button
              onClick={clearSignature}
              className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-mono flex items-center"
            >
              <RefreshCw className="w-3 h-3 mr-2" />
              clear()
            </button>
          </div>
        </div>
        <div className="font-mono text-sm text-slate-600 dark:text-slate-400">
          {"}"}
        </div>
      </div>

      <div className="flex justify-end gap-4 pt-4 border-t border-slate-200 dark:border-slate-700">
        <HoverBorderGradient
          containerClassName="rounded-lg"
          as="button"
          className="bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono flex items-center px-6 py-3 text-sm"
          onClick={onCancel}
          disabled={loading}
        >
          <X className="w-4 h-4 mr-2" />
          cancel()
        </HoverBorderGradient>
        
        <HoverBorderGradient
          containerClassName="rounded-lg"
          as="button"
          className={`font-mono flex items-center px-6 py-3 text-sm ${
            loading 
              ? 'bg-slate-400 dark:bg-slate-600 text-slate-200 dark:text-slate-400' 
              : 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900'
          }`}
          onClick={handleSign}
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              signing...
            </>
          ) : (
            <>
              <PenSquare className="w-4 h-4 mr-2" />
              sign_and_submit()
            </>
          )}
        </HoverBorderGradient>
      </div>
    </motion.div>
  );
}; 