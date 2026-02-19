import { Outlet, NavLink } from 'react-router';
import { Toaster } from 'sonner';
import { Plus, History, Settings, HelpCircle, Code2, Building2, User, Zap } from 'lucide-react';
import { useApp } from '../context/AppContext';

const NAV_MAIN = [
  { label: '新規ジョブ', path: '/jobs/new', icon: Plus },
  { label: 'ジョブ履歴', path: '/history', icon: History },
  { label: '設定', path: '/settings', icon: Settings },
  { label: '運用・ヘルプ', path: '/help', icon: HelpCircle },
];

const NAV_DEV = [
  { label: '開発者向け', path: '/developer', icon: Code2 },
];

export function Layout() {
  const { currentFacility, currentAccount, currentEnvironment, setCurrentEnvironment } = useApp();

  return (
    <div className="flex h-screen overflow-hidden" style={{ fontFamily: "'Noto Sans JP', Inter, sans-serif" }}>
      {/* Sidebar */}
      <aside
        className="w-[220px] flex-shrink-0 flex flex-col"
        style={{ position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 40, backgroundColor: '#1a1d21' }}
      >
        {/* Logo */}
        <div className="px-4 py-4 border-b" style={{ borderColor: '#2d3138' }}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center flex-shrink-0">
              <Zap size={14} className="text-white" />
            </div>
            <div>
              <div className="text-white text-sm font-semibold leading-tight">Lincoln Price</div>
              <div className="text-xs" style={{ color: '#7a7e8a' }}>Reflected ツール</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-3 overflow-y-auto">
          <p className="px-3 py-1 text-xs uppercase tracking-wider mb-1" style={{ color: '#7a7e8a' }}>
            メインメニュー
          </p>
          {NAV_MAIN.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors mb-0.5`
              }
              style={({ isActive }) => ({
                backgroundColor: isActive ? '#35383d' : 'transparent',
                color: isActive ? '#ffffff' : '#cccdd0',
              })}
            >
              <item.icon size={16} />
              <span>{item.label}</span>
            </NavLink>
          ))}

          <p className="px-3 py-1 text-xs uppercase tracking-wider mt-6 mb-1" style={{ color: '#7a7e8a' }}>
            開発者
          </p>
          {NAV_DEV.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              className={() => `flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors mb-0.5`}
              style={({ isActive }) => ({
                backgroundColor: isActive ? '#35383d' : 'transparent',
                color: isActive ? '#ffffff' : '#7a7e8a',
              })}
            >
              <item.icon size={16} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-4 py-3 border-t" style={{ borderColor: '#2d3138' }}>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center text-white text-xs font-bold">
              {currentAccount.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="text-sm" style={{ color: '#cccdd0' }}>{currentAccount}</div>
              <div className="text-xs" style={{ color: '#7a7e8a' }}>v1.0.0-prototype</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col" style={{ marginLeft: '220px' }}>
        {/* Header */}
        <header className="h-14 bg-white border-b border-gray-200 flex items-center px-6 gap-4 flex-shrink-0 sticky top-0 z-30">
          <div className="flex-1" />

          {/* Environment toggle */}
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setCurrentEnvironment('production')}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                currentEnvironment === 'production' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              本番
            </button>
            <button
              onClick={() => setCurrentEnvironment('staging')}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                currentEnvironment === 'staging' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              検証
            </button>
          </div>

          {currentEnvironment === 'staging' && (
            <span className="bg-amber-100 text-amber-700 text-xs font-medium px-2 py-1 rounded-full border border-amber-200">
              検証環境
            </span>
          )}

          <div className="flex items-center gap-1.5 text-sm text-gray-700 border-l border-gray-200 pl-4">
            <Building2 size={14} className="text-gray-400 flex-shrink-0" />
            <span className="font-medium">{currentFacility.name}</span>
            <span className="text-gray-400 text-xs">({currentFacility.id})</span>
          </div>

          <div className="flex items-center gap-1.5 text-sm text-gray-600 border-l border-gray-200 pl-4">
            <User size={14} className="text-gray-400 flex-shrink-0" />
            <span>{currentAccount}</span>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto bg-[#f8f9fa]">
          <Outlet />
        </main>
      </div>

      <Toaster position="top-right" richColors />
    </div>
  );
}
