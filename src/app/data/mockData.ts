export type JobStatus = 'queued' | 'running' | 'awaiting_user' | 'succeeded' | 'failed';
export type StepStatus = 'pending' | 'running' | 'succeeded' | 'failed' | 'skipped';
export type ExecMode = 'A_only' | 'B_only' | 'A_and_B';

export interface Facility {
  id: string;
  name: string;
  aliases: string[];
  active: boolean;
  has2fa: boolean;
  estimatedTime: string;
  notes?: string;
}

export interface JobStep {
  id: string;
  name: string;
  nameJa: string;
  status: StepStatus;
  attempts: number;
  startedAt?: string;
  updatedAt?: string;
  errorMessage?: string;
}

export interface Artifact {
  id: string;
  name: string;
  type: 'screenshot' | 'html' | 'network' | 'excel';
  url: string;
  size: string;
}

export interface CalendarMappingRow {
  excelCalendarName: string;
  lincolnCalendarId: string;
}

export interface CalendarPattern {
  id: string;
  name: string;
  facilityId: string;
  isDefault: boolean;
  mappings: CalendarMappingRow[];
}

export interface ProcessBMappingRow {
  id: string;
  copySourceCalId: string;
  planGroupId: string;
  planId: string;
}

export interface ProcessBPattern {
  id: string;
  name: string;
  facilityId: string;
  isDefault: boolean;
  rows: ProcessBMappingRow[];
}

export interface Job {
  id: string;
  status: JobStatus;
  execMode: ExecMode;
  facilityId: string;
  facilityName: string;
  period: { from: string; to: string };
  calendarMappings: CalendarMappingRow[];
  patternAName?: string;
  processBRows: ProcessBMappingRow[];
  patternBName?: string;
  retryCount: number;
  environment: 'production' | 'staging';
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  steps: JobStep[];
  logs: string[];
  artifacts: Artifact[];
  failureReason?: string;
  failureStep?: string;
  scenario: 'success' | 'fail';
  use2fa: boolean;
}

export interface Calendar {
  id: string;
  name: string;
}

export interface PlanGroup {
  id: string;
  name: string;
  plans: Plan[];
}

export interface Plan {
  id: string;
  name: string;
  planGroupId: string;
}

export interface Selector {
  screen: string;
  action: string;
  selector: string;
  status: 'known' | 'tbd';
  notes?: string;
}

// Excel calendar names simulated from file analysis
export const EXCEL_CALENDARS: string[] = [
  '和室コンド(単泊)',
  '和室コンド(連泊)',
  '和室コンド5名(単泊)',
  '和室コンド5名(連泊)',
];

export const FACILITIES: Facility[] = [
  {
    id: 'I38347',
    name: 'グランドホテル東京',
    aliases: ['grand_tokyo', 'GHT'],
    active: true,
    has2fa: true,
    estimatedTime: '約15分',
    notes: '2FAが発生する場合があります。処理完了まで画面を閉じないでください。',
  },
  {
    id: 'I29183',
    name: 'シーサイドリゾート大阪',
    aliases: ['seaside_osaka'],
    active: true,
    has2fa: false,
    estimatedTime: '約10分',
  },
  {
    id: 'I44521',
    name: '山の宿 鳳凰',
    aliases: ['houou_yama'],
    active: true,
    has2fa: false,
    estimatedTime: '約8分',
  },
  {
    id: 'I51099',
    name: 'ビジネスホテル名古屋',
    aliases: ['biz_nagoya'],
    active: true,
    has2fa: true,
    estimatedTime: '約12分',
  },
  {
    id: 'I63847',
    name: '温泉旅館 花見',
    aliases: ['hanami_onsen'],
    active: false,
    has2fa: false,
    estimatedTime: '約10分',
    notes: '現在メンテナンス中のため選択不可',
  },
];

