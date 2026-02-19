import { BookOpen, AlertTriangle, Shield, RotateCcw, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';

const FAQ = [
  {
    q: '2FAが発生した場合はどうすればいいですか？',
    a: 'ジョブがステータス「ユーザー入力待ち」になると、画面上部に大きなバナーが表示されます。自動で開いたブラウザの2FA入力フォームにコードを入力し、ブラウザでログインが完了したら、バナー内のコード入力欄に同じコードを入力して「入力完了・再開」ボタンを押してください。',
  },
  {
    q: '検証が失敗した場合、差分はどこで確認できますか？',
    a: '本ツールは差分表を表示しません。これは意図した仕様です。「失敗（FAILED）」と停止理由のみ表示されます。実際の差分を確認するには、成果物リンクから出力されたHTMLや詳細ログを参照してください。',
  },
  {
    q: 'ジョブが途中で止まった場合はどうすればいいですか？',
    a: 'ジョブ詳細画面の「再開（resume）」ボタン、または「このステップから再試行」ボタンを使用してください。失敗したステップから自動的に再開します。',
  },
  {
    q: 'カレンダーのA/Bはどう決めますか？',
    a: 'ExcelのA列が単泊用、B列が連泊用の料金データに対応しています。ただしExcel上では自動判定できないため、ウィザードのStep3で手動で紐づけてください。施設によってA/Bの意味が異なる場合があります。',
  },
  {
    q: '本番環境と検証環境の違いは何ですか？',
    a: '本番環境は実際のリンカーンシステムに反映されます。検証環境は動作確認用のステージング環境です。必ず検証環境でテストしてから本番環境で実行してください。画面右上のトグルで切り替えできます。',
  },
];

const FLOW_STEPS = [
  { icon: '📁', label: 'Excelアップロード', desc: '料金データのExcelファイルをアップロード' },
  { icon: '🏨', label: '施設確認', desc: '自動推定された施設を確認・修正' },
  { icon: '📅', label: 'カレンダー紐づけ', desc: 'A/BをリンカーンのカレンダーにマッピングS' },
  { icon: '📋', label: 'プラン選択', desc: '反映対象のプランを選択' },
  { icon: '✅', label: '実行前確認', desc: '内容を確認して「実行開始」' },
  { icon: '🚀', label: 'ジョブ実行', desc: 'ステップごとに自動で処理' },
];

export function Help() {
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);

  return (
    <div className="p-8 max-w-[860px] mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">運用ガイド・ヘルプ</h1>
        <p className="text-sm text-gray-500 mt-1">使い方・よくある質問・トラブルシューティング</p>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { icon: Shield, label: '2FA対応手順', color: 'text-amber-600 bg-amber-50 border-amber-200' },
          { icon: RotateCcw, label: 'ジョブ再開手順', color: 'text-blue-600 bg-blue-50 border-blue-200' },
          { icon: AlertTriangle, label: 'エラー時の対応', color: 'text-red-600 bg-red-50 border-red-200' },
        ].map(item => (
          <div key={item.label} className={`flex items-center gap-3 p-4 rounded-xl border ${item.color} cursor-pointer hover:opacity-80 transition-opacity`}>
            <item.icon size={20} />
            <span className="font-medium text-sm">{item.label}</span>
          </div>
        ))}
      </div>

      {/* Workflow */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-8">
        <div className="px-6 py-5 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-800">基本的な使い方フロー</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-3 gap-4">
            {FLOW_STEPS.map((s, i) => (
              <div key={i} className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
                <div className="w-7 h-7 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold text-indigo-700">
                  {i + 1}
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-800">{s.icon} {s.label}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{s.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Important notes */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-8">
        <div className="flex items-start gap-3">
          <AlertTriangle size={20} className="text-amber-600 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-amber-900 mb-2">重要な注意事項</h3>
            <ul className="space-y-2 text-sm text-amber-800">
              <li className="flex items-start gap-2">
                <span className="mt-1 w-1.5 h-1.5 bg-amber-500 rounded-full flex-shrink-0" />
                <span><strong>完全一致のみ成功</strong>: 検証で1件でも不一致があると「失敗（FAILED）」で即停止します</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 w-1.5 h-1.5 bg-amber-500 rounded-full flex-shrink-0" />
                <span><strong>本番実行は慎重に</strong>: 本番環境での実行は直接リンカーンに反映されます</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 w-1.5 h-1.5 bg-amber-500 rounded-full flex-shrink-0" />
                <span><strong>2FA発生時はブラウザを閉じない</strong>: 2FA入力中はブラウザを閉じないでください</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-6 py-5 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-800">よくある質問</h2>
        </div>
        <div className="divide-y divide-gray-100">
          {FAQ.map((faq, i) => (
            <div key={i}>
              <button
                onClick={() => setOpenFAQ(openFAQ === i ? null : i)}
                className="w-full flex items-start justify-between gap-4 px-6 py-4 text-left hover:bg-gray-50 transition-colors"
              >
                <span className="font-medium text-sm text-gray-800">{faq.q}</span>
                {openFAQ === i ? (
                  <ChevronUp size={16} className="text-gray-400 flex-shrink-0 mt-0.5" />
                ) : (
                  <ChevronDown size={16} className="text-gray-400 flex-shrink-0 mt-0.5" />
                )}
              </button>
              {openFAQ === i && (
                <div className="px-6 pb-4 text-sm text-gray-600 leading-relaxed">{faq.a}</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
