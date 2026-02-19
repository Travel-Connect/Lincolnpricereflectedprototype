import * as React from 'react';
import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router';
import {
  Upload, CheckCircle, ChevronRight, ChevronLeft, X, RefreshCw,
  FileSpreadsheet, Building2, AlertTriangle, Info, Loader2,
  Plus, Trash2, Save, Star, ChevronDown, Zap, Search, LogIn, XCircle, ShieldCheck,
} from 'lucide-react';
import { toast } from 'sonner';
import { useApp } from '../context/AppContext';
import {
  FACILITIES, CALENDARS, PLAN_GROUPS, EXCEL_CALENDARS,
  createDefaultSteps,
  type Facility, type ExecMode, type CalendarMappingRow, type ProcessBMappingRow,
  type CalendarPattern, type ProcessBPattern,
} from '../data/mockData';

// ─── Types ───────────────────────────────────────────────────────────────────
type Screen = 1 | 2 | 3;

interface UploadedFile {
  name: string;
  size: string;
  period: string;
  cellCount: number;
  createdAt: string;
}

interface CalMapRow {
  id: string;
  excelName: string;
  lincolnCalId: string;
}

interface ProcBRow {
  id: string;
  calId: string;
  groupId: string;
  planId: string;
}

// ─── Helper ──────────────────────────────────────────────────────────────────
function uid() {
  return Math.random().toString(36).slice(2);
}

function excelRowsFromMappings(mappings: CalendarMappingRow[]): CalMapRow[] {
  return EXCEL_CALENDARS.map(name => {
    const found = mappings.find(m => m.excelCalendarName === name);
    return { id: uid(), excelName: name, lincolnCalId: found?.lincolnCalendarId ?? '' };
  });
}

function defaultCalRows(): CalMapRow[] {
  return EXCEL_CALENDARS.map(name => ({ id: uid(), excelName: name, lincolnCalId: '' }));
}

function defaultBRows(): ProcBRow[] {
  return [{ id: uid(), calId: '', groupId: '', planId: '' }];
}

