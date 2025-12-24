
import React, { useState } from 'react';
import Layout from './components/Layout';
import ScannerView from './components/ScannerView';
import EditView from './components/EditView';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'scan' | 'edit'>('scan');

  return (
    <Layout activeTab={activeTab} onTabChange={setActiveTab}>
      <div className="animate-in fade-in duration-500">
        {activeTab === 'scan' ? <ScannerView /> : <EditView />}
      </div>
      
      {/* Visual background decoration */}
      <div className="fixed -bottom-24 -left-24 w-64 h-64 bg-blue-100 rounded-full blur-3xl opacity-50 -z-10"></div>
      <div className="fixed -top-24 -right-24 w-64 h-64 bg-yellow-100 rounded-full blur-3xl opacity-50 -z-10"></div>
    </Layout>
  );
};

export default App;
