import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import supabase from '../utils/supabase';
import { motion } from 'framer-motion';
import { CheckCircle, BarChart2, DollarSign, FileText, Settings, User } from 'lucide-react';

const StatCard = ({ icon, title, value, color }: { icon: React.ReactNode, title: string, value: string, color: string }) => (
  <motion.div 
    className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-md"
    whileHover={{ scale: 1.03 }}
  >
    <div className="flex items-center space-x-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-sm font-mono text-slate-500 dark:text-slate-400">{title}</p>
        <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{value}</p>
      </div>
    </div>
  </motion.div>
);

const InfluencerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
      } else {
        navigate('/auth');
      }
      setLoading(false);
    };
    fetchUser();
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <p className="text-slate-500">Loading Dashboard...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-12 px-4 sm:px-6 lg:px-8">
      <motion.div 
        className="max-w-7xl mx-auto"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <header className="mb-10">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            Creator Dashboard
            </h1>
          <p className="mt-2 text-lg text-slate-600 dark:text-slate-400 font-mono">
            Welcome back, {user?.user_metadata?.username || user?.email}!
          </p>
        </header>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <StatCard 
            icon={<BarChart2 className="w-6 h-6 text-white" />}
            title="Active Campaigns"
            value="0"
            color="bg-gradient-to-r from-blue-500 to-purple-500"
          />
          <StatCard 
            icon={<FileText className="w-6 h-6 text-white" />}
            title="Pending Contracts"
            value="0"
            color="bg-gradient-to-r from-orange-500 to-yellow-500"
          />
          <StatCard 
            icon={<DollarSign className="w-6 h-6 text-white" />}
            title="Total Earnings"
            value="$0.00"
            color="bg-gradient-to-r from-green-500 to-emerald-500"
          />
          <StatCard 
            icon={<User className="w-6 h-6 text-white" />}
            title="Profile Status"
            value="Complete"
            color="bg-gradient-to-r from-pink-500 to-rose-500"
          />
        </div>

        {/* Main Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-8 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-md">
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-6">
              Campaign Invitations
            </h2>
            <div className="text-center py-10">
              <p className="text-slate-500 dark:text-slate-400 font-mono">
                // No active campaign invitations at the moment.
                    </p>
                  </div>
                </div>

          <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-md">
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-6">
              Quick Actions
            </h2>
            <ul className="space-y-4">
              <li>
                <button 
                  onClick={() => navigate('/influencer-profile-setup')}
                  className="w-full text-left p-4 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors flex items-center"
                >
                  <Settings className="w-5 h-5 mr-4 text-slate-500"/>
                  <span className="font-mono text-slate-700 dark:text-slate-300">Edit Profile</span>
                </button>
              </li>
              <li>
                <button className="w-full text-left p-4 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors flex items-center">
                  <FileText className="w-5 h-5 mr-4 text-slate-500"/>
                  <span className="font-mono text-slate-700 dark:text-slate-300">View Contracts</span>
                </button>
              </li>
                      </ul>
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="font-mono text-xs text-slate-500 dark:text-slate-500">
            <CheckCircle className="w-4 h-4 inline-block mr-1 text-green-500" />
            Your dashboard is up-to-date.
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default InfluencerDashboard;