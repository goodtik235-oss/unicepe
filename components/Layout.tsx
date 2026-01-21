
import React from 'react';
import { LayoutDashboard, FileText, MessageSquare, Info, Globe, Menu, X } from 'lucide-react';
import { THEME } from '../constants';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  lang: 'EN' | 'UR';
  toggleLang: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab, lang, toggleLang }) => {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

  const menuItems = [
    { id: 'dashboard', label: lang === 'EN' ? 'Dashboard' : 'ڈیش بورڈ', icon: LayoutDashboard },
    { id: 'report', label: lang === 'EN' ? 'Report Issue' : 'مسئلہ رپورٹ کریں', icon: FileText },
    { id: 'feedback', label: lang === 'EN' ? 'Feedback' : 'فیڈ بیک', icon: MessageSquare },
    { id: 'impact', label: lang === 'EN' ? 'Impact' : 'اثرات', icon: Info },
  ];

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50">
      {/* Mobile Header */}
      <header className="md:hidden bg-[#00ADEF] text-white p-4 flex justify-between items-center sticky top-0 z-50 shadow-md">
        <div className="flex items-center gap-2">
          <img src="https://picsum.photos/40/40" alt="UNICEF Logo" className="w-8 h-8 rounded-full" />
          <h1 className="font-bold text-lg">UNICEF Pakistan</h1>
        </div>
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
          {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </header>

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-slate-200 transform transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        md:relative md:translate-x-0
      `}>
        <div className="p-6">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 bg-[#00ADEF] rounded-lg flex items-center justify-center text-white font-bold text-xl">
              U
            </div>
            <div>
              <h1 className="font-bold text-slate-800 text-sm leading-tight">UNICEF</h1>
              <p className="text-xs text-slate-500 font-medium tracking-wider uppercase">Pakistan</p>
            </div>
          </div>

          <nav className="space-y-2">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setIsSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  activeTab === item.id 
                    ? 'bg-[#00ADEF] text-white shadow-lg shadow-cyan-100' 
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <item.icon size={20} />
                <span className="font-medium">{item.label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="absolute bottom-0 w-full p-6 border-t border-slate-100">
          <button 
            onClick={toggleLang}
            className="flex items-center gap-2 text-sm font-semibold text-[#00ADEF] hover:bg-cyan-50 w-full px-4 py-2 rounded-lg transition-colors"
          >
            <Globe size={16} />
            {lang === 'EN' ? 'اردو میں دیکھیں' : 'Switch to English'}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
