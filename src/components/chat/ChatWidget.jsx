// 소유: WJH
import { useEffect, useRef, useState } from 'react';
import Button from '../common/Button';
import Icon from '../common/Icon';
import ChatInterface from './ChatInterface';

export default function ChatWidget() {
    const [open, setOpen] = useState(false);
    const panelRef = useRef(null);
    const buttonRef = useRef(null);

    function close() {
        setOpen(false);
        buttonRef.current?.focus();
    }

    useEffect(() => {
        if (!open) return;
        panelRef.current?.querySelector('textarea')?.focus();

        function handleKeyDown(e) {
            if (e.key === 'Escape') {
                setOpen(false);
                buttonRef.current?.focus();
            }
        }

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [open]);

    return (
        <>
            <div aria-hidden="true" className="h-20" />

            <div
                ref={panelRef}
                role="dialog"
                aria-label="챗봇"
                className={`fixed inset-0 z-40 flex-col overflow-hidden bg-white md:inset-auto md:right-6 md:bottom-24 md:h-140 md:w-95 md:rounded-panel md:shadow-modal ${open ? 'flex' : 'hidden'}`}
            >
                <div className="flex items-center justify-between border-b border-line px-5 py-2">
                    <h2 className="text-title font-bold text-ink">챗봇</h2>
                    <Button variant="ghost" size="sm" onClick={close} aria-label="챗봇 닫기">
                        <Icon name="close" />
                    </Button>
                </div>
                <div className="flex min-h-0 flex-1 flex-col p-4">
                    <ChatInterface active={open} compact />
                </div>
            </div>

            <button
                ref={buttonRef}
                type="button"
                onClick={() => setOpen((v) => !v)}
                aria-label="챗봇 열기"
                aria-expanded={open}
                className={`fixed right-4 bottom-4 z-40 h-14 w-14 items-center justify-center rounded-full bg-brand text-white shadow-modal hover:bg-brand-hover md:right-6 md:bottom-6 ${open ? 'hidden md:flex' : 'flex'}`}
            >
                <Icon name={open ? 'close' : 'chat'} className="h-6 w-6" />
            </button>
        </>
    );
}