import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, ClipboardList, BookmarkCheck, TrendingUp, ArrowRight, Clock } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface Stats {
  totalApplications: number;
  interviewing: number;
  savedJobs: number;
  recentApplications: Array<{
    id: string;
    status: string;
    applied_at: string;
    job: { title: string; company: string } | null;
  }>;
}

export function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats>({
    totalApplications: 0,
    interviewing: 0,
    savedJobs: 0,
    recentApplications: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      if (!user) return;

      const [appsResult, interviewResult, savedResult, recentResult] = await Promise.all([
        supabase.from('applications').select('id', { count: 'exact' }).eq('user_id', user.id),
        supabase.from('applications').select('id', { count: 'exact' }).eq('user_id', user.id).eq('status', 'interviewing'),
        supabase.from('saved_jobs').select('id', { count: 'exact' }).eq('user_id', user.id),
        supabase.from('applications').select('id, status, applied_at, job:jobs(title, company)').eq('user_id', user.id).order('applied_at', { ascending: false }).limit(5),
      ]);

      setStats({
        totalApplications: appsResult.count || 0,
        interviewing: interviewResult.count || 0,
        savedJobs: savedResult.count || 0,
        recentApplications: (recentResult.data || []) as Stats['recentApplications'],
      });
      setLoading(false);
    }

    fetchStats();
  }, [user]);

  const statCards = [
    { label: 'Applications', value: stats.totalApplications, icon: ClipboardList, color: 'bg-teal-50 text-teal-600' },
    { label: 'Interviewing', value: stats.interviewing, icon: TrendingUp, color: 'bg-amber-50 text-amber-600' },
    { label: 'Saved Jobs', value: stats.savedJobs, icon: BookmarkCheck, color: 'bg-blue-50 text-blue-600' },
  ];

  const statusColors: Record<string, string> = {
    applied: 'bg-blue-100 text-blue-700',
    interviewing: 'bg-amber-100 text-amber-700',
    offered: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
    withdrawn: 'bg-gray-100 text-gray-700',
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back{user?.user_metadata?.full_name ? `, ${user.user_metadata.full_name}` : ''}
        </h1>
        <p className="text-gray-500 mt-1">Here's an overview of your job search progress</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {statCards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
                <Icon className="w-5 h-5" />
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900">{value}</p>
            <p className="text-sm text-gray-500 mt-1">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Recent Applications</h2>
            <Link to="/applications" className="text-sm text-teal-600 hover:text-teal-700 flex items-center gap-1">
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {stats.recentApplications.length === 0 ? (
            <div className="text-center py-8">
              <ClipboardList className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">No applications yet</p>
              <Link to="/jobs" className="text-teal-600 text-sm font-medium hover:text-teal-700 mt-2 inline-block">
                Browse jobs
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {stats.recentApplications.map((app) => (
                <div key={app.id} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{app.job?.title || 'Unknown Role'}</p>
                    <p className="text-xs text-gray-500">{app.job?.company || 'Unknown Company'}</p>
                  </div>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${statusColors[app.status] || statusColors.applied}`}>
                    {app.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Quick Actions</h2>
          <div className="space-y-3">
            <Link
              to="/jobs"
              className="flex items-center gap-4 p-4 rounded-lg border border-gray-100 hover:border-teal-200 hover:bg-teal-50/50 transition-all group"
            >
              <div className="w-10 h-10 rounded-lg bg-teal-50 flex items-center justify-center group-hover:bg-teal-100 transition-colors">
                <Briefcase className="w-5 h-5 text-teal-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Browse Jobs</p>
                <p className="text-xs text-gray-500">Discover new opportunities</p>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-400 ml-auto" />
            </Link>
            <Link
              to="/applications"
              className="flex items-center gap-4 p-4 rounded-lg border border-gray-100 hover:border-teal-200 hover:bg-teal-50/50 transition-all group"
            >
              <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center group-hover:bg-amber-100 transition-colors">
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Track Applications</p>
                <p className="text-xs text-gray-500">Update your application statuses</p>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-400 ml-auto" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
