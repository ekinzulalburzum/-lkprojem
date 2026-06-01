import React, { useState } from 'react';
import { useFirebase } from './FirebaseProvider';
import { Reminder, HealthRecord, AnimalStatus, Gender } from '../types';
import { 
  Bell, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  HeartPulse, 
  Activity, 
  Baby, 
  Tag, 
  Sparkles, 
  CalendarDays,
  Calendar,
  Layers,
  Search,
  Check,
  CircleAlert
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Recommended Turkish standard sheep vaccine protocol
const VACCINE_PROTOCOLS = [
  {
    name: "Enterotoksemi (Çiftleme Aşısı)",
    dosage: "2 cc / Kulak arkası",
    frequency: "Yılda 2 kez (Özellikle meraya çıkış öncesi ve sonbaharda)",
    purpose: "Yem değişikliğine bağlı ani ölümleri (Kılçık, konak vb.) önler.",
    recommendedAge: "Gebe koyunlara doğuma 3-4 hafta kala",
  },
  {
    name: "Şap Aşısı (Aft)",
    dosage: "2 cc / Kas içi",
    frequency: "Yılda 2 kez (Genellikle ilkbahar ve sonbahar kampanyaları)",
    purpose: "Ağız ve tırnaklarda yara yapan bulaşıcı şap hastalığından korur.",
    recommendedAge: "Tüm sürüye yılda iki kez",
  },
  {
    name: "Çiçek Aşısı",
    dosage: "0.5 cc / Deri altı",
    frequency: "Yılda 1 kez (Genellikle sonbaharda)",
    purpose: "Yüksek ateş ve deride çiçek lezyonlarına yol açan viral salgınları önler.",
    recommendedAge: "3 aylıktan büyük tüm koyun ve kuzulara",
  },
  {
    name: "Brusella Aşısı (Rev-1)",
    dosage: "Göz damlası veya deri altı",
    frequency: "Hayat boyu 1 kez (Genç dişilere koruma amaçlı)",
    purpose: "Yavru atmayı önler, insan sağlığı için zoonoz riskini düşürür.",
    recommendedAge: "3-6 aylık dişi kuzu ve toklulara",
  },
  {
    name: "Ecthyma (Ağız Yarası / Kör Çiçek) Aşısı",
    dosage: "Çizme metodu ile",
    frequency: "Yılda 1 kez",
    purpose: "Kuzu ağızlarında emmeyi engelleyen lezyonları engeller.",
    recommendedAge: "Doğumu takiben ilk günlerde veya gebelere",
  },
  {
    name: "Parazit İlaçlaması (İç & Dış)",
    dosage: "Hap / Enjeksiyon / Dökme",
    frequency: "Senede 3-4 kez (Ara mevsim geçişlerinde)",
    purpose: "Kıl kurtları, akciğer kurtları, kene ve bitlerle mücadele için.",
    recommendedAge: "Sütten kesilen kuzular ve tüm sürüye",
  }
];

export default function HealthCareDashboard() {
  const { 
    sheep, 
    lambs, 
    healthRecords, 
    addHealthRecord, 
    deleteHealthRecord,
    reminders,
    addReminder,
    deleteReminder,
    toggleReminder
  } = useFirebase();

  const [activeSubTab, setActiveSubTab] = useState<'reminders' | 'protocols' | 'history'>('reminders');
  
  // Search and Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [recordTypeFilter, setRecordTypeFilter] = useState('ALL');

  // New Reminder Form State
  const [isAddingReminder, setIsAddingReminder] = useState(false);
  const [newRem, setNewRem] = useState({
    animalId: 'flock',
    title: '',
    type: 'Aşı' as Reminder['type'],
    date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  // Handle reminder submit
  const handleCreateReminder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRem.title) return;

    addReminder({
      animalId: newRem.animalId,
      title: newRem.title,
      type: newRem.type,
      date: newRem.date,
      notes: newRem.notes
    });

    setIsAddingReminder(false);
    setNewRem({
      animalId: 'flock',
      title: '',
      type: 'Aşı',
      date: new Date().toISOString().split('T')[0],
      notes: ''
    });
  };

  // Helper: Find name of the animal
  const getAnimalName = (id: string) => {
    if (id === 'flock') return 'Tüm Sürü (Ortak)';
    const foundSheep = sheep.find(s => s.id === id);
    if (foundSheep) return `${foundSheep.name || 'Uygulandı'} (Koyun: ${foundSheep.id})`;
    const foundLamb = lambs.find(l => l.tagId === id);
    if (foundLamb) return `Kuzu (${foundLamb.tagId})`;
    return id;
  };

  // Schedule one of the protocol vaccination directly as a reminder
  const handleScheduleProtocol = (protocolName: string) => {
    setNewRem({
      animalId: 'flock',
      title: `Sürü Geneli - ${protocolName}`,
      type: 'Aşı',
      date: new Date().toISOString().split('T')[0],
      notes: 'Önerilen aşı takvimi uyarınca takvimlendirildi.'
    });
    setIsAddingReminder(true);
    setActiveSubTab('reminders');
  };

  // Filtered lists
  const upcomingReminders = reminders
    .filter(r => !r.completed)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
  const completedReminders = reminders
    .filter(r => r.completed)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const filteredHistory = healthRecords.filter(r => {
    const animalName = getAnimalName(r.animalId).toLowerCase();
    const typeMatch = recordTypeFilter === 'ALL' || r.type === recordTypeFilter;
    const searchMatch = 
      r.animalId.toLowerCase().includes(searchTerm.toLowerCase()) || 
      r.medicine?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      animalName.includes(searchTerm.toLowerCase());
    return typeMatch && searchMatch;
  });

  // Calculate status counters
  const sickCount = sheep.filter(s => s.status === AnimalStatus.Sick).length;
  const overdueRemindersCount = upcomingReminders.filter(r => {
    const today = new Date().toISOString().split('T')[0];
    return r.date < today;
  }).length;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Title */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-sans tracking-tight text-gray-900 italic flex items-center gap-3">
            <HeartPulse className="text-red-500 animate-pulse" size={28} />
            Sağlık & Bakım Takibi
          </h1>
          <p className="text-gray-500 font-mono text-xs uppercase tracking-widest mt-1">
            Sürü Aşı Takvimi, Tedaviler ve Hatırlatma Sistemi
          </p>
        </div>
      </header>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 flex items-center gap-4 shadow-xs">
          <div className="p-3 bg-red-50 text-red-600 rounded-xl">
            <Activity size={24} />
          </div>
          <div>
            <span className="block text-xs font-mono uppercase tracking-wider text-gray-400">Hasta Koyunlar</span>
            <span className="text-2xl font-bold">{sickCount} Baş</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 flex items-center gap-4 shadow-xs">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <Bell size={24} />
          </div>
          <div>
            <span className="block text-xs font-mono uppercase tracking-wider text-gray-400">Geciken Görevler</span>
            <span className="text-2xl font-bold text-amber-600">{overdueRemindersCount} Adet</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 flex items-center gap-4 shadow-xs">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <CalendarDays size={24} />
          </div>
          <div>
            <span className="block text-xs font-mono uppercase tracking-wider text-gray-400">Yaklaşan Aşılar</span>
            <span className="text-2xl font-bold">{upcomingReminders.length} Planlanan</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 flex items-center gap-4 shadow-xs">
          <div className="p-3 bg-green-50 text-green-600 rounded-xl">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <span className="block text-xs font-mono uppercase tracking-wider text-gray-400">Tamamlanan Bakımlar</span>
            <span className="text-2xl font-bold">{completedReminders.length + healthRecords.length} Kayıt</span>
          </div>
        </div>
      </div>

      {/* Sub-tab Navigation */}
      <div className="flex border-b border-gray-100 bg-white p-1 rounded-xl w-fit">
        <button 
          onClick={() => setActiveSubTab('reminders')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 ${
            activeSubTab === 'reminders' ? 'bg-black text-white' : 'text-gray-500 hover:bg-gray-50'
          }`}
        >
          <Bell size={14} />
          Hatırlatıcılar & Görevler
        </button>
        <button 
          onClick={() => setActiveSubTab('protocols')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 ${
            activeSubTab === 'protocols' ? 'bg-black text-white' : 'text-gray-500 hover:bg-gray-50'
          }`}
        >
          <Calendar size={14} />
          Önerilen Aşı Takvimi
        </button>
        <button 
          onClick={() => setActiveSubTab('history')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 ${
            activeSubTab === 'history' ? 'bg-black text-white' : 'text-gray-500 hover:bg-gray-50'
          }`}
        >
          <Layers size={14} />
          Tüm Tedavi Geçmişi
        </button>
      </div>

      {/* Tab Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main interactive area */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* TAB 1: REMINDERS & ALERTS PANEL */}
          {activeSubTab === 'reminders' && (
            <div className="space-y-6">
              
              {/* Add reminder box toggler OR form */}
              <AnimatePresence mode="wait">
                {isAddingReminder ? (
                  <motion.form 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    onSubmit={handleCreateReminder}
                    className="bg-white p-6 rounded-2xl border border-gray-100 shadow-md space-y-4"
                  >
                    <div className="flex justify-between items-center pb-2 border-b border-gray-50">
                      <h3 className="font-bold text-sm text-gray-900">Planlı Hatırlatıcı / Görev Ekle</h3>
                      <button 
                        type="button" 
                        onClick={() => setIsAddingReminder(false)}
                        className="text-gray-400 hover:text-black py-1 px-2 text-xs font-semibold"
                      >
                        Vazgeç
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-mono uppercase tracking-wider text-gray-400 font-bold block">Başlık / Görev Adı</label>
                        <input 
                          required
                          type="text" 
                          placeholder="Örn: TR34D671 Gebelik Sonu Çiftleme Aşısı"
                          value={newRem.title}
                          onChange={(e) => setNewRem({...newRem, title: e.target.value})}
                          className="w-full p-2.5 bg-gray-50 rounded-xl border border-gray-200 outline-none text-sm font-sans focus:ring-2 focus:ring-black/10"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-mono uppercase tracking-wider text-gray-400 font-bold block">Kategori / Tür</label>
                        <select 
                          value={newRem.type}
                          onChange={(e) => setNewRem({...newRem, type: e.target.value as Reminder['type']})}
                          className="w-full p-2.5 bg-gray-50 rounded-xl border border-gray-200 outline-none text-sm font-sans"
                        >
                          <option value="Aşı">Aşı Takvimi</option>
                          <option value="Tedavi">Tedavi / İlaç</option>
                          <option value="Vitamin">Vitamin / Takviye</option>
                          <option value="Bakım">Kırkım / Tırnak Bakımı</option>
                          <option value="Parazit">İç & Dış Parazit</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-mono uppercase tracking-wider text-gray-400 font-bold block">İlişkili Hayvan (Koyun veya Kuzu)</label>
                        <select 
                          value={newRem.animalId}
                          onChange={(e) => setNewRem({...newRem, animalId: e.target.value})}
                          className="w-full p-2.5 bg-gray-50 rounded-xl border border-gray-200 outline-none text-sm font-sans"
                        >
                          <option value="flock">Sürü Geneli (Ortak Görev)</option>
                          <optgroup label="Dişi ve Erkek Sürü Koyunları">
                            {sheep.map(s => (
                              <option key={s.id} value={s.id}>
                                {s.name || 'İsimsiz'} ({s.id}) - {s.gender === Gender.Ewe ? 'Dişi' : 'Erkek'}
                              </option>
                            ))}
                          </optgroup>
                          <optgroup label="Aktif Kuzular">
                            {lambs.map(l => (
                              <option key={l.id} value={l.tagId}>
                                Kuzu: {l.tagId} (Annesi: {l.motherId})
                              </option>
                            ))}
                          </optgroup>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-mono uppercase tracking-wider text-gray-400 font-bold block">Uygulama Tarihi</label>
                        <input 
                          required
                          type="date" 
                          value={newRem.date}
                          onChange={(e) => setNewRem({...newRem, date: e.target.value})}
                          className="w-full p-2.5 bg-gray-50 rounded-xl border border-gray-200 outline-none text-sm font-sans"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-mono uppercase tracking-wider text-gray-400 font-bold block">Notlar / Uygulama Açıklaması</label>
                      <textarea 
                        placeholder="Uygulanacak doz ve ek bilgiler..."
                        value={newRem.notes}
                        onChange={(e) => setNewRem({...newRem, notes: e.target.value})}
                        className="w-full p-2.5 bg-gray-50 rounded-xl border border-gray-200 outline-none text-sm font-sans h-16 resize-none"
                      />
                    </div>

                    <button 
                      type="submit"
                      className="w-full bg-black text-white hover:bg-gray-805 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md"
                    >
                      Planı Takvime Ekle
                    </button>
                  </motion.form>
                ) : (
                  <button 
                    onClick={() => setIsAddingReminder(true)}
                    className="w-full bg-white p-4 rounded-xl border border-dashed border-gray-300 hover:border-black hover:text-black flex items-center justify-center gap-2 text-xs text-gray-500 font-bold transition-all"
                  >
                    <Plus size={16} />
                    Yeni Sağlık / Bakım Hatırlatıcısı Programla
                  </button>
                )}
              </AnimatePresence>

              {/* Active Reminders List */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold tracking-tight text-gray-800 flex items-center gap-2">
                  <Clock size={16} className="text-amber-500" />
                  Yaklaşan ve Geciken Görevler ({upcomingReminders.length})
                </h3>

                {upcomingReminders.length > 0 ? (
                  <div className="space-y-3">
                    {upcomingReminders.map(r => {
                      const today = new Date().toISOString().split('T')[0];
                      const isOverdue = r.date < today;

                      return (
                        <div 
                          key={r.id} 
                          className={`p-4 rounded-xl border bg-white flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all hover:shadow-sm ${
                            isOverdue ? 'border-amber-200 bg-amber-50/10' : 'border-gray-100'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <button 
                              onClick={() => toggleReminder(r.id)}
                              className="mt-1 flex-shrink-0 w-5 h-5 rounded-full border border-gray-300 hover:border-black hover:bg-green-50 flex items-center justify-center transition-colors"
                              title="Tamamlandı Olarak İşaretle"
                            >
                              <Check className="text-transparent hover:text-green-600" size={12} />
                            </button>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-tight ${
                                  r.type === 'Aşı' ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' :
                                  r.type === 'Tedavi' ? 'bg-red-50 text-red-700 border border-red-100' :
                                  r.type === 'Vitamin' ? 'bg-green-50 text-green-700 border border-green-100' :
                                  'bg-gray-50 text-gray-600 border border-gray-100'
                                }`}>
                                  {r.type}
                                </span>
                                {isOverdue && (
                                  <span className="text-[10px] bg-red-100 text-red-800 font-bold px-1.5 py-0.5 rounded-sm flex items-center gap-1 font-mono">
                                    <CircleAlert size={10} />
                                    Gecikmiş
                                  </span>
                                )}
                                <span className="text-xs font-semibold text-gray-500 font-mono flex items-center gap-1">
                                  Plan: {new Date(r.date + 'T12:00:00').toLocaleDateString('tr-TR')}
                                </span>
                              </div>
                              <h4 className="font-bold text-sm text-gray-900">{r.title}</h4>
                              <p className="text-xs text-gray-400 font-mono">Hayvan: {getAnimalName(r.animalId)}</p>
                              {r.notes && (
                                <p className="text-xs text-gray-500 font-sans italic bg-gray-50 p-2 rounded-lg border border-gray-100 mt-1 max-w-xl">
                                  {r.notes}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-3 justify-end">
                            <button 
                              onClick={() => {
                                // Add as HealthRecord first automatically
                                addHealthRecord({
                                  animalId: r.animalId,
                                  date: new Date().toISOString().split('T')[0],
                                  type: r.type,
                                  medicine: r.title.replace(/sürü geneli - |karabaş - |kuzu \d+ - /gi, ''),
                                  dosage: 'Belirtilmemiş',
                                  notes: r.notes || 'Hatırlatıcı üzerinden tamamlandı.'
                                });
                                toggleReminder(r.id);
                              }}
                              className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-bold transition-all inline-flex items-center gap-1.5"
                            >
                              <CheckCircle2 size={12} />
                              Hemen Uygula & Kapat
                            </button>
                            <button 
                              onClick={() => deleteReminder(r.id)}
                              className="p-1.5 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-lg transition-colors"
                              title="Sil"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-10 bg-white rounded-xl border border-dashed border-gray-200">
                    <p className="text-xs text-gray-400 font-mono italic">Yaklaşan planlı sağlık veya aşı görevi bulunmuyor.</p>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* TAB 2: VACCINATION PROTOCOLS */}
          {activeSubTab === 'protocols' && (
            <div className="space-y-4">
              <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs">
                <h3 className="font-bold text-sm tracking-tight text-gray-900 mb-1">Standart Sürü Sağlığı Koruma Protokolü</h3>
                <p className="text-xs text-gray-500">
                  Profesyonel besi ve damızlık çiftliklerinde uygulanan standart kuzu ve koyun aşı planlaması. Tek bir tıkla kendi takviminize sürü görevi olarak ekleyebilirsiniz.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {VACCINE_PROTOCOLS.map((vp, index) => (
                  <div key={index} className="bg-white p-5 rounded-2xl border border-gray-100 hover:shadow-md transition-shadow flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="flex justify-between items-start">
                        <h4 className="font-bold text-sm text-gray-900 leading-tight">{vp.name}</h4>
                        <span className="text-[10px] bg-red-50 text-red-600 px-1.5 py-0.5 rounded-sm font-bold font-mono">Doz: {vp.dosage}</span>
                      </div>
                      <p className="text-xs text-gray-400 font-mono font-bold uppercase tracking-wide">Öneri: {vp.recommendedAge}</p>
                      <p className="text-xs text-gray-600 font-sans leading-relaxed">{vp.purpose}</p>
                      <p className="text-[11px] text-gray-500 bg-gray-50 p-2 rounded-lg border border-gray-100">
                        <strong>Sıklık:</strong> {vp.frequency}
                      </p>
                    </div>

                    <button 
                      onClick={() => handleScheduleProtocol(vp.name)}
                      className="mt-4 w-full bg-black text-white hover:bg-gray-850 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                    >
                      <CalendarDays size={12} />
                      Sürü İçin Zamanla (Hatırlatıcı Yap)
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: TREATMENT HISTORY */}
          {activeSubTab === 'history' && (
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs flex flex-col md:flex-row gap-3 justify-between items-center">
                <div className="flex items-center gap-3 w-full md:w-auto bg-gray-50 px-3 py-2 rounded-xl border border-gray-100">
                  <Search size={16} className="text-gray-400" />
                  <input 
                    type="text" 
                    placeholder="Görev veya Küpe No Ara..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-transparent outline-none text-xs font-sans w-full md:w-48"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400 font-mono">Kategori:</span>
                  <select 
                    value={recordTypeFilter}
                    onChange={(e) => setRecordTypeFilter(e.target.value)}
                    className="text-xs bg-gray-50 border border-gray-100 p-2 rounded-xl font-bold outline-none"
                  >
                    <option value="ALL">Tümü</option>
                    <option value="Aşı">Aşılar</option>
                    <option value="Vitamin">Vitaminler</option>
                    <option value="Tedavi">Tedaviler</option>
                    <option value="Parazit">Parazitler</option>
                  </select>
                </div>
              </div>

              <div className="space-y-3">
                {filteredHistory.length > 0 ? (
                  filteredHistory.map(r => (
                    <div key={r.id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-2xs flex justify-between items-start transition-colors hover:border-gray-200">
                      <div>
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="font-bold bg-black text-white px-2 py-0.5 rounded-sm text-[10px] scale-90">{r.type}</span>
                          <span className="text-gray-400 font-mono text-xs">{new Date(r.date + 'T12:00:00').toLocaleDateString('tr-TR')}</span>
                          <span className="text-xs text-gray-500 font-mono font-bold bg-gray-50 px-1.5 py-0.5 rounded-md border border-gray-100">
                            Hayvan: {getAnimalName(r.animalId)}
                          </span>
                        </div>
                        <h4 className="font-bold text-sm text-gray-800">{r.medicine} {r.dosage ? `(Dozaj: ${r.dosage})` : ''}</h4>
                        {r.notes && <p className="text-xs text-gray-500 italic mt-1">{r.notes}</p>}
                      </div>
                      
                      <button 
                        onClick={() => deleteHealthRecord(r.id)}
                        className="text-gray-300 hover:text-red-500 p-1.5 transition-colors"
                        title="Kaydı Kalıcı Olarak Sil"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
                    <p className="text-xs text-gray-400 font-mono italic">Arama kriterlerine uygun tedavi kaydı bulunamadı.</p>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

        {/* Right Sidebar: Completed History List & Instructions */}
        <div className="space-y-6">
          
          {/* Completed Reminders Box */}
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-2xs space-y-4">
            <h3 className="font-bold text-sm tracking-tight text-gray-900 border-b border-gray-50 pb-2">
              Tamamlanan Hatırlatıcılar ({completedReminders.length})
            </h3>
            
            <div className="space-y-3 max-h-56 overflow-y-auto">
              {completedReminders.length > 0 ? (
                completedReminders.map(r => (
                  <div key={r.id} className="text-xs bg-gray-50 p-3 rounded-xl border border-gray-100 flex items-start gap-2 justify-between">
                    <div>
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <span className="text-[9px] bg-green-100 text-green-800 font-bold font-mono px-1 rounded-sm">Tamamlandı</span>
                        <span className="text-gray-400 font-mono text-[10px]">{r.date}</span>
                      </div>
                      <p className="font-bold text-gray-800 line-clamp-1">{r.title}</p>
                      <p className="text-gray-400 text-[10px] font-mono mt-0.5">Hayvan: {r.animalId === 'flock' ? 'Tüm Sürü' : r.animalId}</p>
                    </div>
                    <button 
                      onClick={() => deleteReminder(r.id)}
                      className="text-gray-350 hover:text-red-500"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))
              ) : (
                <p className="text-xs text-gray-400 font-mono italic p-3 text-center border border-dashed border-gray-100 rounded-lg">
                  Henüz tamamlanan bir hatırlatıcı yok.
                </p>
              )}
            </div>
          </div>

          {/* Veterinarian Quick Suggestions Box */}
          <div className="bg-gradient-to-br from-gray-900 to-black p-5 text-white rounded-2xl shadow-md space-y-4 relative overflow-hidden">
            <div className="absolute right-0 top-0 opacity-10 translate-x-3 -translate-y-3">
              <Sparkles size={100} />
            </div>
            
            <span className="inline-block bg-white/10 text-white/80 font-mono text-[9px] font-bold tracking-widest uppercase px-2 py-0.5 rounded-full">
              Uzman Görüşü
            </span>
            <div className="space-y-2">
              <h4 className="font-bold text-sm flex items-center gap-1">
                Kuzu & Sağlık Yönetimi İpuçları
              </h4>
              <p className="text-xs text-gray-300 leading-relaxed font-sans">
                Kuzuların doğumundan sonraki ilk 2 saat içinde <strong>ağız sütünü (kolostrum)</strong> aldıklarından emin olun. Bu süt, hastalıklara karşı ilk doğal bağışıklığı oluşturur. 
              </p>
              <p className="text-xs text-gray-300 leading-relaxed font-sans">
                Aşılarınızı zamanında uygulayın, parazit döngülerini kırmak için ilaçlamaları sürüye eş zamanlı yapın.
              </p>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
