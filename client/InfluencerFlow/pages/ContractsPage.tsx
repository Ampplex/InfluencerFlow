import React from 'react';
import { ContractList } from '../components/contracts/ContractList';

const ContractsPage: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <ContractList />
    </div>
  );
};

export default ContractsPage; 