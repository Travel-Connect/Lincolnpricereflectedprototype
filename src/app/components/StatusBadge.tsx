import * as React from 'react';
import { Clock, AlertTriangle, CheckCircle, XCircle, Loader2 } from 'lucide-react';

type AnyStatus = 'queued' | 'running' | 'awaiting_user' | 'succeeded' | 'failed' | 'pending' | 'skipped';

interface StatusBadgeProps {
  status: AnyStatus;
  size?: 'sm' | 'md';
}

const STATUS_CONFIG: Record<
  string,
  { label: string; bg: string; text: string; icon: React.ComponentType<{ size?: number; className?: string }>; spin?: boolean }
> = {
  queued: { label: 'キュー待ち', bg: 'bg-gray-100', text: 'text-gray-600', icon: Clock },
  running: { label: '実行中', bg: 'bg-blue-100', text: 'text-blue-700', icon: Loader2, spin: true },
  awaiting_user: { label: 'ユーザー入力待ち', bg: 'bg-amber-100', text: 'text-amber-800', icon: AlertTriangle },
  succeeded: { label: '成功', bg: 'bg-green-100', text: 'text-green-700', icon: CheckCircle },
  failed: { label: '失敗', bg: 'bg-red-100', text: 'text-red-700', icon: XCircle },
  pending: { label: '待機中', bg: 'bg-gray-100', text: 'text-gray-500', icon: Clock },
  skipped: { label: 'スキップ', bg: 'bg-gray-50', text: 'text-gray-400', icon: Clock },
};

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;
  const Icon = config.icon;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-medium ${config.bg} ${config.text} ${
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs'
      }`}
    >
      <Icon size={size === 'sm' ? 10 : 12} className={config.spin ? 'animate-spin' : ''} />
      {config.label}
    </span>
  );
}

export function StepDot({ status }: { status: AnyStatus }) {
  const colors: Record<string, string> = {
    pending: 'bg-gray-200 border-gray-300',
    running: 'bg-blue-500 border-blue-400 animate-pulse',
    succeeded: 'bg-green-500 border-green-400',
    failed: 'bg-red-500 border-red-400',
    skipped: 'bg-gray-300 border-gray-300',
  };
  return (
    <div
      className={`w-3 h-3 rounded-full border-2 flex-shrink-0 ${colors[status] ?? colors.pending}`}
    />
  );
}