export const createDefaultSteps = (): JobStep[] => [
  { id: 'login', name: 'Login', nameJa: 'ログイン', status: 'pending', attempts: 0 },
  { id: 'facility_switch', name: 'Facility Switch', nameJa: '施設切替', status: 'pending', attempts: 0 },
  { id: 'step0', name: 'Step0: Calendar Rank Import', nameJa: 'Step0: カレンダーランクインポート (DOM注入)', status: 'pending', attempts: 0 },
  { id: 'step_a', name: 'StepA: Copy Source Calendar Setting', nameJa: 'StepA: コピー元カレンダー設定', status: 'pending', attempts: 0 },
  { id: 'step_b', name: 'StepB: Bulk Apply (5050)', nameJa: 'StepB: 一括適用 (5050)', status: 'pending', attempts: 0 },
  { id: 'step_c', name: 'StepC: Output & Verify (5070)', nameJa: 'StepC: 出力・検証 (5070)', status: 'pending', attempts: 0 },
];

const mkSucceededSteps = (): JobStep[] =>
  createDefaultSteps().map(s => ({
    ...s,
    status: 'succeeded' as StepStatus,
    attempts: 1,
    startedAt: '2024-06-28T09:00:00Z',
    updatedAt: '2024-06-28T09:18:00Z',
  }));

const mkFailedSteps = (): JobStep[] => {
  const steps = createDefaultSteps();
  return steps.map((s, i) => ({
    ...s,
    status: (i < 5 ? 'succeeded' : 'failed') as StepStatus,
    attempts: i < 5 ? 1 : 3,
    startedAt: '2024-06-27T14:30:00Z',
    updatedAt: '2024-06-27T14:42:00Z',
    errorMessage: i === 5 ? '検証失敗: 1件の不一致が検出されました' : undefined,
  }));
};

const DEFAULT_CAL_MAPPINGS: CalendarMappingRow[] = [
  { excelCalendarName: '和室コンド(単泊)', lincolnCalendarId: 'cal_010' },
  { excelCalendarName: '和室コンド(連泊)', lincolnCalendarId: 'cal_012' },
  { excelCalendarName: '和室コンド5名(単泊)', lincolnCalendarId: 'cal_008' },
  { excelCalendarName: '和室コンド5名(連泊)', lincolnCalendarId: '' },
];

const DEFAULT_B_ROWS: ProcessBMappingRow[] = [
  { id: 'pbr1', copySourceCalId: 'cal_008', planGroupId: 'pg_001', planId: 'plan_013' },
  { id: 'pbr2', copySourceCalId: '', planGroupId: 'pg_002', planId: 'plan_014' },
  { id: 'pbr3', copySourceCalId: '', planGroupId: 'pg_003', planId: 'plan_015' },
];

