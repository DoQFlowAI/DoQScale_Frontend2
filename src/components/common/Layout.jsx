// 소유: WJH (공통 레이아웃 틀)
import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
import { userService } from '../../services/userService';
import { useAuthStore } from '../../store/authStore';
import { useDocumentList } from '../../utils/useDocumentList';

export default function Layout() {
  const { pathname } = useLocation();
  const setUser = useAuthStore((s) => s.setUser);
  const list = useDocumentList();
  const refreshDocuments = list.refresh;
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  useEffect(() => {
    refreshDocuments();
    userService.me().then(setUser).catch(() => {});
  }, [pathname, refreshDocuments, setUser]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <Header menuOpen={sidebarOpen} onMenuClick={() => setSidebarOpen(true)} />
      <div className="flex min-h-0 flex-1">
        <Sidebar list={list} open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="thin-scroll min-w-0 flex-1 overflow-y-auto">
          <Outlet context={{ refreshDocuments }} />
        </main>
      </div>
    </div>
  );
}
