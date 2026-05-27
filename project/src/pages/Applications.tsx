import { useEffect, useState } from 'react';
import { ClipboardList, MoreVertical, Calendar, Building2, ChevronDown } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface Application {
  id: string;
  status: string;
  applied_at: string;
  notes: string;
  next_step: string;
  next_step_date: string | null;
  job: {
    title: string;
    company: string;
    location: string;
    work_type: string;
    salary_min: number;
    salary_max: number;
  } | null;
}

const statuses = ['applied', 'interviewing', 'offered', 'rejected', 'withdrawn'];

const statusConfig: Record<string, { bg: string; text: string; dot: string }> = {
  applied: { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
  interviewing: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
  offered: { bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500' },
  rejected: { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500' },
  withdrawn: { bg: 'bg-gray-50', text: 'text-gray-700', dot: 'bg-gray-500' },
};

export function Applications() {
  const { user } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNotes, setEditNotes] = useState('');

  useEffect(() => {
    fetchApplications();
  }, [user]);

  async function fetchApplications() {
    if (!user) return;

    const { data } = await supabase
      .from('applications')
      .select('id, status, applied_at, notes, next_step, next_step_date, job:jobs(title, company, location, work_type, salary_min, salary_max)')
      .eq('user_id', user.id)
      .order('applied_at', { ascending: false });

    setApplications((data || []) as Application[]);
    setLoading(false);
  }

  async function updateStatus(appId: string, newStatus: string) {
    await supabase
      .from('applications')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', appId);

    setApplications((prev) =>
      prev.map((app) => (app.id === appId ? { ...app, status: newStatus } : app))
    );
  }

  async function updateNotes(appId: string) {
    await supabase
      .from('applications')
      .update({ notes: editNotes, updated_at: new Date().toISOString() })
      .eq('id', appId);

    setApplications((prev) =>
      prev.map((app) => (app.id === appId ? { ...app, notes: editNotes } : app))
    );
    setEditingId(null);
  }

  async function deleteApplication(appId: string) {
    await supabase.from('applications').delete().eq('id', appId);
    setApplications((prev) => prev.filter((app) => app.id !== appId));
  }

  const filteredApps = applications.filter(
    (app) => !filterStatus || app.status === filterStatus
  );

  const counts = statuses.reduce((acc, status) => {
    acc[status] = applications.filter((a) => a.status === status).length;
    return acc;
  }, {} as Record<string, number>);

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
        <h1 className="text-2xl font-bold text-gray-900">Applications</h1>
        <p className="text-gray-500 mt-1">Track and manage your job applications</p>
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <button
          onClick={() => setFilterStatus('')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            !filterStatus ? 'bg-teal-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
          }`}
        >
          All ({applications.length})
        </button>
        {statuses.map((status) => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
              filterStatus === status
                ? 'bg-teal-600 text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {status} ({counts[status] || 0})
          </button>
        ))}
      </div>

      {filteredApps.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <ClipboardList className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">No applications yet</h3>
          <p className="text-gray-500 text-sm">Start browsing jobs and apply to track them here</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredApps.map((app) => {
            const config = statusConfig[app.status] || statusConfig.applied;
            return (
              <div key={app.id} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-sm transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-gray-900">{app.job?.title || 'Unknown Role'}</h3>
                      <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${config.bg} ${config.text}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
                        {app.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Building2 className="w-4 h-4" />
                        {app.job?.company || 'Unknown'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        Applied {new Date(app.applied_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <select
                      value={app.status}
                      onChange={(e) => updateStatus(app.id, e.target.value)}
                      className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
                    >
                      {statuses.map((s) => (
                        <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                      ))}
                    </select>
                    <button
                      onClick={() => deleteApplication(app.id)}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors text-xs"
                      title="Remove"
                    >
                      &times;
                    </button>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-gray-50">
                  {editingId === app.id ? (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={editNotes}
                        onChange={(e) => setEditNotes(e.target.value)}
                        placeholder="Add notes about this application..."
                        className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
                      />
                      <button
                        onClick={() => updateNotes(app.id)}
                        className="px-3 py-2 bg-teal-600 text-white text-sm rounded-lg hover:bg-teal-700"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="px-3 py-2 border border-gray-200 text-sm rounded-lg hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => { setEditingId(app.id); setEditNotes(app.notes || ''); }}
                      className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {app.notes || 'Add notes...'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