export const MOCK_JOBS: Job[] = [
  {
    id: 'job-001',
    status: 'succeeded',
    execMode: 'A_and_B',
    facilityId: 'I38347',
    facilityName: 'グランドホテル東京',
    period: { from: '2024-07-01', to: '2024-09-30' },
    calendarMappings: DEFAULT_CAL_MAPPINGS,
    patternAName: '標準',
    processBRows: DEFAULT_B_ROWS,
    patternBName: '標準',
    retryCount: 3,
    environment: 'production',
    createdAt: '2024-06-28T09:00:00Z',
    createdBy: 'operator01',
    updatedAt: '2024-06-28T09:18:00Z',
    steps: mkSucceededSteps(),
    logs: [
      '[09:00:05] ログイン開始',
      '[09:01:12] 2FAコード入力完了',
      '[09:01:30] ログイン成功',
      '[09:01:35] 施設切替完了: I38347',
      '[09:03:00] Step0: カレンダーランクインポート完了',
      '[09:07:00] StepA: コピー元カレンダー設定完了',
      '[09:13:00] StepB: 一括適用(5050)完了',
      '[09:18:00] StepC: 出力・検証(5070)完了 — 全件一致確認',
    ],
    artifacts: [
      { id: 'a1', name: 'screenshot_final.png', type: 'screenshot', url: '#', size: '245 KB' },
      { id: 'a2', name: 'output_I38347_2024Q3.xlsx', type: 'excel', url: '#', size: '1.2 MB' },
      { id: 'a3', name: 'network_log.json', type: 'network', url: '#', size: '89 KB' },
    ],
    scenario: 'success',
    use2fa: true,
  },
  {
    id: 'job-002',
    status: 'failed',
    execMode: 'A_and_B',
    facilityId: 'I29183',
    facilityName: 'シーサイドリゾート大阪',
    period: { from: '2024-07-01', to: '2024-07-31' },
    calendarMappings: DEFAULT_CAL_MAPPINGS,
    processBRows: DEFAULT_B_ROWS,
    retryCount: 3,
    environment: 'production',
    createdAt: '2024-06-27T14:30:00Z',
    createdBy: 'operator02',
    updatedAt: '2024-06-27T14:42:00Z',
    steps: mkFailedSteps(),
    logs: [
      '[14:30:05] ログイン開始',
      '[14:30:58] ログイン成功',
      '[14:31:05] 施設切替完了: I29183',
      '[14:33:00] Step0: カレンダーランクインポート完了',
      '[14:36:00] StepA: コピー元カレンダー設定完了',
      '[14:41:00] StepB: 一括適用(5050)完了',
      '[14:41:30] StepC: 出力・検証(5070)開始',
      '[14:42:00] ERROR: 検証失敗 — 不一致を1件検出。完全一致のみ成功のため処理を停止しました。',
    ],
    artifacts: [
      { id: 'b1', name: 'screenshot_error.png', type: 'screenshot', url: '#', size: '312 KB' },
      { id: 'b2', name: 'error_detail.html', type: 'html', url: '#', size: '28 KB' },
    ],
    failureReason: 'StepC (出力・検証) で検証エラー: 1件の不一致が検出されました。完全一致のみ成功のため処理を停止しました。',
    failureStep: 'StepC: Output & Verify (5070)',
    scenario: 'fail',
    use2fa: false,
  },
  {
    id: 'job-003',
    status: 'running',
    execMode: 'A_only',
    facilityId: 'I44521',
    facilityName: '山の宿 鳳凰',
    period: { from: '2024-07-01', to: '2024-08-31' },
    calendarMappings: [
      { excelCalendarName: '和室コンド(単泊)', lincolnCalendarId: 'cal_006' },
      { excelCalendarName: '和室コンド(連泊)', lincolnCalendarId: 'cal_007' },
    ],
    processBRows: [],
    retryCount: 3,
    environment: 'staging',
    createdAt: '2024-06-28T10:15:00Z',
    createdBy: 'operator01',
    updatedAt: '2024-06-28T10:20:00Z',
    steps: (() => {
      const s = createDefaultSteps();
      s[0] = { ...s[0], status: 'succeeded', attempts: 1 };
      s[1] = { ...s[1], status: 'succeeded', attempts: 1 };
      s[2] = { ...s[2], status: 'running', attempts: 1 };
      s[4] = { ...s[4], status: 'skipped', attempts: 0 };
      return s;
    })(),
    logs: [
      '[10:15:05] ログイン開始',
      '[10:16:00] ログイン成功',
      '[10:16:05] 施設切替完了: I44521',
      '[10:16:30] Step0: カレンダーランクインポート開始...',
    ],
    artifacts: [],
    scenario: 'success',
    use2fa: false,
  },
  {
    id: 'job-004',
    status: 'queued',
    execMode: 'B_only',
    facilityId: 'I51099',
    facilityName: 'ビジネスホテル名古屋',
    period: { from: '2024-08-01', to: '2024-08-31' },
    calendarMappings: [],
    processBRows: [
      { id: 'pbr_x1', copySourceCalId: 'cal_011', planGroupId: 'pg_004', planId: 'plan_009' },
    ],
    patternBName: 'テスト用',
    retryCount: 3,
    environment: 'staging',
    createdAt: '2024-06-28T11:00:00Z',
    createdBy: 'operator01',
    updatedAt: '2024-06-28T11:00:00Z',
    steps: createDefaultSteps(),
    logs: ['[11:00:00] ジョブをキューに追加しました'],
    artifacts: [],
    scenario: 'success',
    use2fa: false,
  },
  {
    id: 'job-005',
    status: 'succeeded',
    execMode: 'A_and_B',
    facilityId: 'I29183',
    facilityName: 'シーサイドリゾート大阪',
    period: { from: '2024-06-01', to: '2024-06-30' },
    calendarMappings: DEFAULT_CAL_MAPPINGS,
    processBRows: DEFAULT_B_ROWS,
    retryCount: 3,
    environment: 'production',
    createdAt: '2024-05-30T08:00:00Z',
    createdBy: 'operator02',
    updatedAt: '2024-05-30T08:12:00Z',
    steps: mkSucceededSteps(),
    logs: ['[08:00:00] ジョブ開始', '[08:12:00] 全ステップ完了'],
    artifacts: [
      { id: 'c1', name: 'output_I29183_2024Jun.xlsx', type: 'excel', url: '#', size: '980 KB' },
    ],
    scenario: 'success',
    use2fa: false,
  },
];

