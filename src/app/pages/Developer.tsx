import { useState } from 'react';
import { Code2, CheckCircle, XCircle, Loader2, AlertTriangle, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';
import { SELECTORS } from '../data/mockData';

type DiagResult = { selector: string; status: 'ok' | 'ng' | 'checking' } | null;

export function Developer() {
  const [diagResults, setDiagResults] = useState<Record<string, 'ok' | 'ng' | 'checking'>>({});
  const [isDiagRunning, setIsDiagRunning] = useState(false);
  const [copiedSelector, setCopiedSelector] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'known' | 'tbd'>('all');

  function runDiagnosis() {
    setIsDiagRunning(true);
    const init: Record<string, 'checking'> = {};
    SELECTORS.forEach(s => (init[s.selector] = 'checking'));
    setDiagResults(init);

    // Simulate checking each selector with delays
    SELECTORS.forEach((sel, i) => {
      setTimeout(() => {
        // Known selectors pass, TBD selectors fail
        const result: 'ok' | 'ng' = sel.status === 'known' ? 'ok' : 'ng';
        setDiagResults(prev => ({ ...prev, [sel.selector]: result }));
        if (i === SELECTORS.length - 1) {
          setIsDiagRunning(false);
          const okCount = SELECTORS.filter(s => s.status === 'known').length;
          const ngCount = SELECTORS.filter(s => s.status === 'tbd').length;
          toast.success(`診断完了: OK ${okCount}件 / NG ${ngCount}件`);
        }
      }, (i + 1) * 400);
    });
  }

  function copySelector(selector: string) {
    navigator.clipboard.writeText(selector).catch(() => {});
    setCopiedSelector(selector);
    setTimeout(() => setCopiedSelector(null), 2000);
    toast.success('クリップボードにコピーしました');
  }

  const filtered = SELECTORS.filter(s => filterStatus === 'all' || s.status === filterStatus);

  const knownCount = SELECTORS.filter(s => s.status === 'known').length;
  const tbdCount = SELECTORS.filter(s => s.status === 'tbd').length;

  return (
    <div className="p-8 max-w-[1060px] mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <h1 className="text-2xl font-semibold text-gray-900">開発者向けツール</h1>
          <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full font-medium">
            エンジニアのみ
          </span>
        </div>
        <p className="text-sm text-gray-500">セレクタ一覧の確認・診断ツール</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="text-xs text-gray-500 mb-1">総セレクタ数</div>
          <div className="text-2xl font-semibold text-gray-900">{SELECTORS.length}</div>
        </div>
        <div className="bg-green-50 rounded-xl border border-green-200 p-4">
          <div className="text-xs text-green-600 mb-1">Known（確認済み）</div>
          <div className="text-2xl font-semibold text-green-700">{knownCount}</div>
        </div>
        <div className="bg-amber-50 rounded-xl border border-amber-200 p-4">
          <div className="text-xs text-amber-600 mb-1">TBD（要確認）</div>
          <div className="text-2xl font-semibold text-amber-700">{tbdCount}</div>
        </div>
      </div>

      {/* Selector list */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-6">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
          <h2 className="text-base font-semibold text-gray-800 flex-1">セレクタ一覧</h2>
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
            {[
              { value: 'all', label: 'すべて' },
              { value: 'known', label: 'Known' },
              { value: 'tbd', label: 'TBD' },
            ].map(f => (
              <button
                key={f.value}
                onClick={() => setFilterStatus(f.value as 'all' | 'known' | 'tbd')}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                  filterStatus === f.value ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Table header */}
        <div className="grid grid-cols-[80px_140px_80px_1fr_60px_60px] px-6 py-2.5 bg-gray-50/50 border-b border-gray-100 text-xs font-medium text-gray-500">
          <div>ステータス</div>
          <div>画面</div>
          <div>アクション</div>
          <div>セレクタ</div>
          <div>診断</div>
          <div></div>
        </div>

        <div className="divide-y divide-gray-50">
          {filtered.map((sel, i) => {
            const diagResult = diagResults[sel.selector];
            return (
              <div key={i} className="grid grid-cols-[80px_140px_80px_1fr_60px_60px] items-center px-6 py-3.5 hover:bg-gray-50 transition-colors">
                {/* Status */}
                <div>
                  {sel.status === 'known' ? (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">Known</span>
                  ) : (
                    <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">TBD</span>
                  )}
                </div>

                {/* Screen */}
                <div className="text-sm font-medium text-gray-700">{sel.screen}</div>

                {/* Action */}
                <div className="text-xs text-gray-500 font-mono">{sel.action}</div>

                {/* Selector */}
                <div className="pr-4">
                  <code className="text-xs bg-gray-900 text-green-400 px-3 py-1.5 rounded-lg block font-mono break-all">
                    {sel.selector}
                  </code>
                  {sel.notes && (
                    <div className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                      <AlertTriangle size={10} />
                      {sel.notes}
                    </div>
                  )}
                </div>

                {/* Diag result */}
                <div className="flex items-center justify-center">
                  {diagResult === 'checking' && <Loader2 size={16} className="text-blue-500 animate-spin" />}
                  {diagResult === 'ok' && <CheckCircle size={16} className="text-green-500" />}
                  {diagResult === 'ng' && <XCircle size={16} className="text-red-500" />}
                  {!diagResult && <span className="text-gray-300 text-xs">—</span>}
                </div>

                {/* Copy */}
                <div className="flex justify-end">
                  <button
                    onClick={() => copySelector(sel.selector)}
                    className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                    title="セレクタをコピー"
                  >
                    {copiedSelector === sel.selector ? (
                      <Check size={13} className="text-green-500" />
                    ) : (
                      <Copy size={13} />
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Diagnosis */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-6 py-5">
          <h2 className="text-base font-semibold text-gray-800 mb-1">診断ツール</h2>
          <p className="text-sm text-gray-500 mb-4">
            リンカーンの画面上で各セレクタの要素が存在するかをチェックします（モック）
          </p>

          <div className="flex items-center gap-4">
            <button
              onClick={runDiagnosis}
              disabled={isDiagRunning}
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white rounded-lg text-sm font-medium transition-colors"
            >
              {isDiagRunning ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <Code2 size={15} />
              )}
              {isDiagRunning ? '診断実行中...' : '診断実行（要素存在チェック）'}
            </button>

            {Object.keys(diagResults).length > 0 && !isDiagRunning && (
              <div className="flex items-center gap-3 text-sm">
                <span className="flex items-center gap-1 text-green-600">
                  <CheckCircle size={14} />
                  OK: {Object.values(diagResults).filter(v => v === 'ok').length}件
                </span>
                <span className="flex items-center gap-1 text-red-600">
                  <XCircle size={14} />
                  NG: {Object.values(diagResults).filter(v => v === 'ng').length}件
                </span>
              </div>
            )}
          </div>

          {Object.keys(diagResults).length > 0 && !isDiagRunning && (
            <div className="mt-4 p-4 bg-gray-50 rounded-xl">
              <p className="text-xs font-semibold text-gray-500 mb-2">診断結果</p>
              <div className="space-y-1.5">
                {SELECTORS.map((sel, i) => {
                  const result = diagResults[sel.selector];
                  return (
                    <div key={i} className="flex items-center gap-3">
                      {result === 'ok' ? (
                        <CheckCircle size={13} className="text-green-500 flex-shrink-0" />
                      ) : (
                        <XCircle size={13} className="text-red-500 flex-shrink-0" />
                      )}
                      <code className="text-xs font-mono text-gray-600">{sel.selector}</code>
                      <span className={`text-xs font-medium ${result === 'ok' ? 'text-green-600' : 'text-red-600'}`}>
                        {result === 'ok' ? 'OK' : 'NG'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
