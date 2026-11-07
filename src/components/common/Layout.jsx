// 소유: WJH (공통 레이아웃 틀)
import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
import { userService } from '../../services/userService';
import { useAuthStore } from '../../store/authStore';
import { useDocumentList } from '../../utils/useDocumentList';

/**
 * 로그인 후 모든 화면의 틀: Header + Sidebar + 본문(Outlet).
 * 문서 목록 요청은 KJH 의 useDocumentList 가 하고, 여기서는 받아서 내려 주기만 합니다.
 * 페이지는 const { refreshDocuments } = useOutletContext(); 로 사이드바 목록을 다시 받게 합니다 (명세 6장).
 * TODO(WJH): 모바일 사이드바 열림 상태를 Header(메뉴 버튼)·Sidebar(서랍)에 연결
 */
export default function Layout() {
  const { pathname } = useLocation();
  const setUser = useAuthStore((s) => s.setUser);
  const list = useDocumentList();
  const refreshDocuments = list.refresh;

  // 초대·수락·회수는 재로그인 없이 반영되므로 화면 이동 때마다 다시 받습니다 (명세 4.1)
  useEffect(() => {
    refreshDocuments();
    userService.me().then(setUser).catch(() => {});
  }, [pathname, refreshDocuments, setUser]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <Header />
      <div className="flex min-h-0 flex-1">
        <Sidebar list={list} />
        <main className="thin-scroll min-w-0 flex-1 overflow-y-auto">
          <Outlet context={{ refreshDocuments }} />
        </main>
      </div>
    </div>
  );
}
