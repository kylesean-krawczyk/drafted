import { useEffect, useState } from 'react';
import { Search, MapPin, Building2, Bookmark, BookmarkCheck, DollarSign, Filter, X, ExternalLink } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  work_type: string;
  employment_type: string;
  salary_min: number;
  salary_max: number;
  description: string;
  requirements: string[];
  benefits: string[];
  category: string;
  posted_at: string;
  external_url: string;
}

export function Jobs() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [savedJobIds, setSavedJobIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedWorkType, setSelectedWorkType] = useState('');
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  const categories = ['engineering', 'design', 'marketing', 'data'];
  const workTypes = ['remote', 'hybrid', 'onsite'];

  useEffect(() => {
    fetchJobs();
    fetchSavedJobs();
  }, [user]);

  async function fetchJobs() {
    const { data } = await supabase
      .from('jobs')
      .select('*')
      .eq('is_active', true)
      .order('posted_at', { ascending: false });

    setJobs(data || []);
    setLoading(false);
  }

  async function fetchSavedJobs() {
    if (!user) return;
    const { data } = await supabase
      .from('saved_jobs')
      .select('job_id')
      .eq('user_id', user.id);

    setSavedJobIds(new Set((data || []).map((s) => s.job_id)));
  }

  async function toggleSave(jobId: string) {
    if (!user) return;

    if (savedJobIds.has(jobId)) {
      await supabase.from('saved_jobs').delete().eq('user_id', user.id).eq('job_id', jobId);
      setSavedJobIds((prev) => {
        const next = new Set(prev);
        next.delete(jobId);
        return next;
      });
    } else {
      await supabase.from('saved_jobs').insert({ user_id: user.id, job_id: jobId });
      setSavedJobIds((prev) => new Set(prev).add(jobId));
    }
  }

  async function applyToJob(job: Job) {
    if (!user) return;

    const { data: existing } = await supabase
      .from('applications')
      .select('id')
      .eq('user_id', user.id)
      .eq('job_id', job.id)
      .maybeSingle();

    if (existing) return;

    await supabase.from('applications').insert({
      user_id: user.id,
      job_id: job.id,
      status: 'applied',
    });

    alert('Application submitted!');
  }

  const filteredJobs = jobs.filter((job) => {
    const matchesSearch = !searchQuery ||
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.company.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || job.category === selectedCategory;
    const matchesWorkType = !selectedWorkType || job.work_type === selectedWorkType;
    return matchesSearch && matchesCategory && matchesWorkType;
  });

  function formatSalary(min: number, max: number) {
    if (!min && !max) return 'Salary not listed';
    const format = (n: number) => `$${(n / 1000).toFixed(0)}k`;
    return `${format(min)} - ${format(max)}`;
  }

  function timeAgo(date: string) {
    const diff = Date.now() - new Date(date).getTime();
    const days = Math.floor(diff / 86400000);
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    return `${days} days ago`;
  }

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
        <h1 className="text-2xl font-bold text-gray-900">Find Jobs</h1>
        <p className="text-gray-500 mt-1">Discover opportunities that match your skills</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <div className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-[240px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title or company..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none text-sm"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-700 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
            ))}
          </select>

          <select
            value={selectedWorkType}
            onChange={(e) => setSelectedWorkType(e.target.value)}
            className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-700 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
          >
            <option value="">All Work Types</option>
            {workTypes.map((type) => (
              <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>
            ))}
          </select>

          {(selectedCategory || selectedWorkType || searchQuery) && (
            <button
              onClick={() => { setSelectedCategory(''); setSelectedWorkType(''); setSearchQuery(''); }}
              className="flex items-center gap-1 px-3 py-2.5 text-sm text-gray-600 hover:text-gray-900"
            >
              <X className="w-4 h-4" /> Clear
            </button>
          )}
        </div>
      </div>

      <div className="flex gap-6">
        <div className={`flex-1 space-y-4 ${selectedJob ? 'max-w-md' : ''}`}>
          <p className="text-sm text-gray-500 mb-4">{filteredJobs.length} jobs found</p>

          {filteredJobs.map((job) => (
            <div
              key={job.id}
              onClick={() => setSelectedJob(job)}
              className={`bg-white rounded-xl border p-5 cursor-pointer transition-all hover:shadow-md ${
                selectedJob?.id === job.id ? 'border-teal-300 ring-1 ring-teal-100' : 'border-gray-200'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900">{job.title}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Building2 className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600">{job.company}</span>
                  </div>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); toggleSave(job.id); }}
                  className="p-2 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  {savedJobIds.has(job.id) ? (
                    <BookmarkCheck className="w-5 h-5 text-teal-600" />
                  ) : (
                    <Bookmark className="w-5 h-5 text-gray-400" />
                  )}
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-sm">
                <span className="flex items-center gap-1 text-gray-500">
                  <MapPin className="w-3.5 h-3.5" /> {job.location}
                </span>
                <span className="flex items-center gap-1 text-gray-500">
                  <DollarSign className="w-3.5 h-3.5" /> {formatSalary(job.salary_min, job.salary_max)}
                </span>
              </div>

              <div className="flex items-center gap-2 mt-3">
                <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-teal-50 text-teal-700 capitalize">
                  {job.work_type}
                </span>
                <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 capitalize">
                  {job.employment_type}
                </span>
                <span className="text-xs text-gray-400 ml-auto">{timeAgo(job.posted_at)}</span>
              </div>
            </div>
          ))}
        </div>

        {selectedJob && (
          <div className="flex-1 bg-white rounded-xl border border-gray-200 p-6 sticky top-8 max-h-[calc(100vh-8rem)] overflow-y-auto">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{selectedJob.title}</h2>
                <p className="text-gray-600 mt-1">{selectedJob.company}</p>
              </div>
              <button
                onClick={() => setSelectedJob(null)}
                className="p-2 hover:bg-gray-50 rounded-lg"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="flex flex-wrap gap-3 mb-6">
              <span className="flex items-center gap-1.5 text-sm text-gray-600 bg-gray-50 px-3 py-1.5 rounded-lg">
                <MapPin className="w-4 h-4" /> {selectedJob.location}
              </span>
              <span className="flex items-center gap-1.5 text-sm text-gray-600 bg-gray-50 px-3 py-1.5 rounded-lg">
                <DollarSign className="w-4 h-4" /> {formatSalary(selectedJob.salary_min, selectedJob.salary_max)}
              </span>
              <span className="text-sm text-gray-600 bg-gray-50 px-3 py-1.5 rounded-lg capitalize">
                {selectedJob.work_type}
              </span>
              <span className="text-sm text-gray-600 bg-gray-50 px-3 py-1.5 rounded-lg capitalize">
                {selectedJob.employment_type}
              </span>
            </div>

            <div className="flex gap-3 mb-6">
              <button
                onClick={() => applyToJob(selectedJob)}
                className="flex-1 bg-teal-600 text-white py-2.5 rounded-lg font-medium hover:bg-teal-700 transition-colors text-sm"
              >
                Quick Apply
              </button>
              <button
                onClick={() => toggleSave(selectedJob.id)}
                className="px-4 py-2.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                {savedJobIds.has(selectedJob.id) ? (
                  <BookmarkCheck className="w-5 h-5 text-teal-600" />
                ) : (
                  <Bookmark className="w-5 h-5 text-gray-400" />
                )}
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-2">About the Role</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{selectedJob.description}</p>
              </div>

              {selectedJob.requirements.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">Requirements</h3>
                  <ul className="space-y-2">
                    {selectedJob.requirements.map((req, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                        <span className="w-1.5 h-1.5 rounded-full bg-teal-500 mt-2 flex-shrink-0" />
                        {req}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {selectedJob.benefits.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">Benefits</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedJob.benefits.map((benefit, i) => (
                      <span key={i} className="text-xs bg-green-50 text-green-700 px-2.5 py-1 rounded-full">
                        {benefit}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
