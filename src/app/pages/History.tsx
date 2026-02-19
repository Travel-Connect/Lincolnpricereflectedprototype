import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Search, AlertCircle, ChevronRight, Filter, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { StatusBadge } from '../components/StatusBadge';
import type { JobStatus } from '../data/mockData';

const ALL_STATUSES: { value: JobStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'すべて' },
  { value: 'queued', label: 'キュー待ち' },
  { value: 'running', label: '実行中' },
  { value: 'awaiting_user', label: 'ユーザー入力待ち' },
  { value: 'succeeded', label: '成功' },
  { value: 'failed', label: '失敗' },
];

export function History() {
  const { jobs } = useApp();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<JobStatus | 'all'>('all');
  const [envFilter, setEnvFilter] = useState<'all' | 'production' | 'staging'>('all');
  const [failedOnly, setFailedOnly] = useState(false);

  const filtered = jobs.filter(j => {
    if (failedOnly && j.status !== 'failed') return false;
    if (statusFilter !== 'all' && j.status !== statusFilter) return false;
    if (envFilter !== 'all' && j.environment !== envFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        j.facilityName.toLowerCase().includes(q) ||
        j.id.toLowerCase().includes(q) ||
        j.createdBy.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const hasActiveFilters = search || statusFilter !== 'all' || envFilter !== 'all' || failedOnly;

  function clearFilters() {
    setSearch('');
    setStatusFilter('all');
    setEnvFilter('all');
    setFailedOnly(false);
  }

  return (
    <div className="p-8 max-w-[1160px] mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">ジョブ履歴</h1>
        <p className="text-sm text-gray-500 mt-1">過去の実行ジョブを確認できます</p>
      </div>

      {/* Filter bar */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-6">
        <div className="px-6 py-4 flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative min-w-[240px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="施設名・ジョブIDで検索..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as JobStatus | 'all')}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-700"
          >
            {ALL_STATUSES.map(s => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>

          {/* Env filter */}
          <select
            value={envFilter}
            onChange={e => setEnvFilter(e.target.value as 'all' | 'production' | 'staging')}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-700"
          >
            <option value="all">全環境</option>
            <option value="production">本番</option>
            <option value="staging">検証</option>
          </select>

          {/* Quick: failed only */}
          <button
            onClick={() => setFailedOnly(!failedOnly)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors border ${
              failedOnly
                ? 'bg-red-50 border-red-200 text-red-700'
                : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            <AlertCircle size={13} />
            失敗のみ
          </button>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 transition-colors ml-auto"
            >
              <X size={14} />
              フィルタを解除
            </button>
          )}

          <span className="text-sm text-gray-400 ml-auto">{filtered.length} / {jobs.length}件</span>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="grid grid-cols-[48px_140px_1fr_80px_100px_140px_40px] px-6 py-3 border-b border-gray-100 bg-gray-50/50">
          {['#', 'ステータス', '施設 / 期間', '環境', '実行者', '作成日時', ''].map((h, i) => (
            <div key={i} className="text-xs font-medium text-gray-500">{h}</div>
          ))}
        </div>

        <div className="divide-y divide-gray-50">
          {filtered.length === 0 ? (
            <div className="py-16 text-center">
              <Filter size={36} className="mx-auto mb-3 text-gray-200" />
              <p className="text-gray-400 text-sm">条件に一致するジョブが見つかりません</p>
              {hasActiveFilters && (
                <button onClick={clearFilters} className="mt-2 text-indigo-600 hover:underline text-sm">
                  フィルタを解除する
                </button>
              )}
            </div>
          ) : (
            filtered.map((job, idx) => (
              <div
                key={job.id}
                onClick={() => navigate(`/jobs/${job.id}`)}
                className="grid grid-cols-[48px_140px_1fr_80px_100px_140px_40px] items-center px-6 py-4 hover:bg-gray-50 cursor-pointer transition-colors group"
              >
                <div className="text-xs text-gray-300 font-mono">{idx + 1}</div>
                <div>
                  <StatusBadge status={job.status} />
                </div>
                <div className="min-w-0 pr-4">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900 text-sm truncate">{job.facilityName}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded-full flex-shrink-0 ${
                      job.execMode === 'A_only' ? 'bg-blue-100 text-blue-600' :
                      job.execMode === 'B_only' ? 'bg-purple-100 text-purple-600' :
                      'bg-indigo-100 text-indigo-600'
                    }`}>
                      {job.execMode === 'A_only' ? 'A' : job.execMode === 'B_only' ? 'B' : 'A+B'}
                    </span>
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    {job.period.from} 〜 {job.period.to}
                    <span className="ml-2 font-mono text-gray-300">#{job.id}</span>
                  </div>
                </div>
                <div className="text-xs font-medium">
                  {job.environment === 'production' ? (
                    <span className="text-red-600">本番</span>
                  ) : (
                    <span className="text-blue-600">検証</span>
                  )}
                </div>
                <div className="text-sm text-gray-500">{job.createdBy}</div>
                <div className="text-xs text-gray-400">
                  {new Date(job.createdAt).toLocaleString('ja-JP', {
                    month: 'numeric',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
                <div className="flex justify-end">
                  <ChevronRight size={16} className="text-gray-300 group-hover:text-gray-500 transition-colors" />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}