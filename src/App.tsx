import React, { useState, useRef } from 'react';
import { FirebaseProvider, useFirebase } from './components/FirebaseProvider';
import SheepDashboard from './components/SheepDashboard';
import LambDashboard from './components/LambDashboard';
import HealthCareDashboard from './components/HealthCareDashboard';
import AIAssistant from './components/AIAssistant';
import { LayoutDashboard, Baby, HeartPulse, Sparkles, LogOut, Menu, X, Download, Upload, Wheat, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

function AppContent() {
  const { user, loading, login, logout, exportBackup, importBackup, reminders } = useFirebase();
  const [activeTab, setActiveTab] = useState<'sheep' | 'lambs' | 'health' | 'ai'>('sheep');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const activeRemindersCount = reminders ? reminders.filter(r => !r.completed).length : 0;

  // Login Form States
  const [shepherdName, setShepherdName] = useState('');
  const [farmName, setFarmName] = useState('');
  const [showImportResult, setShowImportResult] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const sidebarFileInputRef = useRef<HTMLInputElement>(null);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login(shepherdName || "Çiftçi", farmName || "Yeşil Vadi Çiftliği");
  };

  const handleDownloadBackup = () => {
    const dataStr = exportBackup();
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `kuzu_takip_yedek_${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const handleBackupUpload = (e: React.ChangeEvent<HTMLInputElement>, isFromLogin = false) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const success = importBackup(content);
      if (success) {
        setShowImportResult("Yedek başarıyla yüklendi!");
        setTimeout(() => setShowImportResult(null), 3000);
        if (!isFromLogin) {
          alert("Çiftlik verileri başarıyla geri yüklendi!");
        }
      } else {
        alert("Geçersiz yedek dosyası!");
      }
    };
    reader.readAsText(file);
  };

  if (loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-[#f8f9fa]">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-black border-t-transparent rounded-full mb-4"
        />
        <p className="text-xs font-mono uppercase tracking-[0.2em] text-gray-400">Sistem Yükleniyor</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8f9fa] p-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full bg-white p-8 md:p-12 rounded-[2.5rem] shadow-2xl border border-gray-100 space-y-8"
        >
          <div className="flex justify-center">
            <div className="bg-black text-white p-5 rounded-3xl shadow-xl flex items-center gap-2">
              <Wheat size={32} className="text-amber-400" />
              <Sparkles size={16} className="animate-pulse" />
            </div>
          </div>
          
          <div className="text-center space-y-2">
            <h1 className="text-4xl font-bold font-sans tracking-tight italic">Kuzu Takip</h1>
            <p className="text-gray-500 font-sans text-sm leading-relaxed">
              İnternetsiz, kesintisiz kuzu ve sürü takip sistemi. Verileriniz tamamen tarayıcınızda güvendedir.
            </p>
          </div>

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-mono uppercase tracking-wider text-gray-400 block font-semibold">Çiftçi İsmi / Shepherd Name</label>
              <input 
                required
                type="text" 
                placeholder="Örn: Ekin Zülal"
                value={shepherdName}
                onChange={(e) => setShepherdName(e.target.value)}
                className="w-full p-3 bg-gray-50 rounded-2xl border border-gray-100 outline-none focus:ring-2 focus:ring-black/10 transition-shadow font-sans text-sm"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-mono uppercase tracking-wider text-gray-400 block font-semibold">Çiftlik Adı / Farm Name</label>
              <input 
                required
                type="text" 
                placeholder="Örn: Yeşil Vadi Besi Çiftliği"
                value={farmName}
                onChange={(e) => setFarmName(e.target.value)}
                className="w-full p-3 bg-gray-50 rounded-2xl border border-gray-100 outline-none focus:ring-2 focus:ring-black/10 transition-shadow font-sans text-sm"
              />
            </div>
            <button 
              type="submit"
              className="w-full bg-black text-white py-3.5 rounded-2xl font-bold hover:bg-gray-800 transition-all flex items-center justify-center gap-3 shadow-md"
            >
              Uygulamayı Aç
              <ArrowRight size={18} />
            </button>
          </form>

          {/* Import Backup Options */}
          <div className="pt-6 border-t border-gray-100 text-center space-y-3">
            <span className="text-[10px] uppercase font-mono tracking-widest text-gray-400 block">Daha Önceki Yedeği Geri Yükle</span>
            <input 
              type="file" 
              accept=".json"
              ref={fileInputRef}
              onChange={(e) => handleBackupUpload(e, true)}
              className="hidden"
            />
            <button 
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-xl text-xs font-semibold text-gray-600 transition-colors inline-flex items-center gap-2 border border-gray-100"
            >
              <Upload size={14} />
              JSON Yedek Dosyası Seç
            </button>
            {showImportResult && (
              <p className="text-xs text-green-600 font-semibold">{showImportResult}</p>
            )}
          </div>

          <p className="text-[9px] text-gray-400 font-mono uppercase tracking-widest text-center leading-loose">
            Yerel Hafıza • Güvenli Veri Saklama <br /> Sürü Yönetim Portalı
          </p>
        </motion.div>
      </div>
    );
  }

  const NavItem = ({ id, icon: Icon, label, badge }: { id: typeof activeTab, icon: any, label: string, badge?: number }) => (
    <button 
      onClick={() => { setActiveTab(id); setIsMobileMenuOpen(false); }}
      className={`flex items-center justify-between w-full p-4 rounded-2xl transition-all ${
        activeTab === id ? 'bg-black text-white shadow-xl translate-x-1.5' : 'text-gray-500 hover:bg-gray-50'
      }`}
    >
      <div className="flex items-center gap-4">
        <Icon size={20} />
        <span className="font-bold text-sm tracking-tight">{label}</span>
      </div>
      {badge !== undefined && badge > 0 && (
        <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
          {badge}
         </span>
      )}
    </button>
  );

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex">
      {/* Sidebar Desktop */}
      <aside className="hidden lg:flex w-72 bg-white border-r border-gray-100 flex-col p-8 fixed h-full z-40">
        <div className="flex items-center gap-3 mb-10 px-2">
          <div className="bg-black text-white p-2.5 rounded-xl flex items-center gap-1">
            <Wheat size={18} className="text-amber-400" />
            <Sparkles size={12} />
          </div>
          <div className="leading-tight">
            <span className="text-lg font-bold italic tracking-tight block">Kuzu Takip</span>
            <span className="text-[9px] uppercase tracking-wider text-gray-400 font-mono font-bold">{user.farmName}</span>
          </div>
        </div>

        <nav className="flex-1 space-y-2">
          <NavItem id="sheep" icon={LayoutDashboard} label="Sürüm" />
          <NavItem id="lambs" icon={Baby} label="Kuzularım" />
          <NavItem id="health" icon={HeartPulse} label="Sağlık & Bakım" badge={activeRemindersCount} />
          <NavItem id="ai" icon={Sparkles} label="Yapay Zeka" />
        </nav>

        {/* Backups & Actions */}
        <div className="py-6 border-y border-gray-50 space-y-1">
          <button 
            onClick={handleDownloadBackup}
            className="flex items-center gap-3 text-xs font-semibold text-gray-600 hover:text-black py-2 px-3 w-full rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Download size={14} />
            Sürü Yedeği İndir (JSON)
          </button>
          
          <input 
            type="file" 
            accept=".json"
            ref={sidebarFileInputRef}
            onChange={(e) => handleBackupUpload(e, false)}
            className="hidden"
          />
          <button 
            onClick={() => sidebarFileInputRef.current?.click()}
            className="flex items-center gap-3 text-xs font-semibold text-gray-600 hover:text-black py-2 px-3 w-full rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Upload size={14} />
            Yedek Geri Yükle
          </button>
        </div>

        <div className="pt-6">
          <div className="flex items-center gap-3 mb-6 px-2">
            <img src={user.photoURL || ''} alt="avatar" className="w-10 h-10 rounded-full border-2 border-gray-100" />
            <div className="overflow-hidden">
              <p className="text-sm font-bold truncate">{user.displayName}</p>
              <p className="text-[10px] text-gray-400 truncate">{user.email}</p>
            </div>
          </div>
          <button 
            onClick={logout}
            className="flex items-center gap-4 w-full p-4 rounded-2xl text-red-500 hover:bg-red-50 transition-all font-bold text-sm"
          >
            <LogOut size={20} />
            Güvenli Çıkış
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 lg:ml-72 min-h-screen relative">
        {/* Mobile Header */}
        <header className="lg:hidden h-16 bg-white border-b border-gray-100 flex items-center justify-between px-6 sticky top-0 z-30">
          <div className="flex items-center gap-2">
            <span className="font-bold italic">Kuzu Takip</span>
            <span className="text-[10px] font-mono text-gray-400">({user.farmName})</span>
          </div>
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </header>

        {/* Mobile menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="lg:hidden absolute top-16 left-0 right-0 bg-white border-b border-gray-100 overflow-hidden z-20 shadow-xl"
            >
              <div className="p-6 space-y-2">
                <NavItem id="sheep" icon={LayoutDashboard} label="Sürüm" />
                <NavItem id="lambs" icon={Baby} label="Kuzularım" />
                <NavItem id="health" icon={HeartPulse} label="Sağlık & Bakım" badge={activeRemindersCount} />
                <NavItem id="ai" icon={Sparkles} label="Yapay Zeka" />
                
                <div className="py-2 border-t border-gray-100 my-2 space-y-2">
                  <button 
                    onClick={handleDownloadBackup}
                    className="flex items-center gap-3 text-xs font-semibold text-gray-600 w-full px-4 py-2"
                  >
                    <Download size={14} />
                    Sürü Yedeği İndir
                  </button>
                </div>

                <button onClick={logout} className="w-full p-4 text-left text-red-500 font-bold text-sm">Çıkış Yap</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="max-w-6xl mx-auto py-4 px-2">
          {activeTab === 'sheep' && <SheepDashboard />}
          {activeTab === 'lambs' && <LambDashboard />}
          {activeTab === 'health' && <HealthCareDashboard />}
          {activeTab === 'ai' && <AIAssistant />}
        </div>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <FirebaseProvider>
      <AppContent />
    </FirebaseProvider>
  );
}
