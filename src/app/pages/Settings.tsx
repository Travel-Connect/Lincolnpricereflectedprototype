import * as React from 'react';
import { useState } from 'react';
import { Building2, Calendar, ListChecks, RotateCcw, User, Check, Save } from 'lucide-react';
import { toast } from 'sonner';
import { FACILITIES, CALENDARS, PLAN_GROUPS } from '../data/mockData';

const TABS = [
  { id: 'facilities', label: '施設', icon: Building2 },
  { id: 'calendars', label: 'カレンダー紐づけ', icon: Calendar },
  { id: 'plans', label: 'プラングループ・プラン', icon: ListChecks },
  { id: 'retry', label: 'リトライ設定', icon: RotateCcw },
  { id: 'account', label: 'アカウント', icon: User },
];

export function Settings() {
  const [activeTab, setActiveTab] = useState('facilities');
  const [defaultCalA, setDefaultCalA] = useState('一般プラン');
  const [defaultCalB, setDefaultCalB] = useState('週末・祝日');
  const [defaultRetry, setDefaultRetry] = useState(3);
  const [displayName, setDisplayName] = useState('operator01');

  function handleSave() {
    toast.success('設定を保存しました');
  }

  return (
    <div className="p-8 max-w-[1060px] mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">設定</h1>
        <p className="text-sm text-gray-500 mt-1">施設・カレンダー・アカウントなどの設定を管理します</p>
      </div>

      <div className="flex gap-6">
        {/* Sidebar tabs */}
        <div className="w-48 flex-shrink-0">
          <nav className="space-y-0.5">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left ${
                  activeTab === tab.id
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <tab.icon size={15} />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1">
          {/* Facilities tab */}
          {activeTab === 'facilities' && (
            <TabPanel title="施設一覧" description="登録済みの施設を管理します">
              <div className="divide-y divide-gray-100">
                {FACILITIES.map(f => (
                  <div key={f.id} className="py-4 flex items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900 text-sm">{f.name}</span>
                        {!f.active && (
                          <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">非アクティブ</span>
                        )}
                        {f.has2fa && (
                          <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">2FA</span>
                        )}
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5">
                        ID: {f.id}　・　別名: {f.aliases.join(', ')}　・　目安: {f.estimatedTime}
                      </div>
                      {f.notes && (
                        <div className="text-xs text-amber-600 mt-1">{f.notes}</div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-10 h-5 rounded-full transition-colors ${f.active ? 'bg-indigo-500' : 'bg-gray-200'}`}
                        style={{ position: 'relative' }}
                      >
                        <div
                          className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${f.active ? 'translate-x-5' : 'translate-x-0.5'}`}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </TabPanel>
          )}

          {/* Calendars tab */}
          {activeTab === 'calendars' && (
            <TabPanel title="カレンダー紐づけ（デフォルト）" description="新規ジョブ作成時のデフォルトのカレンダー対応を設定します">
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 border border-gray-200 rounded-xl">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <span className="font-bold text-blue-700">A</span>
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-700">キー A（単泊）デフォルト</div>
                  </div>
                  <select
                    value={defaultCalA}
                    onChange={e => setDefaultCalA(e.target.value)}
                    className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 min-w-[180px] bg-white"
                  >
                    {CALENDARS.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                  </select>
                </div>

                <div className="flex items-center gap-4 p-4 border border-gray-200 rounded-xl">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <span className="font-bold text-purple-700">B</span>
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-700">キー B（連泊）デフォルト</div>
                  </div>
                  <select
                    value={defaultCalB}
                    onChange={e => setDefaultCalB(e.target.value)}
                    className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 min-w-[180px] bg-white"
                  >
                    {CALENDARS.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                  </select>
                </div>

                <button onClick={handleSave} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors">
                  <Save size={14} />
                  保存
                </button>
              </div>
            </TabPanel>
          )}

          {/* Plans tab */}
          {activeTab === 'plans' && (
            <TabPanel title="プラングループ・プラン設定" description="前回の選択を管理します。新規ジョブ作成時に復元できます。">
              <div className="space-y-3">
                {PLAN_GROUPS.map(pg => (
                  <div key={pg.id} className="border border-gray-200 rounded-xl overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 bg-gray-50">
                      <div>
                        <span className="font-medium text-sm text-gray-800">{pg.name}</span>
                        <span className="ml-2 text-xs text-gray-400">{pg.plans.length}プラン</span>
                      </div>
                      <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                        <input type="checkbox" defaultChecked className="text-indigo-600 rounded" />
                        デフォルト選択
                      </label>
                    </div>
                    <div className="px-4 py-3 flex flex-wrap gap-2">
                      {pg.plans.map(p => (
                        <span key={p.id} className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">
                          {p.name}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
                <button onClick={handleSave} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors mt-2">
                  <Save size={14} />
                  保存
                </button>
              </div>
            </TabPanel>
          )}

          {/* Retry tab */}
          {activeTab === 'retry' && (
            <TabPanel title="リトライ設定" description="ジョブの自動リトライ動作を設定します">
              <div className="space-y-6">
                <div className="flex items-center gap-6 p-5 border border-gray-200 rounded-xl">
                  <div className="flex-1">
                    <div className="font-medium text-gray-800 text-sm">デフォルトリトライ回数</div>
                    <div className="text-xs text-gray-500 mt-0.5">ステップが失敗した際に自動リトライする回数</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setDefaultRetry(Math.max(0, defaultRetry - 1))}
                      className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 text-gray-600 font-medium"
                    >
                      −
                    </button>
                    <span className="w-12 text-center font-semibold text-xl text-gray-900">{defaultRetry}</span>
                    <button
                      onClick={() => setDefaultRetry(Math.min(10, defaultRetry + 1))}
                      className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 text-gray-600 font-medium"
                    >
                      ＋
                    </button>
                  </div>
                </div>

                <div className="p-4 border border-gray-200 rounded-xl">
                  <div className="font-medium text-gray-800 text-sm mb-2">リトライ対象ステップ</div>
                  <div className="space-y-2">
                    {['Login', 'Facility Switch', 'Step0: Calendar Rank Import', 'StepA: Copy Source', 'StepB: Bulk Apply', 'StepC: Output & Verify'].map(s => (
                      <label key={s} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                        <input type="checkbox" defaultChecked className="text-indigo-600 rounded" />
                        {s}
                      </label>
                    ))}
                  </div>
                </div>

                <button onClick={handleSave} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors">
                  <Save size={14} />
                  保存
                </button>
              </div>
            </TabPanel>
          )}

          {/* Account tab */}
          {activeTab === 'account' && (
            <TabPanel title="アカウント" description="表示名と認証情報を管理します（パスワードは表示しません）">
              <div className="space-y-4">
                <div className="p-4 border border-gray-200 rounded-xl">
                  <label className="block text-sm font-medium text-gray-700 mb-2">表示名</label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={e => setDisplayName(e.target.value)}
                    className="w-full max-w-xs border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="p-4 border border-gray-200 rounded-xl">
                  <div className="text-sm font-medium text-gray-700 mb-3">認証情報（環境変数）</div>
                  <div className="space-y-2">
                    {[
                      { key: 'LINCOLN_ACCOUNT', desc: 'ログインアカウント名' },
                      { key: 'LINCOLN_PASSWORD', desc: 'ログインパスワード（表示しません）' },
                      { key: 'LINCOLN_BASE_URL', desc: 'リンカーンのベースURL' },
                    ].map(item => (
                      <div key={item.key} className="flex items-center gap-3 py-2 border-b border-gray-100 last:border-0">
                        <code className="text-xs bg-gray-100 px-2.5 py-1 rounded font-mono text-gray-700 w-48 flex-shrink-0">{item.key}</code>
                        <span className="text-sm text-gray-500">{item.desc}</span>
                        {item.key === 'LINCOLN_PASSWORD' ? (
                          <span className="text-xs text-gray-300 ml-auto">●●●●●●●●</span>
                        ) : (
                          <span className="text-xs text-green-600 ml-auto flex items-center gap-1">
                            <Check size={11} />
                            設定済み
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <button onClick={handleSave} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors">
                  <Save size={14} />
                  保存
                </button>
              </div>
            </TabPanel>
          )}
        </div>
      </div>
    </div>
  );
}

function TabPanel({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
      <div className="px-6 py-5 border-b border-gray-100">
        <h2 className="text-base font-semibold text-gray-900">{title}</h2>
        <p className="text-sm text-gray-500 mt-0.5">{description}</p>
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  );
}