export const CALENDARS: Calendar[] = [
  { id: 'cal_001', name: '一般プラン' },
  { id: 'cal_002', name: '週末・祝日' },
  { id: 'cal_003', name: '特別期間' },
  { id: 'cal_004', name: '年末年始' },
  { id: 'cal_005', name: 'GW・お盆' },
  { id: 'cal_006', name: '通常' },
  { id: 'cal_007', name: '特別' },
  { id: 'cal_008', name: 'テストカレンダー' },
  { id: 'cal_009', name: '単泊カレンダー' },
  { id: 'cal_010', name: '連泊カレンダー' },
  { id: 'cal_011', name: 'カレンダーテスト' },
  { id: 'cal_012', name: '基本カレンダー' },
];

export const PLAN_GROUPS: PlanGroup[] = [
  {
    id: 'pg_001',
    name: '素泊まりプラン',
    plans: [
      { id: 'plan_001', name: '素泊まり（和室）', planGroupId: 'pg_001' },
      { id: 'plan_002', name: '素泊まり（洋室）', planGroupId: 'pg_001' },
      { id: 'plan_003', name: '素泊まり（スイート）', planGroupId: 'pg_001' },
      { id: 'plan_013', name: '単泊_素泊まり', planGroupId: 'pg_001' },
      { id: 'plan_014', name: '単泊レンタカー_素泊まり', planGroupId: 'pg_001' },
    ],
  },
  {
    id: 'pg_002',
    name: '朝食付きプラン',
    plans: [
      { id: 'plan_004', name: '朝食付き（和室）', planGroupId: 'pg_002' },
      { id: 'plan_005', name: '朝食付き（洋室）', planGroupId: 'pg_002' },
      { id: 'plan_006', name: '朝食付き（スイート）', planGroupId: 'pg_002' },
    ],
  },
  {
    id: 'pg_003',
    name: '2食付きプラン',
    plans: [
      { id: 'plan_007', name: '2食付き（和室）', planGroupId: 'pg_003' },
      { id: 'plan_008', name: '2食付き（洋室）', planGroupId: 'pg_003' },
      { id: 'plan_015', name: '海外レンタカー連泊_素泊まり', planGroupId: 'pg_003' },
    ],
  },
  {
    id: 'pg_004',
    name: 'ビジネスプラン',
    plans: [
      { id: 'plan_009', name: 'ビジネスシングル', planGroupId: 'pg_004' },
      { id: 'plan_010', name: 'ビジネスツイン', planGroupId: 'pg_004' },
    ],
  },
  {
    id: 'pg_005',
    name: '記念日・特別プラン',
    plans: [
      { id: 'plan_011', name: '記念日プラン', planGroupId: 'pg_005' },
      { id: 'plan_012', name: 'ハネムーンプラン', planGroupId: 'pg_005' },
    ],
  },
];

