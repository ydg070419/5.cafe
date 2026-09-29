import React, { useState, useEffect } from 'react';
import { 
  X, 
  Check, 
  Copy, 
  ExternalLink, 
  Database, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle2, 
  Trash2 
} from 'lucide-react';
import { 
  getSupabaseConfig, 
  saveSupabaseConfig, 
  clearSupabaseConfig, 
  checkSupabaseConnection 
} from '../lib/supabase';

interface SupabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfigChanged: () => void;
  sqlQuery: string;
}

export const SupabaseModal: React.FC<SupabaseModalProps> = ({
  isOpen,
  onClose,
  onConfigChanged,
  sqlQuery,
}) => {
  const [url, setUrl] = useState('');
  const [anonKey, setAnonKey] = useState('');
  const [source, setSource] = useState<'env' | 'localStorage' | 'none'>('none');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    connected: boolean;
    tableExists: boolean;
    message: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const cfg = getSupabaseConfig();
      setUrl(cfg.url);
      setAnonKey(cfg.anonKey);
      setSource(cfg.source);
      setTestResult(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTestAndSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim() || !anonKey.trim()) {
      alert('Supabase URL과 Anon Key를 모두 입력해주세요.');
      return;
    }

    setTesting(true);
    setTestResult(null);

    // 임시 저장 후 연결 확인
    saveSupabaseConfig(url.trim(), anonKey.trim());
    const result = await checkSupabaseConnection();
    setTestResult(result);
    setTesting(false);

    if (result.connected) {
      onConfigChanged();
    }
  };

  const handleClear = () => {
    if (confirm('저장된 Supabase 연결 설정을 초기화하시겠습니까?')) {
      clearSupabaseConfig();
      setUrl('');
      setAnonKey('');
      setSource('none');
      setTestResult(null);
      onConfigChanged();
    }
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(sqlQuery);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-[#ede0d4] w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden animate-fadeIn">
        {/* 모달 헤더 */}
        <div className="px-6 py-4 border-b border-[#f3ece2] flex items-center justify-between bg-gradient-to-r from-[#faf6f0] to-white">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-[#6b4226]/10 text-[#6b4226] rounded-lg">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-[#5d4037] text-base leading-tight">
                Supabase 연동 설정
              </h2>
              <p className="text-xs text-[#8d6e63]">
                실시간 주문 데이터베이스를 연결합니다.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#8d6e63] hover:text-[#5d4037] hover:bg-[#ede0d4]/50 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 모달 바디 (스크롤 가능) */}
        <div className="p-6 overflow-y-auto space-y-5 text-sm">
          {/* 가이드 안내 */}
          <div className="p-3.5 bg-[#fbf8f5] rounded-xl border border-[#ede0d4] text-xs text-[#5d4037] space-y-1.5 leading-relaxed">
            <div className="font-bold flex items-center justify-between text-[#6b4226]">
              <span>연동 방법 4단계 안내:</span>
              <a
                href="https://supabase.com/dashboard"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-[11px] text-[#6b4226] underline hover:text-[#855331]"
              >
                Supabase 콘솔 열기 <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <ol className="list-decimal list-inside space-y-1 text-[#6d4c41]">
              <li>Supabase 프로젝트 생성 (또는 기존 프로젝트 접속)</li>
              <li>대시보드 <strong>Project Settings → API</strong>에서 URL 및 anon key 복사</li>
              <li>하단의 <strong>테이블 생성 SQL</strong>을 Supabase <strong>SQL Editor</strong>에 실행</li>
              <li>아래 입력란에 정보를 넣고 <strong>[저장 및 연결 테스트]</strong> 클릭</li>
            </ol>
          </div>

          {/* 설정 폼 */}
          <form onSubmit={handleTestAndSave} className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-[#5d4037]">
                  Project URL <span className="text-red-500">*</span>
                </label>
                {source === 'env' && (
                  <span className="text-[11px] px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded font-medium">
                    .env 파일 적용 중
                  </span>
                )}
              </div>
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://xyzcompany.supabase.co"
                className="cafe-input text-xs font-mono"
                required
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-[#5d4037]">
                  Anon Public Key <span className="text-red-500">*</span>
                </label>
              </div>
              <input
                type="password"
                value={anonKey}
                onChange={(e) => setAnonKey(e.target.value)}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                className="cafe-input text-xs font-mono"
                required
              />
            </div>

            {/* 테스트 결과 표시 */}
            {testResult && (
              <div
                className={`p-3 rounded-xl border flex items-start gap-2.5 text-xs ${
                  testResult.connected && testResult.tableExists
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : testResult.connected && !testResult.tableExists
                    ? 'bg-amber-50 border-amber-200 text-amber-800'
                    : 'bg-rose-50 border-rose-200 text-rose-800'
                }`}
              >
                {testResult.connected && testResult.tableExists ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                )}
                <div>
                  <div className="font-bold">
                    {testResult.connected && testResult.tableExists
                      ? '연결 성공!'
                      : testResult.connected
                      ? '테이블 생성 필요'
                      : '연결 실패'}
                  </div>
                  <div className="mt-0.5 leading-relaxed text-[11px]">
                    {testResult.message}
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center gap-2 pt-1">
              <button
                type="submit"
                disabled={testing}
                className="flex-1 py-2.5 px-4 rounded-lg bg-[#6b4226] text-white hover:bg-[#855331] font-bold text-xs shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {testing ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    연결 확인 중...
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    저장 및 연결 테스트
                  </>
                )}
              </button>

              {(url || anonKey) && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="py-2.5 px-3 rounded-lg border border-[#ede0d4] text-[#8d6e63] hover:text-red-600 hover:bg-red-50 hover:border-red-200 text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                  title="설정 초기화"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  초기화
                </button>
              )}
            </div>
          </form>

          {/* SQL 쿼리 복사 섹션 */}
          <div className="pt-3 border-t border-[#f3ece2]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-[#5d4037] flex items-center gap-1">
                cafe_menu 테이블 생성 SQL
              </span>
              <button
                type="button"
                onClick={handleCopySql}
                className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded bg-[#f7efe5] hover:bg-[#ede0d4] text-[#6b4226] font-semibold transition-colors cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-600" />
                    <span className="text-emerald-700">복사 완료!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>SQL 복사하기</span>
                  </>
                )}
              </button>
            </div>
            <pre className="p-3 bg-[#2d2522] text-[#f5ebd7] rounded-xl text-[11px] leading-relaxed font-mono overflow-x-auto max-h-40 border border-[#3e2723]">
              {sqlQuery}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
