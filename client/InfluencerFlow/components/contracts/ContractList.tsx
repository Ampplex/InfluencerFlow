import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  FileText, 
  Clock, 
  AlertCircle, 
  CheckCircle, 
  XCircle, 
  MoreHorizontal, 
  Plus, 
  Eye, 
  Edit,
  ChevronRight,
  Inbox
} from 'lucide-react';
import { Contract, ContractStatus, PaymentStatus } from '../../types/contract';
import { contractService } from '../../services/contractService';
import { ContractPreview } from './ContractPreview';
import { HoverBorderGradient } from '../../src/components/ui/hover-border-gradient';
import { Badge } from '../../src/components/ui/badge';
import { Alert, AlertDescription } from '../../src/components/ui/alert';

export const ContractList: React.FC = () => {
  const navigate = useNavigate();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);

  useEffect(() => {
    loadContracts();
  }, []);

  const loadContracts = async () => {
    try {
      setLoading(true);
      setError(null);

      const user = await contractService.getCurrentUser();
      const contractsList = await contractService.listContracts(
        user.userId,
        user.role as "brand" | "influencer"
      );
      setContracts(contractsList);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusInfo = (status: ContractStatus) => {
    switch (status) {
      case ContractStatus.DRAFT:
        return { icon: <Edit className="w-4 h-4" />, color: 'bg-gray-500', text: 'Draft' };
      case ContractStatus.PENDING_SIGNATURE:
        return { icon: <Clock className="w-4 h-4" />, color: 'bg-yellow-500', text: 'Pending' };
      case ContractStatus.SIGNED:
        return { icon: <CheckCircle className="w-4 h-4" />, color: 'bg-green-500', text: 'Signed' };
      case ContractStatus.REJECTED:
        return { icon: <XCircle className="w-4 h-4" />, color: 'bg-red-500', text: 'Rejected' };
      default:
        return { icon: <MoreHorizontal className="w-4 h-4" />, color: 'bg-gray-500', text: 'Unknown' };
    }
  };

  const getPaymentStatusInfo = (status?: PaymentStatus) => {
    switch (status) {
      case PaymentStatus.PENDING:
        return { text: 'Pending', className: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200' };
      case PaymentStatus.INITIATED:
        return { text: 'Initiated', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' };
      case PaymentStatus.COMPLETED:
        return { text: 'Paid', className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' };
      case PaymentStatus.FAILED:
        return { text: 'Failed', className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' };
      default:
        return { text: 'N/A', className: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200' };
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mb-6 animate-pulse">
          <FileText className="w-8 h-8 text-slate-600 dark:text-slate-400" />
        </div>
        <h3 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
          Loading Contracts...
        </h3>
        <p className="text-slate-600 dark:text-slate-400 font-mono text-sm text-center max-w-md">
          // Fetching your agreements from the blockchain of paperwork
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center py-16">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <motion.div 
      className="max-w-7xl mx-auto"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900 dark:text-slate-100 mb-2 tracking-tight">
            Contracts
          </h1>
          <p className="font-mono text-sm text-slate-600 dark:text-slate-400">
            // Manage all your brand and influencer agreements
          </p>
        </div>
        <HoverBorderGradient
          containerClassName="rounded-lg"
          as="button"
          className="bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-mono flex items-center px-4 py-2 text-sm font-medium"
          onClick={() => navigate('/contracts/create')}
        >
          <Plus className="w-4 h-4 mr-2" />
          create_contract()
        </HoverBorderGradient>
      </div>

      {contracts.length === 0 ? (
        <div className="text-center py-24 bg-white dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
          <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
            <Inbox className="w-10 h-10 text-slate-500 dark:text-slate-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-slate-100 mb-2">No Contracts Found</h3>
          <p className="text-gray-600 dark:text-slate-400 font-mono text-sm">
            // Start by creating a new contract for a campaign
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800/50 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
          <ul className="divide-y divide-slate-200 dark:divide-slate-700">
            {contracts.map((contract) => {
              const statusInfo = getStatusInfo(contract.status);
              const paymentStatusInfo = getPaymentStatusInfo(contract.payment_status);
              return (
                <li key={contract.id} className="hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors duration-200">
                  <div className="flex items-center p-4 sm:p-6">
                    <div className="flex-shrink-0 mr-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white ${statusInfo.color}`}>
                        {statusInfo.icon}
                      </div>
                    </div>
                    <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-4 items-center">
                      <div className="sm:col-span-2">
                        <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                          {contract.contract_data.brand_name} ↔ {contract.contract_data.influencer_name}
                        </div>
                        <div className="text-sm text-slate-500 dark:text-slate-400 font-mono">
                          ${contract.contract_data.rate} • {contract.contract_data.timeline}
                        </div>
                      </div>
                      <div className="hidden sm:block">
                        <Badge variant="outline" className={paymentStatusInfo.className}>
                          {paymentStatusInfo.text}
                        </Badge>
                      </div>
                      <div className="hidden sm:block text-sm text-slate-500 dark:text-slate-400 font-mono">
                        {new Date(contract.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <HoverBorderGradient
                        containerClassName="rounded-lg"
                        as="button"
                        className="bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono flex items-center px-3 py-2 text-xs"
                        onClick={() => setSelectedContract(contract)}
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        View
                      </HoverBorderGradient>
                      {contract.status === ContractStatus.PENDING_SIGNATURE && (
                        <HoverBorderGradient
                          containerClassName="rounded-lg"
                          as="button"
                          className="bg-green-600 text-white font-mono flex items-center px-3 py-2 text-xs"
                          onClick={() => navigate(`/contracts/sign/${contract.id}`)}
                        >
                          <Edit className="w-3 h-3 mr-1" />
                          Sign
                        </HoverBorderGradient>
                      )}
                      <ChevronRight className="w-5 h-5 text-slate-400" />
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {selectedContract && (
        <ContractPreview
          contract={selectedContract}
          onClose={() => setSelectedContract(null)}
        />
      )}
    </motion.div>
  );
}; 