// Initial calendar patterns (per facility)
export const CALENDAR_PATTERNS: CalendarPattern[] = [
  {
    id: 'pat_a_001',
    name: '標準',
    facilityId: 'I38347',
    isDefault: true,
    mappings: [
      { excelCalendarName: '和室コンド(単泊)', lincolnCalendarId: 'cal_010' },
      { excelCalendarName: '和室コンド(連泊)', lincolnCalendarId: 'cal_012' },
      { excelCalendarName: '和室コンド5名(単泊)', lincolnCalendarId: 'cal_008' },
      { excelCalendarName: '和室コンド5名(連泊)', lincolnCalendarId: '' },
    ],
  },
  {
    id: 'pat_a_002',
    name: 'テスト用',
    facilityId: 'I38347',
    isDefault: false,
    mappings: [
      { excelCalendarName: '和室コンド(単泊)', lincolnCalendarId: 'cal_006' },
      { excelCalendarName: '和室コンド(連泊)', lincolnCalendarId: 'cal_007' },
      { excelCalendarName: '和室コンド5名(単泊)', lincolnCalendarId: 'cal_008' },
      { excelCalendarName: '和室コンド5名(連泊)', lincolnCalendarId: '' },
    ],
  },
  {
    id: 'pat_a_003',
    name: '繁忙期用',
    facilityId: 'I38347',
    isDefault: false,
    mappings: [
      { excelCalendarName: '和室コンド(単泊)', lincolnCalendarId: 'cal_004' },
      { excelCalendarName: '和室コンド(連泊)', lincolnCalendarId: 'cal_005' },
      { excelCalendarName: '和室コンド5名(単泊)', lincolnCalendarId: 'cal_004' },
      { excelCalendarName: '和室コンド5名(連泊)', lincolnCalendarId: 'cal_005' },
    ],
  },
];

export const PROCESS_B_PATTERNS: ProcessBPattern[] = [
  {
    id: 'pat_b_001',
    name: '標準',
    facilityId: 'I38347',
    isDefault: true,
    rows: [
      { id: 'pbr1', copySourceCalId: 'cal_008', planGroupId: 'pg_001', planId: 'plan_013' },
      { id: 'pbr2', copySourceCalId: '', planGroupId: 'pg_002', planId: 'plan_004' },
      { id: 'pbr3', copySourceCalId: '', planGroupId: 'pg_003', planId: 'plan_015' },
    ],
  },
  {
    id: 'pat_b_002',
    name: 'テスト用',
    facilityId: 'I38347',
    isDefault: false,
    rows: [
      { id: 'pbr4', copySourceCalId: 'cal_011', planGroupId: 'pg_001', planId: 'plan_014' },
      { id: 'pbr5', copySourceCalId: 'cal_008', planGroupId: 'pg_002', planId: 'plan_005' },
    ],
  },
];

export const SELECTORS: Selector[] = [
  { screen: '5050', action: 'copy', selector: 'a[onclick="doCopy()"]', status: 'known', notes: 'コピー元カレンダー設定のコピーボタン' },
  { screen: '5050', action: 'sendContinue', selector: 'a[onclick="doSend(true);"]', status: 'known', notes: '一括適用の送信（継続）ボタン' },
  { screen: '5070', action: 'fromSelect', selector: 'select[name="from_date"]', status: 'known', notes: '期間開始日セレクト' },
  { screen: '5070', action: 'toSelect', selector: 'select[name="to_date"]', status: 'known', notes: '期間終了日セレクト' },
  { screen: '5070', action: 'search', selector: 'a[onclick="doSearch();"]', status: 'known', notes: '検索実行ボタン' },
  { screen: '5070', action: 'output', selector: 'a[onclick="doOutput();"]', status: 'known', notes: '出力ボタン' },
  { screen: '6800', action: 'facilityId', selector: 'dl.g_header_id dd', status: 'known', notes: '施設ID取得要素' },
  { screen: 'Login', action: 'username', selector: 'input[name="login_id"]', status: 'tbd', notes: '要確認: 環境により変わる可能性あり' },
  { screen: 'Login', action: 'password', selector: 'input[name="password"]', status: 'tbd', notes: '要確認' },
  { screen: 'Login', action: '2fa_code', selector: 'input[name="token"]', status: 'tbd', notes: '2FA入力フィールド。出現条件を要確認' },
];
