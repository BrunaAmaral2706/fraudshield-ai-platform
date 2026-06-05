import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import GlobalSearch from '../components/GlobalSearch';
import PageTransition from '../components/ui/PageTransition';

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-[#f5f7fb] transition-colors duration-300 dark:bg-slate-950">
      <Sidebar />
      <GlobalSearch />

      <div className="pl-0 md:pl-[248px]">
        <main className="mx-auto max-w-[1440px] px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
          <PageTransition />
        </main>
      </div>
    </div>
  );
}
