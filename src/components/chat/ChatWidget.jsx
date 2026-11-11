// 소유: WJH
import { useEffect, useRef, useState } from 'react';
import Button from '../common/Button';
import Icon from '../common/Icon';
import ChatInterface from './ChatInterface';
import { useChatStore } from '../../store/chatStore';

export default function ChatWidget() {
    const open = useChatStore((s) => s.widgetOpen);
    const setOpen = useChatStore((s) => s.setWidgetOpen);
    const [isMaximized, setIsMaximized] = useState(false);
    const panelRef = useRef(null);
    const buttonRef = useRef(null);
    const wasOpenRef = useRef(false);

    // 패널이 닫힌 뒤에 포커스를 아이콘으로 돌려줍니다 (명세 5.2). 모바일은 패널이 열려 있는 동안 아이콘이 숨겨져 있어서
    // 닫는 순간에 focus() 를 부르면 아직 보이지 않는 요소라 실패하므로, 아이콘이 다시 그려진 다음에 부릅니다
    useEffect(() => {
        if (open) {
            wasOpenRef.current = true;
            return;
        }
        if (wasOpenRef.current) {
            wasOpenRef.current = false;
            buttonRef.current?.focus();
        }
    }, [open]);

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
    }, [open, setOpen]);

    return (
        <>
            <div
                ref={panelRef}
                role="dialog"
                aria-label="챗봇"
                className={`fixed inset-0 z-40 flex-col overflow-hidden bg-white transition-all duration-200 md:rounded-panel md:shadow-modal ${
                    isMaximized
                        ? 'md:top-18 md:bottom-6 md:right-6 md:left-6 lg:left-76 md:h-auto md:w-auto md:rounded-2xl'
                        : 'md:inset-auto md:right-6 md:bottom-24 md:h-140 md:w-95'
                } ${open ? 'flex' : 'hidden'}`}
            >
                <div className="flex items-center justify-between border-b border-line px-5 py-2">
                    <h2 className="text-title font-bold text-ink">챗봇</h2>
                    <div className="flex items-center gap-1">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setIsMaximized((v) => !v)}
                            aria-label={isMaximized ? '원래 크기로 축소' : '화면 키우기'}
                            title={isMaximized ? '원래 크기로 축소' : '화면 키우기'}
                            className="!px-1.5 !py-1"
                        >
                            <Icon name={isMaximized ? 'restore' : 'square'} className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={close} aria-label="챗봇 닫기" className="!px-1.5 !py-1">
                            <Icon name="close" className="h-4 w-4" />
                        </Button>
                    </div>
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