// ─── Main Component ──────────────────────────────────────────────────────────
export function NewJob() {
  const navigate = useNavigate();
  const {
    addJob, currentAccount, currentEnvironment,
    calendarPatterns, processBPatterns,
    addCalendarPattern, updateCalendarPattern,
    addProcessBPattern, updateProcessBPattern,
  } = useApp();

  const [screen, setScreen] = useState<Screen>(1);
  const [execMode, setExecMode] = useState<ExecMode>('A_and_B');

  // File upload
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Facility
  const [facility, setFacility] = useState<Facility | null>(FACILITIES[0]);
  const [facilityOpen, setFacilityOpen] = useState(false);
  const [facilitySearch, setFacilitySearch] = useState('');

  // Login test
  type LoginTestStatus = 'idle' | 'testing' | 'awaiting_2fa' | 'success' | 'fail';
  const [loginTestStatus, setLoginTestStatus] = useState<LoginTestStatus>('idle');
  const [loginTestCode, setLoginTestCode] = useState('');

  // Process A
  const [calRows, setCalRows] = useState<CalMapRow[]>(defaultCalRows);
  const [calLoading, setCalLoading] = useState(false);
  const [calLoaded, setCalLoaded] = useState(false);
  const [selectedPatAId, setSelectedPatAId] = useState('');
  const [patASaveName, setPatASaveName] = useState('');
  const [patASaveOpen, setPatASaveOpen] = useState(false);

  // Process B
  const [bRows, setBRows] = useState<ProcBRow[]>(defaultBRows);
  const [plansLoading, setPlansLoading] = useState(false);
  const [plansLoaded, setPlansLoaded] = useState(false);
  const [lastFetchedAt, setLastFetchedAt] = useState<string | null>(null);
  const [selectedPatBId, setSelectedPatBId] = useState('');
  const [patBSaveName, setPatBSaveName] = useState('');
  const [patBSaveOpen, setPatBSaveOpen] = useState(false);

  // Final
  const [retryCount, setRetryCount] = useState(3);
  const [scenario, setScenario] = useState<'success' | 'fail'>('success');
  const [use2fa, setUse2fa] = useState(false);

  // ── Derived ────────────────────────────────────────────────────────────────
  const facilityPatAs = calendarPatterns.filter(p => p.facilityId === (facility?.id ?? ''));
  const facilityPatBs = processBPatterns.filter(p => p.facilityId === (facility?.id ?? ''));
  const filteredFacilities = FACILITIES.filter(
    f => f.active && (
      f.name.includes(facilitySearch) || f.id.includes(facilitySearch)
    ),
  );

  // ── File Upload ─────────────────────────────────────────────────────────────
  function simulateAnalysis(fileName: string) {
    setIsAnalyzing(true);
    setUploadedFile(null);
    setTimeout(() => {
      setIsAnalyzing(false);
      setUploadedFile({
        name: fileName,
        size: '2.4 MB',
        period: '2024年7月1日 〜 2024年9月30日',
        cellCount: 1248,
        createdAt: new Date().toLocaleDateString('ja-JP'),
      });
    }, 1800);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) simulateAnalysis(file.name);
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) simulateAnalysis(file.name);
  }

  // ── Login Test ─────────────────────────────────────────────────────────────
  function handleLoginTest() {
    if (!facility) return;
    setLoginTestStatus('testing');
    setLoginTestCode('');
    setTimeout(() => {
      if (facility.has2fa) {
        setLoginTestStatus('awaiting_2fa');
      } else {
        setLoginTestStatus('success');
        toast.success(`リンカーン（${facility.name}）へのログインに成功しました`);
      }
    }, 2200);
  }

  function handleLoginTestSubmit2fa() {
    if (!loginTestCode.trim()) { toast.error('2FAコードを入力してください'); return; }
    setLoginTestStatus('testing');
    setTimeout(() => {
      setLoginTestStatus('success');
      toast.success(`リンカーン（${facility?.name}）へのログインに成功しました（2FA済み）`);
    }, 1200);
  }

  function resetLoginTest() {
    setLoginTestStatus('idle');
    setLoginTestCode('');
  }

  // ── Process A ──────────────────────────────────────────────────────────────
  function fetchCalendars() {
    setCalLoading(true);
    setTimeout(() => {
      setCalLoading(false);
      setCalLoaded(true);
      toast.success('カレンダー一覧を取得しました（12件）');
    }, 1500);
  }

  function applyPatternA(patId: string) {
    setSelectedPatAId(patId);
    const pat = facilityPatAs.find(p => p.id === patId);
    if (!pat) return;
    setCalRows(excelRowsFromMappings(pat.mappings));
    toast.success(`パターン「${pat.name}」を適用しました`);
  }

  function savePatternA(name: string) {
    if (!name.trim() || !facility) return;
    const id = 'pat_a_' + uid();
    const newPat: CalendarPattern = {
      id,
      name: name.trim(),
      facilityId: facility.id,
      isDefault: false,
      mappings: calRows.map(r => ({ excelCalendarName: r.excelName, lincolnCalendarId: r.lincolnCalId })),
    };
    addCalendarPattern(newPat);
    setSelectedPatAId(id);
    toast.success(`パターン「${name.trim()}」を保存しました`);
  }

  function saveOverPatternA() {
    if (!selectedPatAId) { toast.error('上書き対象のパターンを選択してください'); return; }
    updateCalendarPattern(selectedPatAId, {
      mappings: calRows.map(r => ({ excelCalendarName: r.excelName, lincolnCalendarId: r.lincolnCalId })),
    });
    toast.success('パターンを上書き保存しました');
  }

  function setDefaultPatternA() {
    if (!selectedPatAId || !facility) { toast.error('パターンを選択してください'); return; }
    facilityPatAs.forEach(p => {
      updateCalendarPattern(p.id, { isDefault: p.id === selectedPatAId });
    });
    toast.success('デフォルトパターンを設定しました');
  }

  function updateCalRow(id: string, lincolnCalId: string) {
    setCalRows(prev => prev.map(r => r.id === id ? { ...r, lincolnCalId } : r));
  }

  // ── Process B ──────────────────────────────────────────────────────────────
  function fetchPlans() {
    setPlansLoading(true);
    setTimeout(() => {
      setPlansLoading(false);
      setPlansLoaded(true);
      setLastFetchedAt(new Date().toLocaleTimeString('ja-JP'));
      // Apply default pattern if available
      const defPat = facilityPatBs.find(p => p.isDefault);
      if (defPat && bRows.length === 1 && !bRows[0].calId) {
        applyPatternB(defPat.id);
      }
      toast.success('プラングループ・プランを取得しました（5グループ）');
    }, 2000);
  }

  function applyPatternB(patId: string) {
    setSelectedPatBId(patId);
    const pat = facilityPatBs.find(p => p.id === patId);
    if (!pat) return;
    setBRows(pat.rows.map(r => ({ id: uid(), calId: r.copySourceCalId, groupId: r.planGroupId, planId: r.planId })));
    toast.success(`パターン「${pat.name}」を適用しました`);
  }

  function savePatternB(name: string) {
    if (!name.trim() || !facility) return;
    const id = 'pat_b_' + uid();
    const newPat: ProcessBPattern = {
      id,
      name: name.trim(),
      facilityId: facility.id,
      isDefault: false,
      rows: bRows.map(r => ({ id: uid(), copySourceCalId: r.calId, planGroupId: r.groupId, planId: r.planId })),
    };
    addProcessBPattern(newPat);
    setSelectedPatBId(id);
    toast.success(`パターン「${name.trim()}」を保存しました`);
  }

  function saveOverPatternB() {
    if (!selectedPatBId) { toast.error('上書き対象のパターンを選択してください'); return; }
    updateProcessBPattern(selectedPatBId, {
      rows: bRows.map(r => ({ id: uid(), copySourceCalId: r.calId, planGroupId: r.groupId, planId: r.planId })),
    });
    toast.success('パターンを上書き保存しました');
  }

  function setDefaultPatternB() {
    if (!selectedPatBId || !facility) { toast.error('パターンを選択してください'); return; }
    facilityPatBs.forEach(p => {
      updateProcessBPattern(p.id, { isDefault: p.id === selectedPatBId });
    });
    toast.success('デフォルトパターンを設定しました');
  }

  function updateBRow(idx: number, field: keyof ProcBRow, value: string) {
    setBRows(prev => prev.map((r, i) => {
      if (i !== idx) return r;
      const updated = { ...r, [field]: value };
      if (field === 'groupId') updated.planId = ''; // reset plan when group changes
      return updated;
    }));
  }

  function addBRow() {
    setBRows(prev => [...prev, { id: uid(), calId: '', groupId: '', planId: '' }]);
  }

  function deleteBRow(idx: number) {
    setBRows(prev => prev.filter((_, i) => i !== idx));
  }

  // ── Navigation ─────────────────────────────────────────────────────────────
  function goNext() {
    if (screen === 1) {
      if (execMode === 'A_only') setScreen(3);
      else setScreen(2);
    } else if (screen === 2) {
      setScreen(3);
    }
  }

  function goBack() {
    if (screen === 3) {
      if (execMode === 'A_only') setScreen(1);
      else setScreen(2);
    } else if (screen === 2) {
      setScreen(1);
    }
  }

  function canGoNext() {
    if (screen === 1) {
      if (!uploadedFile || !facility) return false;
      // Process A: at least 1 mapping required (if calendars have been fetched)
      if ((execMode === 'A_only' || execMode === 'A_and_B') && calLoaded) {
        return calRows.some(r => r.lincolnCalId);
      }
      return true;
    }
    if (screen === 2) return bRows.length > 0;
    return true;
  }

  // ── Execute ────────────────────────────────────────────────────────────────
  function handleExecute() {
    const id = `job-${Date.now()}`;
    const selectedPatA = facilityPatAs.find(p => p.id === selectedPatAId);
    const selectedPatB = facilityPatBs.find(p => p.id === selectedPatBId);

    const steps = createDefaultSteps();
    // Mark skipped steps based on execMode
    if (execMode === 'B_only') {
      const s = steps.find(s => s.id === 'step0'); if (s) s.status = 'skipped';
      const s2 = steps.find(s => s.id === 'step_a'); if (s2) s2.status = 'skipped';
    }
    if (execMode === 'A_only') {
      const s = steps.find(s => s.id === 'step_b'); if (s) s.status = 'skipped';
    }

    addJob({
      id,
      status: 'queued',
      execMode,
      facilityId: facility!.id,
      facilityName: facility!.name,
      period: { from: '2024-07-01', to: '2024-09-30' },
      calendarMappings: calRows.map(r => ({ excelCalendarName: r.excelName, lincolnCalendarId: r.lincolnCalId })),
      patternAName: selectedPatA?.name,
      processBRows: bRows.map(r => ({ id: uid(), copySourceCalId: r.calId, planGroupId: r.groupId, planId: r.planId })),
      patternBName: selectedPatB?.name,
      retryCount,
      environment: currentEnvironment,
      createdAt: new Date().toISOString(),
      createdBy: currentAccount,
      updatedAt: new Date().toISOString(),
      steps,
      logs: [`[${new Date().toLocaleTimeString('ja-JP')}] ジョブをキューに追加しました`],
      artifacts: [],
      scenario,
      use2fa,
    });
    toast.success('ジョブを作成しました。実行を開始します...');
    navigate(`/jobs/${id}`);
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  const screenTitles: Record<Screen, string> = {
    1: '画面1：ファイルアップロード & 処理A設定',
    2: '画面2：処理B 料金ランク一括設定',
    3: '画面3：最終確認・実行開始',
  };

  const totalScreens = execMode === 'A_only' || execMode === 'B_only' ? 2 : 3;
  const currentScreenNum = screen === 3 ? totalScreens : screen === 2 ? 2 : 1;

  return (
    <div className="p-8 max-w-[960px] mx-auto">
      {/* Page header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-sm text-gray-400 mb-1">
          <span>新規ジョブ</span>
          <ChevronRight size={14} />
          <span className="text-gray-700">{screenTitles[screen]}</span>
        </div>
        <h1 className="text-2xl font-semibold text-gray-900">新規ジョブ作成</h1>
        <p className="text-sm text-gray-500 mt-1">
          画面 {currentScreenNum} / {totalScreens}
        </p>
      </div>

      {/* Screen progress */}
      <ScreenProgress screen={screen} execMode={execMode} />

      {/* ════════════════════════════════════════════════════════════
          SCREEN 1: ファイルアップロード + 処理A
      ════════════════════════════════════════════════════════════ */}
      {screen === 1 && (
        <div className="space-y-5">
          {/* ① Mode selection */}
          <Card title="① 実行モード選択" subtitle="処理内容を選択してください">
            <div className="grid grid-cols-3 gap-3">
              {([
                { value: 'A_only', label: 'コピー元カレンダー反映のみ', sub: 'ExcelのカレンダーをLincoln側へ紐づけて反映します', color: 'blue' },
                { value: 'B_only', label: '料金ランク一括反映のみ', sub: 'プランへ料金ランクを一括で書き込みます', color: 'purple' },
                { value: 'A_and_B', label: '一括実行', sub: 'カレンダー紐づけ＋料金ランク反映を連続実行（標準）', color: 'indigo' },
              ] as const).map(opt => (
                <label
                  key={opt.value}
                  className={`relative flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-colors ${
                    execMode === opt.value
                      ? opt.color === 'blue' ? 'border-blue-400 bg-blue-50'
                        : opt.color === 'purple' ? 'border-purple-400 bg-purple-50'
                        : 'border-indigo-400 bg-indigo-50'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <input
                    type="radio"
                    name="execMode"
                    value={opt.value}
                    checked={execMode === opt.value}
                    onChange={() => setExecMode(opt.value)}
                    className="mt-0.5 flex-shrink-0"
                  />
                  <div>
                    <div className={`text-sm font-semibold ${execMode === opt.value ? 'text-gray-900' : 'text-gray-700'}`}>
                      {opt.label}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">{opt.sub}</div>
                  </div>
                  {execMode === opt.value && (
                    <CheckCircle size={15} className="absolute top-3 right-3 text-indigo-500" />
                  )}
                </label>
              ))}
            </div>
          </Card>

          {/* ② File upload */}
          <Card title="② ファイルアップロード" subtitle="料金データが入ったExcelファイルをアップロードしてください">
            {!uploadedFile && !isAnalyzing ? (
              <div
                onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${
                  isDragging ? 'border-indigo-400 bg-indigo-50' : 'border-gray-300 hover:border-indigo-400 hover:bg-gray-50'
                }`}
              >
                <Upload size={28} className="mx-auto mb-3 text-gray-300" />
                <p className="text-gray-600 font-medium text-sm mb-1">ファイルをドロップ、またはクリックして選択</p>
                <p className="text-xs text-gray-400">.xlsx / .xls 対応</p>
                <input ref={fileInputRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleFileInput} />
              </div>
            ) : isAnalyzing ? (
              <div className="border-2 border-dashed border-gray-200 rounded-xl p-10 text-center">
                <Loader2 size={28} className="mx-auto mb-3 text-indigo-500 animate-spin" />
                <p className="text-gray-600 font-medium text-sm">ファイルを解析中...</p>
                <p className="text-xs text-gray-400 mt-1">施設・期間・セル数を確認しています</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-start gap-4 p-4 bg-green-50 border border-green-200 rounded-xl">
                  <div className="w-9 h-9 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FileSpreadsheet size={18} className="text-green-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900 text-sm truncate">{uploadedFile!.name}</span>
                      <CheckCircle size={13} className="text-green-500 flex-shrink-0" />
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">{uploadedFile!.size}</div>
                  </div>
                  <button onClick={() => setUploadedFile(null)} className="text-gray-400 hover:text-gray-600">
                    <X size={15} />
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <InfoCard label="検出期間" value={uploadedFile!.period} />
                  <InfoCard label="検出件数" value={`${uploadedFile!.cellCount.toLocaleString()} セル`} />
                  <InfoCard label="作成日" value={uploadedFile!.createdAt} />
                </div>
              </div>
            )}
          </Card>

          {/* ③ Facility */}
          <Card title="③ 対象施設" subtitle="反映先の施設を確認・変更してください">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                {facility ? (
                  <div className="flex items-center gap-3 p-3 bg-indigo-50 border border-indigo-200 rounded-xl">
                    <Building2 size={16} className="text-indigo-500 flex-shrink-0" />
                    <div className="flex-1">
                      <span className="font-semibold text-gray-900 text-sm">{facility.name}</span>
                      <span className="text-gray-400 text-xs ml-2">({facility.id})</span>
                      {facility.has2fa && (
                        <span className="ml-2 text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">2FA</span>
                      )}
                    </div>
                    <span className="text-xs text-gray-400">{facility.estimatedTime}</span>
                  </div>
                ) : (
                  <div className="p-3 bg-gray-50 border border-dashed border-gray-300 rounded-xl text-sm text-gray-400 text-center">
                    施設を選択してください
                  </div>
                )}
              </div>
              <div className="relative">
                <button
                  onClick={() => setFacilityOpen(!facilityOpen)}
                  className="flex items-center gap-1.5 px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  施設を変更する
                  <ChevronDown size={14} />
                </button>
                {facilityOpen && (
                  <div className="absolute right-0 top-full mt-1 w-72 bg-white border border-gray-200 rounded-xl shadow-lg z-20">
                    <div className="p-2 border-b border-gray-100">
                      <div className="relative">
                        <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          placeholder="施設名・IDで検索..."
                          value={facilitySearch}
                          onChange={e => setFacilitySearch(e.target.value)}
                          className="w-full pl-7 pr-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>
                    </div>
                    <div className="max-h-48 overflow-y-auto py-1">
                      {filteredFacilities.map(f => (
                        <button
                          key={f.id}
                          onClick={() => { setFacility(f); setFacilityOpen(false); setFacilitySearch(''); resetLoginTest(); }}
                          className={`w-full text-left flex items-center justify-between px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors ${
                            facility?.id === f.id ? 'text-indigo-700 bg-indigo-50/50' : 'text-gray-700'
                          }`}
                        >
                          <div>
                            <span className="font-medium">{f.name}</span>
                            <span className="text-gray-400 text-xs ml-2">({f.id})</span>
                          </div>
                          {f.has2fa && <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">2FA</span>}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            {facility?.notes && (
              <div className="mt-3 flex items-start gap-2 text-xs text-amber-800 bg-amber-50 border border-amber-200 px-3 py-2 rounded-lg">
                <AlertTriangle size={12} className="mt-0.5 flex-shrink-0" />
                {facility.notes}
              </div>
            )}

            {/* ── Login Test ── */}
            {facility && (
              <div className="mt-4 border-t border-gray-100 pt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">ログイン確認</span>
                  {loginTestStatus !== 'idle' && (
                    <button onClick={resetLoginTest} className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
                      リセット
                    </button>
                  )}
                </div>

                {loginTestStatus === 'idle' && (
                  <button
                    onClick={handleLoginTest}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-indigo-50 border border-gray-200 hover:border-indigo-300 text-gray-700 hover:text-indigo-700 rounded-lg text-sm font-medium transition-all"
                  >
                    <LogIn size={14} />
                    ログイン確認を実行
                  </button>
                )}

                {loginTestStatus === 'testing' && (
                  <div className="flex items-center gap-3 px-4 py-2.5 bg-blue-50 border border-blue-200 rounded-lg">
                    <Loader2 size={15} className="text-blue-500 animate-spin flex-shrink-0" />
                    <span className="text-sm text-blue-700">
                      リンカーン（{facility.name}）へログイン確認中...
                    </span>
                  </div>
                )}

                {loginTestStatus === 'awaiting_2fa' && (
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-3">
                    <div className="flex items-center gap-2">
                      <ShieldCheck size={15} className="text-amber-600 flex-shrink-0" />
                      <span className="text-sm font-medium text-amber-800">2FA認証コードを入力してください</span>
                    </div>
                    <p className="text-xs text-amber-700">
                      自動で開いたブラウザの2FAフォームにコードを入力してから、同じコードを下に入力してください。
                    </p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="6桁のコード..."
                        value={loginTestCode}
                        onChange={e => setLoginTestCode(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleLoginTestSubmit2fa()}
                        maxLength={8}
                        className="flex-1 px-3 py-2 border border-amber-300 rounded-lg text-sm font-mono tracking-widest text-center focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
                      />
                      <button
                        onClick={handleLoginTestSubmit2fa}
                        className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-sm font-medium transition-colors"
                      >
                        <LogIn size={13} />
                        認証して続行
                      </button>
                    </div>
                  </div>
                )}

                {loginTestStatus === 'success' && (
                  <div className="flex items-center justify-between px-4 py-2.5 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <CheckCircle size={15} className="text-green-500 flex-shrink-0" />
                      <span className="text-sm font-medium text-green-700">ログイン成功</span>
                      <span className="text-xs text-green-600">— リンカーン（{facility.name}）への接続を確認しました</span>
                    </div>
                    <button onClick={handleLoginTest} className="text-xs text-green-600 hover:text-green-800 underline transition-colors">
                      再確認
                    </button>
                  </div>
                )}

                {loginTestStatus === 'fail' && (
                  <div className="flex items-center justify-between px-4 py-2.5 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <XCircle size={15} className="text-red-500 flex-shrink-0" />
                      <span className="text-sm font-medium text-red-700">ログイン失敗</span>
                      <span className="text-xs text-red-600">— 認証情報を確認してください</span>
                    </div>
                    <button onClick={handleLoginTest} className="text-xs text-red-600 hover:text-red-800 underline transition-colors">
                      再試行
                    </button>
                  </div>
                )}
              </div>
            )}
          </Card>

          {/* ④ Process A (only if mode includes A) */}
          {(execMode === 'A_only' || execMode === 'A_and_B') && (
            <Card
              title="④ 処理A：コピー元カレンダーの設定"
              subtitle="Excel側のカレンダー名を、リンカーン側のカレンダーへ紐づけます。施設ごとにパターン保存できます。"
              accent="blue"
            >
              {/* Pattern bar */}
              <PatternBar
                patterns={facilityPatAs}
                selectedId={selectedPatAId}
                onSelect={applyPatternA}
                onSaveNew={savePatternA}
                onSaveOver={saveOverPatternA}
                onSetDefault={setDefaultPatternA}
                saveName={patASaveName}
                setSaveName={setPatASaveName}
                saveOpen={patASaveOpen}
                setSaveOpen={setPatASaveOpen}
                facilityHasPatterns={facilityPatAs.length > 0}
              />

              {/* Fetch button */}
              {!calLoaded ? (
                <div className="mb-4">
                  <button
                    onClick={fetchCalendars}
                    disabled={calLoading}
                    className="flex items-center gap-2 px-4 py-2 border border-indigo-300 bg-indigo-50 hover:bg-indigo-100 disabled:opacity-60 text-indigo-700 rounded-lg text-sm font-medium transition-colors"
                  >
                    {calLoading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                    {calLoading ? '取得中...' : 'リンカーンのカレンダーを取得'}
                  </button>
                  <p className="text-xs text-gray-400 mt-1.5">
                    ※ 取得後、ドロップダウンの選択肢が更新されます
                  </p>
                </div>
              ) : (
                <div className="mb-3 flex items-center gap-2">
                  <CheckCircle size={13} className="text-green-500" />
                  <span className="text-xs text-green-700 font-medium">カレンダー一覧取得済み（12件）</span>
                  <button
                    onClick={fetchCalendars}
                    className="flex items-center gap-1 text-xs text-gray-400 hover:text-indigo-600 transition-colors ml-2"
                  >
                    <RefreshCw size={11} />
                    再取得
                  </button>
                </div>
              )}

              {/* Calendar mapping table */}
              <CalendarMappingTable
                rows={calRows}
                calendars={CALENDARS}
                onChangeRow={updateCalRow}
                disabled={!calLoaded}
              />
            </Card>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════
          SCREEN 2: 処理B
      ════════════════════════════════════════════════════════════ */}
      {screen === 2 && (
        <div className="space-y-5">
          <Card
            title="処理B：料金ランク一括反映（5050）"
            subtitle="コピー元カレンダー × プラングループ × チェックするプラン名 を紐づけます。施設ごとにパターン保存できます。"
            accent="purple"
          >
            {/* Pattern bar */}
            <PatternBar
              patterns={facilityPatBs}
              selectedId={selectedPatBId}
              onSelect={applyPatternB}
              onSaveNew={savePatternB}
              onSaveOver={saveOverPatternB}
              onSetDefault={setDefaultPatternB}
              saveName={patBSaveName}
              setSaveName={setPatBSaveName}
              saveOpen={patBSaveOpen}
              setSaveOpen={setPatBSaveOpen}
              facilityHasPatterns={facilityPatBs.length > 0}
            />

            {/* Fetch button */}
            <div className="flex items-center gap-3 mb-4">
              <button
                onClick={fetchPlans}
                disabled={plansLoading}
                className="flex items-center gap-2 px-4 py-2 border border-purple-300 bg-purple-50 hover:bg-purple-100 disabled:opacity-60 text-purple-700 rounded-lg text-sm font-medium transition-colors"
              >
                {plansLoading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                {plansLoading ? '取得中...' : 'プラングループ・プラン名を取得する'}
              </button>
              {lastFetchedAt && (
                <span className="text-xs text-gray-400">最終取得: {lastFetchedAt}</span>
              )}
            </div>

            {/* Process B table */}
            <ProcessBTable
              rows={bRows}
              calendars={CALENDARS}
              planGroups={PLAN_GROUPS}
              onChangeRow={updateBRow}
              onAddRow={addBRow}
              onDeleteRow={deleteBRow}
              loaded={plansLoaded}
            />
          </Card>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════
          SCREEN 3: 最終確認
      ════════════════════════════════════════════════════════════ */}
      {screen === 3 && (
        <div className="space-y-5">
          {/* Warnings */}
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-1.5">
            <div className="flex items-start gap-2">
              <AlertTriangle size={14} className="text-amber-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-amber-800">検証で1件でも不一致なら失敗で停止します（完全一致のみ成功）</p>
            </div>
          </div>

          {/* Summary */}
          <Card title="実行サマリ" subtitle="内容を確認して「実行開始」を押してください">
            <div className="divide-y divide-gray-100">
              <SummaryRow label="実行モード" value={
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  execMode === 'A_only' ? 'bg-blue-100 text-blue-700' :
                  execMode === 'B_only' ? 'bg-purple-100 text-purple-700' :
                  'bg-indigo-100 text-indigo-700'
                }`}>
                  {execMode === 'A_only' ? 'コピー元カレンダー反映のみ' : execMode === 'B_only' ? '料金ランク一括反映のみ' : '一括実行'}
                </span>
              } />
              <SummaryRow label="対象施設" value={`${facility?.name} (${facility?.id})`} highlight />
              <SummaryRow
                label="対象期間"
                value={uploadedFile?.period ?? '—'}
                highlight
              />
              <SummaryRow
                label="変更件数（概算）"
                value={`${uploadedFile?.cellCount.toLocaleString() ?? '—'} セル`}
                highlight
              />
              {(execMode === 'A_only' || execMode === 'A_and_B') && (
                <SummaryRow
                  label="処理A パターン"
                  value={facilityPatAs.find(p => p.id === selectedPatAId)?.name ?? '（パターンなし）'}
                />
              )}
              {(execMode === 'B_only' || execMode === 'A_and_B') && (
                <>
                  <SummaryRow
                    label="処理B パターン"
                    value={facilityPatBs.find(p => p.id === selectedPatBId)?.name ?? '（パターンなし）'}
                  />
                  <SummaryRow
                    label="選択プラン数"
                    value={`${bRows.filter(r => r.planId).length} 件`}
                    highlight
                  />
                </>
              )}
              <SummaryRow
                label="リトライ回数"
                value={
                  <input
                    type="number" min={0} max={10} value={retryCount}
                    onChange={e => setRetryCount(Number(e.target.value))}
                    className="w-14 text-center border border-gray-200 rounded px-2 py-0.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                }
              />
              <SummaryRow
                label="実行環境"
                value={
                  currentEnvironment === 'production'
                    ? <span className="text-red-600 font-semibold">本番環境</span>
                    : <span className="text-blue-600 font-semibold">検証環境</span>
                }
              />
            </div>
          </Card>

          {/* Demo settings */}
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">デモ設定（プロトタイプ用）</p>
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="scenario" checked={scenario === 'success'} onChange={() => setScenario('success')} className="text-indigo-600" />
                <span className="text-sm text-gray-700">成功シナリオ</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="scenario" checked={scenario === 'fail'} onChange={() => setScenario('fail')} className="text-indigo-600" />
                <span className="text-sm text-gray-700">失敗シナリオ</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer border-l border-gray-300 pl-4">
                <input type="checkbox" checked={use2fa} onChange={e => setUse2fa(e.target.checked)} className="text-indigo-600 rounded" />
                <span className="text-sm text-gray-700">2FAシナリオ有効</span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* ── Footer navigation ───────────────────────────────────────────────── */}
      <div className="mt-6 flex items-center justify-between py-4 border-t border-gray-200">
        <div className="flex gap-3">
          {screen > 1 && (
            <button
              onClick={goBack}
              className="flex items-center gap-1.5 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              <ChevronLeft size={15} />
              戻る
            </button>
          )}
          <button
            onClick={() => navigate('/history')}
            className="px-4 py-2 text-sm text-gray-400 hover:text-gray-600 transition-colors"
          >
            キャンセル
          </button>
        </div>

        <div className="flex gap-3">
          {screen === 3 && (
            <button className="px-4 py-2 border border-gray-200 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
              下書き保存
            </button>
          )}
          {screen < 3 ? (
            <button
              onClick={goNext}
              disabled={!canGoNext()}
              className="flex items-center gap-1.5 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors"
            >
              次へ
              <ChevronRight size={15} />
            </button>
          ) : (
            <button
              onClick={handleExecute}
              className="flex items-center gap-2 px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold transition-colors shadow-sm"
            >
              <Zap size={15} />
              実行開始
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function ScreenProgress({ screen, execMode }: { screen: Screen; execMode: ExecMode }) {
  const steps =
    execMode === 'A_only'
      ? [
          { label: 'ファイル & カレンダー紐づけ', s: 1 },
          { label: '最終確認', s: 3 },
        ]
      : execMode === 'B_only'
      ? [
          { label: 'ファイルアップロード', s: 1 },
          { label: '料金ランク設定', s: 2 },
          { label: '最終確認', s: 3 },
        ]
      : [
          { label: 'ファイル & カレンダー紐づけ', s: 1 },
          { label: '料金ランク設定', s: 2 },
          { label: '最終確認', s: 3 },
        ];

  return (
    <div className="flex items-center gap-0 mb-6">
      {steps.map((st, i) => {
        const isActive = screen === st.s;
        const isDone = screen > st.s || (st.s === 3 && screen === 3);
        const isCurrent = screen === st.s;
        return (
          <React.Fragment key={st.s}>
            <div className="flex items-center gap-2">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 ${
                  isDone && !isCurrent
                    ? 'bg-green-500 text-white'
                    : isCurrent
                    ? 'bg-indigo-600 text-white ring-4 ring-indigo-100'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                {isDone && !isCurrent ? <CheckCircle size={13} /> : i + 1}
              </div>
              <span className={`text-xs font-medium whitespace-nowrap ${
                isCurrent ? 'text-indigo-700' : isDone && !isCurrent ? 'text-green-600' : 'text-gray-400'
              }`}>
                {st.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={`flex-1 h-0.5 mx-3 ${screen > st.s ? 'bg-green-300' : 'bg-gray-200'}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

function Card({
  title, subtitle, children, accent,
}: {
  title: string; subtitle?: string; children: React.ReactNode; accent?: 'blue' | 'purple' | 'indigo';
}) {
  const borderColor = accent === 'blue' ? 'border-t-blue-400' : accent === 'purple' ? 'border-t-purple-400' : accent === 'indigo' ? 'border-t-indigo-400' : '';
  return (
    <div className={`bg-white rounded-xl border border-gray-200 shadow-sm ${accent ? 'border-t-2 ' + borderColor : ''}`}>
      <div className="px-6 py-5">
        <h2 className="text-base font-semibold text-gray-900">{title}</h2>
        {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
      </div>
      <div className="px-6 pb-6">{children}</div>
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-gray-200 rounded-lg px-4 py-2.5 bg-gray-50">
      <div className="text-xs text-gray-400 mb-0.5">{label}</div>
      <div className="text-sm font-medium text-gray-800 truncate">{value}</div>
    </div>
  );
}

function SummaryRow({ label, value, highlight }: { label: string; value: React.ReactNode; highlight?: boolean }) {
  return (
    <div className="flex items-center gap-4 py-3">
      <div className="text-sm text-gray-500 w-40 flex-shrink-0">{label}</div>
      <div className={`text-sm flex-1 ${highlight ? 'font-semibold text-gray-900' : 'font-medium text-gray-800'}`}>
        {value}
      </div>
    </div>
  );
}

function PatternBar({
  patterns, selectedId, onSelect, onSaveNew, onSaveOver, onSetDefault,
  saveName, setSaveName, saveOpen, setSaveOpen, facilityHasPatterns,
}: {
  patterns: { id: string; name: string; isDefault: boolean }[];
  selectedId: string;
  onSelect: (id: string) => void;
  onSaveNew: (name: string) => void;
  onSaveOver: () => void;
  onSetDefault: () => void;
  saveName: string;
  setSaveName: (v: string) => void;
  saveOpen: boolean;
  setSaveOpen: (v: boolean) => void;
  facilityHasPatterns: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 mb-4 p-3 bg-gray-50 rounded-xl border border-gray-200">
      <span className="text-xs font-medium text-gray-500 mr-1">紐づけパターン：</span>
      <select
        value={selectedId}
        onChange={e => onSelect(e.target.value)}
        className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 min-w-[160px]"
      >
        <option value="">パターンを選択...</option>
        {patterns.map(p => (
          <option key={p.id} value={p.id}>
            {p.name}{p.isDefault ? ' ★' : ''}
          </option>
        ))}
      </select>

      {saveOpen ? (
        <>
          <input
            type="text"
            placeholder="パターン名を入力..."
            value={saveName}
            onChange={e => setSaveName(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') { onSaveNew(saveName); setSaveName(''); setSaveOpen(false); }
              if (e.key === 'Escape') setSaveOpen(false);
            }}
            autoFocus
            className="border border-indigo-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-44"
          />
          <button
            onClick={() => { onSaveNew(saveName); setSaveName(''); setSaveOpen(false); }}
            className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-medium transition-colors"
          >
            <Save size={12} />
            保存
          </button>
          <button onClick={() => setSaveOpen(false)} className="px-2 py-1.5 text-xs text-gray-400 hover:text-gray-600">
            取消
          </button>
        </>
      ) : (
        <>
          <button
            onClick={() => setSaveOpen(true)}
            className="flex items-center gap-1 px-3 py-1.5 border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 rounded-lg text-xs font-medium transition-colors"
          >
            <Save size={12} />
            名前を付けて保存
          </button>
          {selectedId && (
            <button
              onClick={onSaveOver}
              className="flex items-center gap-1 px-3 py-1.5 border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 rounded-lg text-xs font-medium transition-colors"
            >
              上書き保存
            </button>
          )}
          <button
            onClick={onSetDefault}
            className="flex items-center gap-1 px-3 py-1.5 border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg text-xs font-medium transition-colors"
          >
            <Star size={12} />
            デフォルトに設定
          </button>
        </>
      )}
    </div>
  );
}

function CalendarMappingTable({
  rows, calendars, onChangeRow, disabled,
}: {
  rows: CalMapRow[];
  calendars: { id: string; name: string }[];
  onChangeRow: (id: string, lincolnCalId: string) => void;
  disabled: boolean;
}) {
  const mapped = rows.filter(r => r.lincolnCalId).length;
  const unmapped = rows.length - mapped;
  const noneSelected = mapped === 0 && !disabled;

  return (
    <div>
      {/* Error: zero mapped (blocking) */}
      {noneSelected && (
        <div className="flex items-center gap-2 mb-3 text-xs text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-lg">
          <AlertTriangle size={12} />
          <span>少なくとも1件以上の紐づけが必要です</span>
        </div>
      )}
      {/* Info: some unmapped but at least one is OK */}
      {!noneSelected && unmapped > 0 && !disabled && (
        <div className="flex items-center gap-2 mb-3 text-xs text-gray-500 bg-gray-50 border border-gray-200 px-3 py-2 rounded-lg">
          <Info size={12} />
          <span>{unmapped}件が未選択です（任意）。1件以上の紐づけでOKです。</span>
        </div>
      )}
      <div className="border border-gray-200 rounded-xl overflow-hidden">
        <div className="grid grid-cols-[1fr_24px_1fr] items-center px-4 py-2.5 bg-gray-50 border-b border-gray-100">
          <div className="text-xs font-semibold text-gray-600">Excel側 カレンダー名</div>
          <div />
          <div className="text-xs font-semibold text-gray-600">コピー元カレンダー名</div>
        </div>
        <div className="divide-y divide-gray-100">
          {rows.map(row => (
            <div key={row.id} className="grid grid-cols-[1fr_24px_1fr] items-center px-4 py-3 hover:bg-gray-50/50 transition-colors">
              <div className="text-sm text-gray-700 font-medium">{row.excelName}</div>
              <div className="flex justify-center">
                <ChevronRight size={14} className="text-gray-300" />
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={row.lincolnCalId}
                  onChange={e => onChangeRow(row.id, e.target.value)}
                  disabled={disabled}
                  className={`flex-1 border rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    disabled ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed' :
                    row.lincolnCalId ? 'border-gray-200 bg-white' : 'border-gray-200 bg-white'
                  }`}
                >
                  <option value="">未選択</option>
                  {calendars.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                {!disabled && !row.lincolnCalId && (
                  <span className="text-xs text-gray-400 flex-shrink-0">—</span>
                )}
                {!disabled && row.lincolnCalId && (
                  <CheckCircle size={14} className="text-green-500 flex-shrink-0" />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
      {disabled && (
        <p className="text-xs text-gray-400 mt-2">↑ カレンダーを取得するとドロップダウンが選択可能になります</p>
      )}
    </div>
  );
}

function ProcessBTable({
  rows, calendars, planGroups, onChangeRow, onAddRow, onDeleteRow, loaded,
}: {
  rows: ProcBRow[];
  calendars: { id: string; name: string }[];
  planGroups: import('../data/mockData').PlanGroup[];
  onChangeRow: (idx: number, field: keyof ProcBRow, value: string) => void;
  onAddRow: () => void;
  onDeleteRow: (idx: number) => void;
  loaded: boolean;
}) {
  if (!loaded) {
    return (
      <div className="border-2 border-dashed border-gray-200 rounded-xl py-10 text-center">
        <RefreshCw size={28} className="mx-auto mb-3 text-gray-200" />
        <p className="text-sm text-gray-400">「プラングループ・プラン名を取得する」ボタンを押してください</p>
      </div>
    );
  }

  return (
    <div>
      <div className="border border-gray-200 rounded-xl overflow-hidden mb-3">
        <div className="grid grid-cols-[1fr_1fr_1fr_36px] items-center px-4 py-2.5 bg-gray-50 border-b border-gray-100 gap-2">
          <div className="text-xs font-semibold text-gray-600">コピー元カレンダー</div>
          <div className="text-xs font-semibold text-gray-600">プラングループ</div>
          <div className="text-xs font-semibold text-gray-600">チェックするプラン名</div>
          <div />
        </div>
        <div className="divide-y divide-gray-100">
          {rows.map((row, idx) => {
            const plans = planGroups.find(g => g.id === row.groupId)?.plans ?? [];
            return (
              <div key={row.id} className="grid grid-cols-[1fr_1fr_1fr_36px] items-center px-4 py-2.5 hover:bg-gray-50/50 gap-2">
                {/* Col 1: copy-source calendar */}
                <select
                  value={row.calId}
                  onChange={e => onChangeRow(idx, 'calId', e.target.value)}
                  className={`w-full border rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-purple-500 ${
                    row.calId ? 'border-gray-200 bg-white text-gray-800' : 'border-gray-200 bg-white text-gray-400'
                  }`}
                >
                  <option value="">—</option>
                  {calendars.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                {/* Col 2: plan group */}
                <select
                  value={row.groupId}
                  onChange={e => onChangeRow(idx, 'groupId', e.target.value)}
                  className={`w-full border rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-purple-500 ${
                    row.groupId ? 'border-gray-200 bg-white text-gray-800' : 'border-orange-200 bg-orange-50 text-gray-500'
                  }`}
                >
                  <option value="">グループを選択...</option>
                  {planGroups.map(g => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
                {/* Col 3: plan */}
                <select
                  value={row.planId}
                  onChange={e => onChangeRow(idx, 'planId', e.target.value)}
                  disabled={!row.groupId}
                  className={`w-full border rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-purple-500 ${
                    !row.groupId ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed' :
                    row.planId ? 'border-gray-200 bg-white text-gray-800' : 'border-orange-200 bg-orange-50 text-gray-500'
                  }`}
                >
                  <option value="">{row.groupId ? 'プランを選択...' : '（グループ先に選択）'}</option>
                  {plans.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                {/* Delete */}
                <button
                  onClick={() => onDeleteRow(idx)}
                  className="flex items-center justify-center w-7 h-7 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            );
          })}
        </div>
      </div>
      <button
        onClick={onAddRow}
        className="flex items-center gap-1.5 px-3 py-2 text-sm text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition-colors border border-dashed border-indigo-300"
      >
        <Plus size={14} />
        行を追加
      </button>
    </div>
  );
}