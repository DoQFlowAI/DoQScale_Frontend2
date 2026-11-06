import { useEffect, useState } from 'react';
import ChatInterface from './ChatInterface';

/**
 * 문서 상세에만 두는 오른쪽 아래 챗봇. 패널은 닫아도 마운트를 유지해
 * 받고 있는 답변과 대화가 끊기지 않는다 (페이지를 떠나면 언마운트되며 연결이 끊긴다).
 */
export default function ChatWidget() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <>
      <div
        role="dialog"
        aria-label="챗봇"
        aria-hidden={!open}
        hidden={!open}
        className="fixed inset-0 z-40 flex flex-col bg-white shadow-[0_8px_32px_rgba(0,0,0,0.16)] sm:inset-auto sm:bottom-24 sm:right-6 sm:h-[560px] sm:w-[380px] sm:rounded-3xl"
      >
        <div className="flex shrink-0 items-center px-5 pt-4 pb-3">
          <h2 className="flex-1 text-[18px] font-bold text-ink">챗봇</h2>
          <button
            type="button"
            aria-label="챗봇 닫기"
            onClick={() => setOpen(false)}
            className="-mr-2 flex h-11 w-11 items-center justify-center text-[18px] text-muted hover:text-ink"
          >
            ✕
          </button>
        </div>
        <div className="h-px shrink-0 bg-line" />
        <div className="min-h-0 flex-1 px-4 pb-4">
          <ChatInterface visible={open} showTitle={false} />
        </div>
      </div>

      <button
        type="button"
        aria-label="챗봇 열기"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={`fixed bottom-6 right-4 z-50 h-14 w-14 items-center justify-center rounded-[28px] bg-brand text-[13px] font-bold text-white shadow-[0_4px_16px_rgba(0,0,0,0.25)] hover:bg-[#164538] sm:right-6 ${
          open ? 'hidden sm:flex' : 'flex'
        }`}
      >
        챗봇
      </button>
    </>
  );
}
