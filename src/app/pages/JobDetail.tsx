import * as React from 'react';
import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router';
import {
  ChevronLeft, CheckCircle, XCircle, Loader2, Clock, AlertTriangle,
  RotateCcw, StopCircle, ChevronDown, ChevronUp, Download, FileText,
  Image, Globe, FileSpreadsheet, Play, Shield, RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';
import { useApp } from '../context/AppContext';
import { StatusBadge } from '../components/StatusBadge';
import type { JobStep, StepStatus, ExecMode } from '../data/mockData';

// ─── Phase model ─────────────────────────────────────────────────────────────
interface Phase {
  id: string;
  label: string;
  subLabel: string;
  stepIds: string[];
}

const PHASES: Phase[] = [
  { id: 'login_prep', label: 'ログイン / 準備', subLabel: 'ログイン・施設切替', stepIds: ['login', 'facility_switch'] },
  { id: 'process_a', label: '処理A', subLabel: 'カレンダー設定', stepIds: ['step0', 'step_a'] },
  { id: 'process_b', label: '処理B', subLabel: '一括適用 (5050)', stepIds: ['step_b'] },
  { id: 'verify', label: '検証', subLabel: '出力・検証 (5070)', stepIds: ['step_c'] },
];

function computePhaseStatus(phase: Phase, steps: JobStep[], execMode: ExecMode): StepStatus {
  if (phase.id === 'process_a' && execMode === 'B_only') return 'skipped';
  if (phase.id === 'process_b' && execMode === 'A_only') return 'skipped';

  const phaseSteps = phase.stepIds.map(id => steps.find(s => s.id === id)).filter(Boolean) as JobStep[];
  if (phaseSteps.length === 0) return 'pending';
  if (phaseSteps.some(s => s.status === 'failed')) return 'failed';
  if (phaseSteps.some(s => s.status === 'running')) return 'running';
  if (phaseSteps.every(s => s.status === 'succeeded' || s.status === 'skipped')) return 'succeeded';
  return 'pending';
}

// ─── Simulation ───────────────────────────────────────────────────────────────
type SimPhase =
  | 'idle' | 'login_start' | 'awaiting_2fa' | 'login_done'
  | 'facility_switch' | 'step0' | 'step_a' | 'step_b' | 'step_c' | 'done';

const DURATIONS: Record<string, number> = {
  login_start: 2500, login_done: 800, facility_switch: 1200,
  step0: 3000, step_a: 2500, step_b: 4000, step_c: 3000,
};

// ─── Component ────────────────────────────────────────────────────────────────
export function JobDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { jobs, updateJob, updateJobStep, addJobLog } = useApp();
  const job = jobs.find(j => j.id === id);

  const [simPhase, setSimPhase] = useState<SimPhase>('idle');
  const [twoFACode, setTwoFACode] = useState('');
  const [showDetailLogs, setShowDetailLogs] = useState(false);
  const [showArtifacts, setShowArtifacts] = useState(true);
  const [showAbortModal, setShowAbortModal] = useState(false);
  const simRunning = useRef(false);

  // Start simulation when queued
  useEffect(() => {
    if (!job) return;
    if (job.status === 'queued' && simPhase === 'idle') {
      updateJob(id!, { status: 'running' });
      setSimPhase('login_start');
      simRunning.current = true;
    }
  }, [job?.status]);

  // Simulation state machine
  useEffect(() => {
    if (!job || !simRunning.current) return;
    if (simPhase === 'idle' || simPhase === 'awaiting_2fa' || simPhase === 'done') return;

    const now = new Date().toISOString();

    if (simPhase === 'login_start') {
      updateJobStep(id!, 'login', { status: 'running', attempts: 1, startedAt: now });
      addJobLog(id!, 'ログイン開始...');
      const t = setTimeout(() => {
        if (!simRunning.current) return;
        if (job.use2fa) {
          setSimPhase('awaiting_2fa');
          updateJob(id!, { status: 'awaiting_user' });
          addJobLog(id!, '2FA認証が要求されました。コードを入力してください。');
        } else {
          setSimPhase('login_done');
        }
      }, DURATIONS.login_start);
      return () => clearTimeout(t);
    }

    if (simPhase === 'login_done') {
      updateJobStep(id!, 'login', { status: 'succeeded', updatedAt: now });
      addJobLog(id!, 'ログイン成功');
      const t = setTimeout(() => simRunning.current && setSimPhase('facility_switch'), DURATIONS.login_done);
      return () => clearTimeout(t);
    }

    if (simPhase === 'facility_switch') {
      updateJobStep(id!, 'facility_switch', { status: 'running', attempts: 1, startedAt: now });
      addJobLog(id!, `施設切替: ${job.facilityId}...`);
      const t = setTimeout(() => {
        if (!simRunning.current) return;
        updateJobStep(id!, 'facility_switch', { status: 'succeeded', updatedAt: new Date().toISOString() });
        addJobLog(id!, `施設切替完了: ${job.facilityId}`);
        // Skip step0/step_a if B_only
        if (job.execMode === 'B_only') {
          updateJobStep(id!, 'step0', { status: 'skipped' });
          updateJobStep(id!, 'step_a', { status: 'skipped' });
          setSimPhase('step_b');
        } else {
          setSimPhase('step0');
        }
      }, DURATIONS.facility_switch);
      return () => clearTimeout(t);
    }

    if (simPhase === 'step0') {
      updateJobStep(id!, 'step0', { status: 'running', attempts: 1, startedAt: now });
      addJobLog(id!, 'Step0: カレンダーランクインポート (DOM注入)...');
      const t = setTimeout(() => {
        if (!simRunning.current) return;
        updateJobStep(id!, 'step0', { status: 'succeeded', updatedAt: new Date().toISOString() });
        addJobLog(id!, 'Step0: カレンダーランクインポート完了');
        setSimPhase('step_a');
      }, DURATIONS.step0);
      return () => clearTimeout(t);
    }

    if (simPhase === 'step_a') {
      updateJobStep(id!, 'step_a', { status: 'running', attempts: 1, startedAt: now });
      addJobLog(id!, 'StepA: コピー元カレンダー設定...');
      const t = setTimeout(() => {
        if (!simRunning.current) return;
        updateJobStep(id!, 'step_a', { status: 'succeeded', updatedAt: new Date().toISOString() });
        addJobLog(id!, 'StepA: コピー元カレンダー設定完了');
        // Skip step_b if A_only
        if (job.execMode === 'A_only') {
          updateJobStep(id!, 'step_b', { status: 'skipped' });
          setSimPhase('step_c');
        } else {
          setSimPhase('step_b');
        }
      }, DURATIONS.step_a);
      return () => clearTimeout(t);
    }

    if (simPhase === 'step_b') {
      updateJobStep(id!, 'step_b', { status: 'running', attempts: 1, startedAt: now });
      addJobLog(id!, 'StepB: 一括適用 (5050) 開始...');
      const t = setTimeout(() => {
        if (!simRunning.current) return;
        updateJobStep(id!, 'step_b', { status: 'succeeded', updatedAt: new Date().toISOString() });
        addJobLog(id!, 'StepB: 一括適用 (5050) 完了');
        setSimPhase('step_c');
      }, DURATIONS.step_b);
      return () => clearTimeout(t);
    }

    if (simPhase === 'step_c') {
      updateJobStep(id!, 'step_c', { status: 'running', attempts: 1, startedAt: now });
      addJobLog(id!, 'StepC: 出力・検証 (5070) 開始...');
      const t = setTimeout(() => {
        if (!simRunning.current) return;
        const updatedAt = new Date().toISOString();
        if (job.scenario === 'fail') {
          updateJobStep(id!, 'step_c', { status: 'failed', attempts: 3, updatedAt, errorMessage: '検証失敗: 1件の不一致が検出されました' });
          addJobLog(id!, 'ERROR: StepC 検証失敗 — 不一致を1件検出。完全一致のみ成功のため処理を停止しました。');
          updateJob(id!, {
            status: 'failed',
            failureReason: 'StepC (出力・検証) で検証エラー: 1件の不一致が検出されました。完全一致のみ成功のため処理を停止しました。',
            failureStep: 'StepC: Output & Verify (5070)',
          });
        } else {
          updateJobStep(id!, 'step_c', { status: 'succeeded', updatedAt });
          addJobLog(id!, 'StepC: 出力・検証 (5070) 完了 — 全件一致確認');
          updateJob(id!, {
            status: 'succeeded',
            artifacts: [
              { id: 'art1', name: 'screenshot_final.png', type: 'screenshot', url: '#', size: '312 KB' },
              { id: 'art2', name: `output_${job.facilityId}_result.xlsx`, type: 'excel', url: '#', size: '1.1 MB' },
              { id: 'art3', name: 'network_log.json', type: 'network', url: '#', size: '76 KB' },
              { id: 'art4', name: 'result_page.html', type: 'html', url: '#', size: '42 KB' },
            ],
          });
          toast.success('ジョブが正常に完了しました！');
        }
        setSimPhase('done');
        simRunning.current = false;
      }, DURATIONS.step_c);
      return () => clearTimeout(t);
    }
  }, [simPhase, job?.use2fa, job?.scenario]);

  function handleTwoFAResume() {
    if (!twoFACode.trim()) { toast.error('2FAコードを入力してください'); return; }
    addJobLog(id!, `2FAコード入力完了 (${twoFACode.replace(/./g, '*')})`);
    setTwoFACode('');
    updateJob(id!, { status: 'running' });
    setSimPhase('login_done');
    simRunning.current = true;
    toast.success('認証完了。処理を再開します...');
  }

  function handleResume() {
    if (!job) return;
    const failedStep = job.steps.find(s => s.status === 'failed');
    if (!failedStep) return;
    simRunning.current = true;
    updateJob(id!, { status: 'running', failureReason: undefined });
    updateJobStep(id!, failedStep.id, { status: 'pending', errorMessage: undefined });
    addJobLog(id!, `ジョブを再開します（${failedStep.nameJa} から）`);
    const phaseMap: Record<string, SimPhase> = {
      login: 'login_start', facility_switch: 'facility_switch',
      step0: 'step0', step_a: 'step_a', step_b: 'step_b', step_c: 'step_c',
    };
    setSimPhase(phaseMap[failedStep.id] ?? 'login_start');
    toast.info('ジョブを再開しました');
  }

  function handleAbort() {
    simRunning.current = false;
    setShowAbortModal(false);
    updateJob(id!, { status: 'failed', failureReason: 'ユーザーによるジョブ中止' });
    addJobLog(id!, 'ジョブがユーザーにより中止されました');
    setSimPhase('done');
    toast.warning('ジョブを中止しました');
  }

  if (!job) {
    return (
      <div className="p-8 text-center text-gray-400">
        <p>ジョブが見つかりません</p>
        <button onClick={() => navigate('/history')} className="mt-4 text-indigo-600 hover:underline text-sm">
          ジョブ履歴へ戻る
        </button>
      </div>
    );
  }

  const isActive = job.status === 'running' || job.status === 'awaiting_user';
  const execModeLabel = job.execMode === 'A_only' ? 'コピー元カレンダー反映のみ' : job.execMode === 'B_only' ? '料金ランク一括反映のみ' : '一括実行';

  return (
    <div className="p-8 max-w-[920px] mx-auto">
      {/* Back */}
      <button
        onClick={() => navigate('/history')}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6 transition-colors"
      >
        <ChevronLeft size={16} />
        ジョブ履歴へ戻る
      </button>

      {/* ── 2FA banner ── */}
      {job.status === 'awaiting_user' && (
        <div className="mb-6 p-5 bg-amber-50 border-2 border-amber-300 rounded-2xl">
          <div className="flex items-start gap-4 mb-4">
            <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0 animate-pulse">
              <Shield size={22} className="text-amber-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-amber-900">2FAコード入力が必要です</h2>
              <p className="text-sm text-amber-800 mt-1">
                リンカーンのログインで2要素認証が要求されました。以下の手順で入力してください。
              </p>
            </div>
          </div>
          <div className="bg-amber-100 rounded-xl p-4 mb-4 space-y-2">
            <div className="flex items-start gap-2 text-sm text-amber-900">
              <span className="w-5 h-5 bg-amber-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">1</span>
              <span>自動で開いたブラウザの2FA入力フォームに認証アプリのコードを入力してください</span>
            </div>
            <div className="flex items-start gap-2 text-sm text-amber-900">
              <span className="w-5 h-5 bg-amber-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">2</span>
              <span>ブラウザでログインが完了したら、下のフォームにコードを入力して「入力完了・再開」を押してください</span>
            </div>
          </div>
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="6桁の認証コードを入力..."
              value={twoFACode}
              onChange={e => setTwoFACode(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleTwoFAResume()}
              maxLength={8}
              className="flex-1 px-4 py-2.5 border-2 border-amber-300 rounded-xl text-lg font-mono text-center tracking-widest focus:outline-none focus:border-amber-500 bg-white"
            />
            <button
              onClick={handleTwoFAResume}
              className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-semibold text-sm transition-colors"
            >
              <Play size={14} />
              入力完了・再開
            </button>
          </div>
        </div>
      )}

      {/* ── Result banner ── */}
      {job.status === 'succeeded' && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-2xl flex items-center gap-4">
          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
            <CheckCircle size={22} className="text-green-600" />
          </div>
          <div className="flex-1">
            <h2 className="font-semibold text-green-800">ジョブ完了 — 成功</h2>
            <p className="text-sm text-green-700 mt-0.5">全ステップが正常に完了しました。リンカーンへの料金反映が完了しています。</p>
          </div>
          <button
            onClick={() => navigate('/jobs/new')}
            className="text-xs bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg font-medium transition-colors"
          >
            同じ条件で再実行
          </button>
        </div>
      )}

      {job.status === 'failed' && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-4">
          <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
            <XCircle size={22} className="text-red-600" />
          </div>
          <div className="flex-1">
            <h2 className="font-semibold text-red-800">ジョブ失敗 — FAILED</h2>
            <p className="text-sm text-red-700 mt-0.5">{job.failureReason}</p>
          </div>
          <button
            onClick={handleResume}
            className="flex items-center gap-1.5 text-xs bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg font-medium transition-colors flex-shrink-0"
          >
            <RotateCcw size={12} />
            再開（resume）
          </button>
        </div>
      )}

      {/* ── Header card ── */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-5">
        <div className="px-6 py-4 flex items-start justify-between border-b border-gray-100">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <StatusBadge status={job.status} size="md" />
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                {execModeLabel}
              </span>
              <span className="text-xs text-gray-300 font-mono">{job.id}</span>
            </div>
            <h1 className="text-xl font-semibold text-gray-900">{job.facilityName}</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {job.period.from} 〜 {job.period.to}　・　
              {job.environment === 'production' ? (
                <span className="text-red-600 font-medium">本番環境</span>
              ) : (
                <span className="text-blue-600 font-medium">検証環境</span>
              )}
            </p>
          </div>
          <div className="flex gap-2">
            {isActive && (
              <button
                onClick={() => setShowAbortModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 border border-red-200 text-red-600 hover:bg-red-50 rounded-lg text-xs font-medium transition-colors"
              >
                <StopCircle size={13} />
                ジョブを中止
              </button>
            )}
            {job.status === 'failed' && (
              <button
                onClick={handleResume}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-medium transition-colors"
              >
                <RefreshCw size={13} />
                再開（resume）
              </button>
            )}
          </div>
        </div>
        <div className="px-6 py-3 grid grid-cols-4 gap-6">
          <MetaItem label="実行者" value={job.createdBy} />
          <MetaItem label="処理Aパターン" value={job.patternAName ?? '—'} />
          <MetaItem label="処理Bパターン" value={job.patternBName ?? '—'} />
          <MetaItem label="処理Bマッピング数" value={job.processBRows.length > 0 ? `${job.processBRows.length} 件` : '—'} />
        </div>
      </div>

      {/* ── 4-Phase timeline (simplified) ── */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-5">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-800">実行ステップ</h3>
        </div>
        <div className="px-6 py-5">
          <div className="grid grid-cols-4 gap-3">
            {PHASES.map((phase, idx) => {
              const status = computePhaseStatus(phase, job.steps, job.execMode);
              const isSkipped = status === 'skipped';
              return (
                <PhaseChip
                  key={phase.id}
                  phase={phase}
                  status={status}
                  isSkipped={isSkipped}
                  stepNumber={idx + 1}
                />
              );
            })}
          </div>

          {/* Running phase detail */}
          {job.status === 'running' && (() => {
            const runningStep = job.steps.find(s => s.status === 'running');
            if (!runningStep) return null;
            return (
              <div className="mt-4 flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-xl">
                <Loader2 size={16} className="text-blue-500 animate-spin flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium text-blue-800">{runningStep.nameJa}</span>
                  <span className="text-xs text-blue-500 ml-2">実行中...</span>
                </div>
              </div>
            );
          })()}
        </div>

        {/* ── Detailed log accordion ── */}
        <div className="border-t border-gray-100">
          <button
            onClick={() => setShowDetailLogs(!showDetailLogs)}
            className="w-full px-6 py-3.5 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <span className="text-sm font-medium text-gray-600">詳細ログ（ステップ内訳）</span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">{job.steps.length}ステップ</span>
              {showDetailLogs ? <ChevronUp size={15} className="text-gray-400" /> : <ChevronDown size={15} className="text-gray-400" />}
            </div>
          </button>
          {showDetailLogs && (
            <div className="border-t border-gray-100 px-6 py-4 space-y-3">
              {job.steps.map(step => (
                <DetailStepRow
                  key={step.id}
                  step={step}
                  onRetry={() => {
                    if (job.status !== 'failed') return;
                    simRunning.current = true;
                    updateJob(id!, { status: 'running', failureReason: undefined });
                    updateJobStep(id!, step.id, { status: 'pending', errorMessage: undefined });
                    const phaseMap: Record<string, SimPhase> = {
                      login: 'login_start', facility_switch: 'facility_switch',
                      step0: 'step0', step_a: 'step_a', step_b: 'step_b', step_c: 'step_c',
                    };
                    setSimPhase(phaseMap[step.id] ?? 'login_start');
                    toast.info(`${step.nameJa} から再試行します`);
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Artifacts ── */}
      {job.artifacts.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-5">
          <button
            onClick={() => setShowArtifacts(!showArtifacts)}
            className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors rounded-xl"
          >
            <h3 className="font-semibold text-gray-800">成果物</h3>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">{job.artifacts.length}件</span>
              {showArtifacts ? <ChevronUp size={15} className="text-gray-400" /> : <ChevronDown size={15} className="text-gray-400" />}
            </div>
          </button>
          {showArtifacts && (
            <div className="border-t border-gray-100 p-4 grid grid-cols-2 gap-3">
              {job.artifacts.map(art => (
                <ArtifactCard key={art.id} artifact={art} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Raw logs ── */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold text-gray-800">実行ログ</h3>
          <span className="text-xs text-gray-400">{job.logs.length}行</span>
        </div>
        <div className="bg-gray-950 rounded-b-xl p-4 max-h-64 overflow-y-auto">
          {job.logs.map((log, i) => (
            <div
              key={i}
              className={`font-mono text-xs py-0.5 ${
                log.includes('ERROR') || log.includes('失敗') ? 'text-red-400' :
                log.includes('完了') || log.includes('成功') ? 'text-green-400' :
                log.includes('2FA') || log.includes('待ち') ? 'text-amber-400' :
                'text-gray-400'
              }`}
            >
              {log}
            </div>
          ))}
        </div>
      </div>

      {/* Abort modal */}
      {showAbortModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <StopCircle size={20} className="text-red-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">ジョブを中止しますか？</h3>
                <p className="text-sm text-gray-500">この操作は取り消せません</p>
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setShowAbortModal(false)}
                className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                キャンセル
              </button>
              <button
                onClick={handleAbort}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold transition-colors"
              >
                中止する
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function PhaseChip({ phase, status, isSkipped, stepNumber }: {
  phase: Phase; status: StepStatus; isSkipped: boolean; stepNumber: number;
}) {
  const cfg = {
    pending:   { bg: 'bg-gray-50',    border: 'border-gray-200',  dot: 'bg-gray-300',   text: 'text-gray-400',  label: '待機中' },
    running:   { bg: 'bg-blue-50',    border: 'border-blue-300',  dot: 'bg-blue-500',   text: 'text-blue-700',  label: '実行中' },
    succeeded: { bg: 'bg-green-50',   border: 'border-green-300', dot: 'bg-green-500',  text: 'text-green-700', label: '完了' },
    failed:    { bg: 'bg-red-50',     border: 'border-red-300',   dot: 'bg-red-500',    text: 'text-red-700',   label: '失敗' },
    skipped:   { bg: 'bg-gray-50',    border: 'border-gray-200',  dot: 'bg-gray-200',   text: 'text-gray-300',  label: 'スキップ' },
  }[status] ?? { bg: 'bg-gray-50', border: 'border-gray-200', dot: 'bg-gray-300', text: 'text-gray-400', label: '待機中' };

  return (
    <div className={`rounded-xl border-2 p-4 transition-all ${cfg.bg} ${cfg.border} ${isSkipped ? 'opacity-50' : ''}`}>
      <div className="flex items-start justify-between mb-2">
        <span className="text-xs text-gray-400 font-medium">STEP {stepNumber}</span>
        <div className={`flex items-center gap-1 text-xs font-semibold ${cfg.text}`}>
          {status === 'running' && <Loader2 size={11} className="animate-spin" />}
          {status === 'succeeded' && <CheckCircle size={11} />}
          {status === 'failed' && <XCircle size={11} />}
          {status === 'pending' && <Clock size={11} />}
          <span>{cfg.label}</span>
        </div>
      </div>
      <div className={`text-sm font-semibold ${isSkipped ? 'text-gray-300' : 'text-gray-800'}`}>
        {phase.label}
      </div>
      <div className={`text-xs mt-0.5 ${isSkipped ? 'text-gray-300' : 'text-gray-500'}`}>
        {phase.subLabel}
      </div>
    </div>
  );
}

function DetailStepRow({ step, onRetry }: { step: JobStep; onRetry: () => void }) {
  const statusColors: Record<string, string> = {
    pending: 'text-gray-400 bg-gray-100',
    running: 'text-blue-700 bg-blue-100',
    succeeded: 'text-green-700 bg-green-100',
    failed: 'text-red-700 bg-red-100',
    skipped: 'text-gray-300 bg-gray-50',
  };

  return (
    <div className={`flex items-start gap-3 py-2 ${step.status === 'skipped' ? 'opacity-40' : ''}`}>
      <div className={`mt-0.5 text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${statusColors[step.status]}`}>
        {step.status === 'running' && <span className="flex items-center gap-1"><Loader2 size={10} className="animate-spin" />実行中</span>}
        {step.status === 'succeeded' && '✓ 完了'}
        {step.status === 'pending' && '待機'}
        {step.status === 'failed' && '✗ 失敗'}
        {step.status === 'skipped' && 'スキップ'}
      </div>
      <div className="flex-1 min-w-0">
        <div className={`text-sm font-medium ${step.status === 'failed' ? 'text-red-700' : 'text-gray-700'}`}>
          {step.nameJa}
        </div>
        <div className="flex items-center gap-3 mt-0.5">
          <span className="text-xs text-gray-400">{step.name}</span>
          {step.attempts > 0 && <span className="text-xs text-gray-400">試行 {step.attempts}回</span>}
          {step.updatedAt && (
            <span className="text-xs text-gray-400">
              {new Date(step.updatedAt).toLocaleTimeString('ja-JP')}
            </span>
          )}
        </div>
        {step.errorMessage && (
          <div className="mt-1.5 flex items-center gap-1.5 text-xs text-red-600 bg-red-50 border border-red-200 px-3 py-1.5 rounded-lg">
            <AlertTriangle size={11} className="flex-shrink-0" />
            {step.errorMessage}
          </div>
        )}
      </div>
      {step.status === 'failed' && (
        <button
          onClick={onRetry}
          className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 border border-indigo-200 hover:border-indigo-400 px-2.5 py-1 rounded-lg transition-colors flex-shrink-0"
        >
          <RotateCcw size={11} />
          このステップから再試行
        </button>
      )}
    </div>
  );
}

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-gray-400 mb-0.5">{label}</div>
      <div className="text-sm font-medium text-gray-800">{value}</div>
    </div>
  );
}

const ARTIFACT_ICONS: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  screenshot: Image, html: Globe, network: FileText, excel: FileSpreadsheet,
};
const ARTIFACT_COLORS: Record<string, string> = {
  screenshot: 'bg-purple-100 text-purple-600', html: 'bg-blue-100 text-blue-600',
  network: 'bg-gray-100 text-gray-600', excel: 'bg-green-100 text-green-600',
};

function ArtifactCard({ artifact }: { artifact: { id: string; name: string; type: string; url: string; size: string } }) {
  const Icon = ARTIFACT_ICONS[artifact.type] ?? FileText;
  return (
    <a
      href={artifact.url}
      onClick={e => { e.preventDefault(); toast.info(`${artifact.name} のダウンロードは本番環境でのみ利用可能です`); }}
      className="flex items-center gap-3 p-3 border border-gray-200 rounded-xl hover:border-indigo-300 hover:bg-indigo-50/50 transition-colors group"
    >
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${ARTIFACT_COLORS[artifact.type]}`}>
        <Icon size={16} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-gray-800 truncate">{artifact.name}</div>
        <div className="text-xs text-gray-400">{artifact.size}</div>
      </div>
      <Download size={14} className="text-gray-300 group-hover:text-indigo-500 transition-colors flex-shrink-0" />
    </a>
  );
}