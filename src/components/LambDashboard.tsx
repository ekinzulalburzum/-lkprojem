import React, { useState } from 'react';
import { useFirebase } from './FirebaseProvider';
import { Lamb, Gender } from '../types';
import { Plus, Search, Baby, Weight, Calendar, ArrowRight, Trash2, Edit, Check, Activity, Printer, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function LambDashboard() {
  const { lambs, addLamb, updateLamb, deleteLamb, sheep, healthRecords, addHealthRecord, deleteHealthRecord, user } = useFirebase();
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedLambId, setSelectedLambId] = useState<string | null>(null);
  const [isPreviewReportOpen, setIsPreviewReportOpen] = useState(false);
  
  // States of inline editing
  const [editingLambId, setEditingLambId] = useState<string | null>(null);
  const [editStatusText, setEditStatusText] = useState('');

  const [newLamb, setNewLamb] = useState<Partial<Lamb>>({
    tagId: '',
    motherId: '',
    birthWeight: 3.5,
    gender: Gender.Female,
    notes: '',
    status: 'Sağlıklı'
  });

  const [newRecord, setNewRecord] = useState({
    type: 'Vitamin',
    medicine: '',
    dosage: '',
    notes: '',
    date: new Date().toISOString().split('T')[0]
  });

  const handleAddLamb = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLamb.tagId || !newLamb.motherId) return;

    if (lambs.some(l => l.tagId === newLamb.tagId)) {
      alert("Bu kuzu küpe numarası zaten mevcut!");
      return;
    }

    addLamb({
      tagId: newLamb.tagId,
      motherId: newLamb.motherId,
      birthDate: new Date().toISOString(),
      birthWeight: Number(newLamb.birthWeight) || 3.5,
      gender: newLamb.gender as Gender.Male | Gender.Female,
      status: newLamb.status || 'Sağlıklı',
      notes: newLamb.notes || '',
    });

    setIsAddModalOpen(false);
    setNewLamb({
      tagId: '',
      motherId: '',
      birthWeight: 3.5,
      gender: Gender.Female,
      notes: '',
      status: 'Sağlıklı'
    });
  };

  const handleDeleteLamb = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Bu kuzuyu silmek istediğinize emin misiniz?")) {
      deleteLamb(id);
      if (selectedLambId === id) setSelectedLambId(null);
    }
  };

  const handleSaveStatus = (id: string) => {
    updateLamb(id, { status: editStatusText });
    setEditingLambId(null);
  };

  const handleAddHealth = (e: React.FormEvent, lambTag: string) => {
    e.preventDefault();
    if (!newRecord.medicine) return;

    addHealthRecord({
      animalId: lambTag,
      date: newRecord.date,
      type: newRecord.type,
      medicine: newRecord.medicine,
      dosage: newRecord.dosage,
      notes: newRecord.notes
    });

    setNewRecord({
      type: 'Vitamin',
      medicine: '',
      dosage: '',
      notes: '',
      date: new Date().toISOString().split('T')[0]
    });
  };

  const filteredLambs = lambs.filter(l => 
    l.tagId?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    l.motherId?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedLamb = lambs.find(l => l.id === selectedLambId);
  const selectedLambMother = selectedLamb ? sheep.find(s => s.id === selectedLamb.motherId) : null;
  const selectedLambRecords = selectedLamb ? healthRecords.filter(r => r.animalId === selectedLamb.tagId) : [];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-sans tracking-tight text-gray-900 italic">Kuzu Takibi</h1>
          <p className="text-gray-500 font-mono text-xs uppercase tracking-widest mt-1">Yeni Doğanlar ve Büyüme Verileri (Yerel Hafıza)</p>
        </div>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="bg-black text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-800 transition-all font-medium h-fit"
        >
          <Plus size={18} />
          Yeni Doğum Kaydet
        </button>
      </header>

      <div className="flex items-center gap-4 bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
        <Search className="text-gray-400" size={20} />
        <input 
          type="text" 
          placeholder="Kuzu Küpe No veya Anne Küpe No ile Ara..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 outline-hidden text-sm font-sans"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lamb Cards List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AnimatePresence>
              {filteredLambs.map((l) => (
                <motion.div 
                  key={l.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className={`bg-white p-5 rounded-2xl border transition-all cursor-pointer group relative ${
                    selectedLambId === l.id ? 'border-black ring-2 ring-black/5' : 'border-gray-100 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedLambId(l.id)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-xl ${l.gender === Gender.Female ? 'bg-pink-50 text-pink-600' : 'bg-blue-50 text-blue-600'}`}>
                        <Baby size={20} />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm">NO: {l.tagId}</h4>
                        <p className="text-[10px] uppercase font-mono text-gray-400 tracking-tight">Kuzu • Anne: {l.motherId}</p>
                      </div>
                    </div>
                    
                    <button 
                      onClick={(e) => handleDeleteLamb(l.id, e)}
                      className="p-1 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-3 mb-3">
                    <div className="bg-gray-50/50 border border-gray-100 p-2 rounded-xl text-center">
                      <span className="block text-[9px] uppercase font-mono text-gray-400">Doğum Ağırlığı</span>
                      <span className="font-bold text-xs text-gray-800">{l.birthWeight} kg</span>
                    </div>
                    <div className="bg-gray-50/50 border border-gray-100 p-2 rounded-xl text-center">
                      <span className="block text-[9px] uppercase font-mono text-gray-400">Cinsiyet</span>
                      <span className={`font-bold text-xs ${l.gender === Gender.Female ? 'text-pink-500' : 'text-blue-500'}`}>
                        {l.gender === Gender.Female ? 'Dişi' : 'Erkek'}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1 border-t border-gray-50 pt-2 text-xs">
                    <div className="flex items-center gap-2 text-gray-500">
                      <Calendar size={12} />
                      <span className="font-mono">Doğum: {new Date(l.birthDate).toLocaleDateString('tr-TR')}</span>
                    </div>
                    <div className="flex items-center justify-between text-gray-500 mt-1">
                      <span className="truncate max-w-[150px]">Durum: <strong>{l.status || 'Sağlıklı'}</strong></span>
                      <ArrowRight size={12} className="text-gray-400 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Selected Lamb Details Panel */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 h-fit space-y-6">
          {selectedLamb ? (
            <>
              <div className="border-b border-gray-50 pb-4 space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] uppercase font-mono tracking-widest text-gray-400">SEÇİLİ KUZU DETAYI</span>
                    <h2 className="text-xl font-bold font-sans tracking-tight">{selectedLamb.tagId}</h2>
                    {selectedLambMother && (
                      <p className="text-xs text-gray-500 mt-1">
                        <strong>Annesi:</strong> {selectedLambMother.name} ({selectedLambMother.breed})
                      </p>
                    )}
                  </div>
                  <button 
                    onClick={() => setSelectedLambId(null)}
                    className="p-1 hover:bg-gray-100 rounded-lg text-gray-400"
                  >
                    <X />
                  </button>
                </div>

                <div className="mt-3 bg-gray-50 p-3 rounded-xl border border-gray-100 space-y-1 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Durum:</span>
                    {editingLambId === selectedLamb.id ? (
                      <div className="flex items-center gap-1">
                        <input 
                          type="text" 
                          value={editStatusText} 
                          onChange={(e) => setEditStatusText(e.target.value)}
                          className="bg-white p-1 rounded-sm border border-gray-300 w-32 font-bold focus:outline-hidden"
                        />
                        <button 
                          onClick={() => handleSaveStatus(selectedLamb.id)}
                          className="p-1 bg-black text-white rounded-sm"
                        >
                          <Check size={12} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-gray-800">{selectedLamb.status || 'Sağlıklı'}</span>
                        <button 
                          onClick={() => {
                            setEditingLambId(selectedLamb.id);
                            setEditStatusText(selectedLamb.status || 'Sağlıklı');
                          }}
                          className="text-gray-400 hover:text-black"
                        >
                          <Edit size={10} />
                        </button>
                      </div>
                    )}
                  </div>
                  {selectedLamb.notes && (
                    <div className="mt-2 text-gray-500 italic pt-1.5 border-t border-gray-100">
                      <strong>Notlar:</strong> {selectedLamb.notes}
                    </div>
                  )}

                  <div className="pt-3 border-t border-gray-100">
                    <button 
                      onClick={() => setIsPreviewReportOpen(true)}
                      className="w-full flex items-center justify-center gap-2 bg-black text-white hover:bg-gray-800 transition-colors py-2.5 px-3 rounded-2xl text-xs font-bold shadow-xs cursor-pointer"
                    >
                      <Printer size={13} />
                      Gelişim & Sağlık Raporu (Yazdır / PDF)
                    </button>
                  </div>
                </div>
              </div>

              {/* Health Record Treatment Log pour kuzu */}
              <div>
                <h3 className="font-bold text-sm tracking-tight mb-3 flex items-center gap-2">
                  <Activity size={16} className="text-red-500" />
                  Kuzu Aşı & Bakım Takvimi
                </h3>

                <div className="space-y-3 max-h-60 overflow-y-auto mb-4">
                  {selectedLambRecords.length > 0 ? (
                    selectedLambRecords.map(r => (
                      <div key={r.id} className="text-xs bg-gray-50 p-3 rounded-xl border border-gray-100 flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-bold bg-gray-900 text-white px-1.5 py-0.5 rounded-sm scale-90">{r.type}</span>
                            <span className="text-gray-400 font-mono">{r.date}</span>
                          </div>
                          <p className="font-semibold text-gray-800">{r.medicine} {r.dosage ? `(${r.dosage})` : ''}</p>
                          {r.notes && <p className="text-gray-400 mt-1">{r.notes}</p>}
                        </div>
                        <button 
                          onClick={() => deleteHealthRecord(r.id)}
                          className="text-gray-300 hover:text-red-500 p-1"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-gray-400 font-mono italic p-4 text-center border-2 border-dashed border-gray-100 rounded-xl">
                      Bu kuzuya henüz bir ilaç uygulanamamıştır.
                    </p>
                  )}
                </div>

                {/* New Record Inline Form */}
                <form onSubmit={(e) => handleAddHealth(e, selectedLamb.tagId)} className="space-y-3 bg-gray-50/50 p-4 rounded-xl border border-gray-100">
                  <span className="text-[10px] font-mono uppercase text-gray-400 block font-semibold">Yeni Kuzu Tedavisi Gir</span>
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={newRecord.type}
                      onChange={(e) => setNewRecord({ ...newRecord, type: e.target.value })}
                      className="text-xs bg-white p-2 rounded-lg border border-gray-250 outline-none w-full"
                    >
                      <option value="Vitamin">Vitamin</option>
                      <option value="Aşı">Aşı</option>
                      <option value="Tedavi">Tedavi</option>
                    </select>
                    <input 
                      type="text"
                      placeholder="Vitamin/İlaç Adı"
                      required
                      value={newRecord.medicine}
                      onChange={(e) => setNewRecord({ ...newRecord, medicine: e.target.value })}
                      className="text-xs bg-white p-2 rounded-lg border border-gray-250 outline-none w-full"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input 
                      type="text"
                      placeholder="Dozaj (örn: 1cc)"
                      value={newRecord.dosage}
                      onChange={(e) => setNewRecord({ ...newRecord, dosage: e.target.value })}
                      className="text-xs bg-white p-2 rounded-lg border border-gray-250 outline-none w-full"
                    />
                    <input 
                      type="date"
                      value={newRecord.date}
                      onChange={(e) => setNewRecord({ ...newRecord, date: e.target.value })}
                      className="text-xs bg-white p-2 rounded-lg border border-gray-255 outline-none w-full"
                    />
                  </div>
                  <input 
                    type="text"
                    placeholder="Nasıl uygulandı / Açıklama"
                    value={newRecord.notes}
                    onChange={(e) => setNewRecord({ ...newRecord, notes: e.target.value })}
                    className="text-xs bg-white p-2 rounded-lg border border-gray-250 outline-none w-full"
                  />
                  <button 
                    type="submit"
                    className="w-full bg-black text-white hover:bg-gray-800 transition-colors py-2 rounded-lg text-xs font-bold"
                  >
                    Kuzuya Uygula
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <Baby size={36} className="mx-auto text-gray-300 mb-3" />
              <p className="text-xs text-gray-400 font-mono uppercase tracking-wider mb-1">KUZU DETAYI</p>
              <p className="text-xs text-gray-500">Doğum ağırlığı, durum değişiklikleri ve gelişim aşılarını planlamak için soldan bir kuzu kartına tıklayın.</p>
            </div>
          )}
        </div>
      </div>

      {/* Print Preview Modal */}
      {isPreviewReportOpen && selectedLamb && (
        <div className="fixed inset-0 bg-black/65 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl p-6 md:p-8 max-w-2xl w-full shadow-2xl space-y-6 my-8"
          >
            {/* Modal Controls - Hidden during printer printing */}
            <div className="flex justify-between items-center pb-4 border-b border-gray-100 select-none">
              <div className="flex items-center gap-2 text-gray-500">
                <FileText size={18} />
                <span className="text-xs font-mono font-bold uppercase tracking-wider">Yazıcı Rapor Önizleme</span>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => setIsPreviewReportOpen(false)}
                  className="px-3 py-1.5 border border-gray-200 hover:bg-gray-50 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                >
                  Kapat
                </button>
                <button 
                  onClick={() => window.print()}
                  className="px-4 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer size={13} strokeWidth={2.5} />
                  Yazdır / PDF Kaydet
                </button>
              </div>
            </div>

            {/* PRINT-ONLY CONTAINER WITH PROPER BRANDING */}
            <div id="printable-report" className="bg-white text-black p-2 font-sans space-y-6">
              
              {/* Header */}
              <div className="text-center border-b-4 border-black pb-4 space-y-1">
                <div className="flex justify-center items-center gap-2 mb-1">
                  <span className="font-extrabold italic text-xl tracking-tight uppercase">LambTrace</span>
                  <span className="text-xs font-semibold px-2 py-0.5 border border-black uppercase font-mono tracking-wider">Sürü Yönetimi</span>
                </div>
                <h1 className="text-xl font-black font-sans tracking-tight uppercase">Bireysel Kuzu Gelişim & Sağlık Raporu</h1>
                <p className="text-[10px] text-gray-500 font-mono uppercase">Çiftlik / Farm: {user?.farmName || 'Yeşil Vadi Çiftliği'} • Shepherd: {user?.displayName || 'Çiftçi'}</p>
                <p className="text-[10px] text-gray-550 font-mono">Bugün Tarihi: {new Date().toLocaleDateString('tr-TR')} (UTC/GMT)</p>
              </div>

              {/* Core Attributes */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 bg-gray-50 p-4 border border-gray-200 rounded-xl text-xs">
                <div>
                  <span className="block text-[10px] font-mono text-gray-400 uppercase tracking-wider font-semibold">Kuzu Küpe Numarası</span>
                  <span className="font-bold text-sm text-gray-900">{selectedLamb.tagId}</span>
                </div>
                <div>
                  <span className="block text-[10px] font-mono text-gray-400 uppercase tracking-wider font-semibold">Cinsiyet</span>
                  <span className={`font-bold text-sm ${selectedLamb.gender === Gender.Female ? 'text-pink-600' : 'text-blue-600'}`}>
                    {selectedLamb.gender === Gender.Female ? 'Dişi (Female)' : 'Erkek (Male)'}
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] font-mono text-gray-400 uppercase tracking-wider font-semibold">Doğum Ağırlığı</span>
                  <span className="font-bold text-sm text-gray-900">{selectedLamb.birthWeight} kg</span>
                </div>
                <div>
                  <span className="block text-[10px] font-mono text-gray-400 uppercase tracking-wider font-semibold">Doğum Tarihi</span>
                  <span className="font-semibold text-gray-900">{new Date(selectedLamb.birthDate).toLocaleDateString('tr-TR')}</span>
                </div>
                <div>
                  <span className="block text-[10px] font-mono text-gray-400 uppercase tracking-wider font-semibold">Aktif Yaş</span>
                  <span className="font-bold text-gray-900">
                    {Math.floor((Date.now() - new Date(selectedLamb.birthDate).getTime()) / (1000 * 60 * 60 * 24))} gün (Days)
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] font-mono text-gray-400 uppercase tracking-wider font-semibold">Annesi (Dam)</span>
                  <span className="font-semibold text-gray-900">{selectedLambMother ? `${selectedLambMother.name || 'İsimsiz'} (KÜPE: ${selectedLambMother.id})` : selectedLamb.motherId}</span>
                </div>
                <div className="col-span-full pt-2 border-t border-gray-100">
                  <span className="block text-[10px] font-mono text-gray-400 uppercase tracking-wider font-semibold">Anlık Sağlık Durumu & Müşahade</span>
                  <span className="font-medium text-gray-800">{selectedLamb.status || 'Sağlıklı - Aktif gözetim altında.'}</span>
                </div>
              </div>

              {/* Records Section */}
              <div className="space-y-3">
                <h3 className="font-bold text-xs uppercase tracking-wider text-gray-800 border-b border-black pb-1">
                  Uygulanan Aşı, Vitamin ve Bakım Geçmişi
                </h3>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-[11px]">
                    <thead>
                      <tr className="border-b-2 border-black font-semibold text-gray-600 font-mono">
                        <th className="py-2">Tarih</th>
                        <th className="py-2">İşlem Türü</th>
                        <th className="py-2">İlaç / Vitamin Adı</th>
                        <th className="py-2">Dozaj</th>
                        <th className="py-2">Açıklama / Durum</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedLambRecords.length > 0 ? (
                        selectedLambRecords.map(r => (
                          <tr key={r.id} className="border-b border-gray-100">
                            <td className="py-2.5 font-mono">{new Date(r.date + 'T12:00:00').toLocaleDateString('tr-TR')}</td>
                            <td className="py-2.5">
                              <span className="font-bold bg-gray-100 text-gray-800 px-1 rounded-xs uppercase text-[9px]">{r.type}</span>
                            </td>
                            <td className="py-2.5 font-bold">{r.medicine}</td>
                            <td className="py-2.5 font-mono text-gray-500">{r.dosage || '-'}</td>
                            <td className="py-2.5 text-gray-600 max-w-sm">{r.notes || '-'}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="py-8 text-center font-mono text-gray-400 italic">
                            Bu kuzuya henüz herhangi bir aşı veya tıbbi işlem uygulanmamıştır.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Quality Standards & Remarks */}
              <div className="bg-gray-50 p-4 border border-dashed border-gray-300 rounded-lg text-[11px] text-gray-600 leading-relaxed font-sans">
                <strong>Notlar:</strong> Bu rapor LambTrace güvenli yerel verileri üzerinden oluşturulmuştur. Kuzuların beslenme kalitesi, mera uyumluluğu ve gelişimi periyodik veteriner kontrolleri ile desteklenmeli, aşılama takvimindeki eksikler ilk fırsatta veteriner hekime danışılarak planlanmalıdır.
              </div>

              {/* Signatures Area */}
              <div className="pt-10 grid grid-cols-2 gap-8 text-center font-serif text-[11px]">
                <div className="space-y-12">
                  <div className="border-b border-black w-40 mx-auto" />
                  <p className="font-bold uppercase text-gray-800 tracking-wider">Çiftlik Sorumlusu / Shepherd</p>
                  <p className="text-[9px] text-gray-400 font-mono">İmza Tarihi: ____/____/2026</p>
                </div>
                <div className="space-y-12">
                  <div className="border-b border-black w-40 mx-auto" />
                  <p className="font-bold uppercase text-gray-800 tracking-wider">Sorumlu Veteriner Hekim</p>
                  <p className="text-[9px] text-gray-400 font-mono">Kaşe / İmza</p>
                </div>
              </div>

            </div>
          </motion.div>
        </div>
      )}

      {/* Add Lamb Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl space-y-6"
          >
            <h2 className="text-2xl font-bold font-sans italic">Yeni Doğum Kaydı</h2>
            <form onSubmit={handleAddLamb} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-mono uppercase text-gray-400 tracking-widest">Kuzu Küpe Numarası*</label>
                <input 
                  required
                  type="text" 
                  placeholder="örn: TR-KUZU-105"
                  value={newLamb.tagId || ''}
                  onChange={(e) => setNewLamb({...newLamb, tagId: e.target.value.toUpperCase()})}
                  className="w-full p-3 bg-gray-50 rounded-xl border border-gray-100 outline-none"
                />
              </div>

              {/* Mother Select Suggestion */}
              <div className="space-y-2">
                <label className="text-xs font-mono uppercase text-gray-400 tracking-widest">Anne Seçin*</label>
                <select 
                  required
                  value={newLamb.motherId}
                  onChange={(e) => setNewLamb({...newLamb, motherId: e.target.value})}
                  className="w-full p-3 bg-gray-50 rounded-xl border border-gray-250 outline-none font-sans text-sm"
                >
                  <option value="">-- Anne seçin --</option>
                  {sheep.filter(s => s.gender === Gender.Ewe).map(s => (
                    <option key={s.id} value={s.id}>{s.name || 'İsimsiz'} ({s.id})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-mono uppercase text-gray-400 tracking-widest">Doğum Ağırlığı (kg)</label>
                  <input 
                    type="number" 
                    step="0.1"
                    required
                    value={newLamb.birthWeight || ''}
                    onChange={(e) => setNewLamb({...newLamb, birthWeight: parseFloat(e.target.value)})}
                    className="w-full p-3 bg-gray-50 rounded-xl border border-gray-100 outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-mono uppercase text-gray-400 tracking-widest">Cinsiyet</label>
                  <select 
                    value={newLamb.gender}
                    onChange={(e) => setNewLamb({...newLamb, gender: e.target.value as Gender})}
                    className="w-full p-3 bg-gray-50 rounded-xl border border-gray-250 outline-none"
                  >
                    <option value={Gender.Female}>Kuzu Dişi</option>
                    <option value={Gender.Male}>Kuzu Erkek</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-mono uppercase text-gray-400 tracking-widest font-semibold">Doğum Notu / Durum</label>
                <input 
                  type="text"
                  placeholder="örn: İkiz eşi, sağlıklı"
                  value={newLamb.notes}
                  onChange={(e) => setNewLamb({ ...newLamb, notes: e.target.value })}
                  className="w-full p-3 bg-gray-50 rounded-xl border border-gray-100 outline-none"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="flex-1 py-3 border border-gray-100 rounded-xl font-medium">İptal</button>
                <button type="submit" className="flex-1 py-3 bg-black text-white rounded-xl font-medium">Doğumu Kaydet</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}

const X = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);
