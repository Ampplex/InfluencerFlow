import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, FileText, Loader2 } from 'lucide-react';
import { Contract } from '../../types/contract';
import { HoverBorderGradient } from '../../src/components/ui/hover-border-gradient';

interface ContractPreviewProps {
  contract: Contract;
  onClose?: () => void;
}

export const ContractPreview: React.FC<ContractPreviewProps> = ({ contract, onClose }) => {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    // If we have a contract URL, use it directly
    if (contract.contract_url) {
      setPdfUrl(contract.contract_url);
      setIsLoading(false);
    }

    return () => {
      // Cleanup URL when component unmounts
      if (pdfUrl && pdfUrl.startsWith('blob:')) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [contract]);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <motion.div 
          className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-4xl h-[90vh] flex flex-col border border-slate-200 dark:border-slate-700"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.3 }}
        >
          <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center flex-shrink-0">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center mr-3">
                <FileText className="w-5 h-5 text-slate-600 dark:text-slate-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Contract Preview</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-mono">
                  // {contract.contract_data.brand_name} & {contract.contract_data.influencer_name}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="flex-1 p-2 bg-slate-50 dark:bg-slate-800/50 overflow-y-auto">
            {isLoading || !pdfUrl ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-600 dark:text-slate-400">
                <Loader2 className="w-8 h-8 animate-spin mb-4" />
                <p className="font-mono text-sm">loading_document()...</p>
              </div>
            ) : (
              <iframe
                src={pdfUrl}
                className="w-full h-full rounded border border-slate-200 dark:border-slate-700"
                title="Contract Preview"
              />
            )}
          </div>

          <div className="p-4 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-4 flex-shrink-0">
            <HoverBorderGradient
              containerClassName="rounded-lg"
              as="button"
              className="bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono flex items-center px-4 py-2 text-sm"
              onClick={onClose}
            >
              close()
            </HoverBorderGradient>

            {contract.contract_url && (
              <HoverBorderGradient
                containerClassName="rounded-lg"
                as="a"
                href={contract.contract_url}
                download={`contract_${contract.id}.pdf`}
                className="bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-mono flex items-center px-4 py-2 text-sm"
              >
                <Download className="w-4 h-4 mr-2" />
                download_pdf()
              </HoverBorderGradient>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}; 