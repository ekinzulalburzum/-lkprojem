import React, { useState } from 'react';
import { useFirebase } from './FirebaseProvider';
import { Sheep, AnimalStatus, Gender } from '../types';
import { Plus, Search, Tag, Activity, Calendar, Trash2, Edit, Save, X, PlusCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function SheepDashboard() {
  const { sheep, addSheep, updateSheep, deleteSheep, healthRecords, addHealthRecord, deleteHealthRecord } = useFirebase();
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingSheepId, setEditingSheepId] = useState<string | null>(null);
  const [newSheep, setNewSheep] = useState<Partial<Sheep>>({
    id: '',
    name: '',
    breed: '',
    birthDate: '',
    gender: Gender.Ewe,
    status: AnimalStatus.Healthy,
    notes: ''
  });

  // Selected animal for health records and details
  const [selectedSheepId, setSelectedSheepId] = useState<string | null>(null);
  const [newRecord, setNewRecord] = useState({
    type: 'Aşı',
    medicine: '',
    dosage: '',
    notes: '',
    date: new Date().toISOString().split('T')[0]
  });

  const handleAddSheep = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSheep.id) return;
    
    // Check duplication
    if (sheep.some(s => s.id === newSheep.id)) {
      alert("Bu küpe numarası zaten kayıtlı!");
      return;
    }

    addSheep({
      id: newSheep.id,
      name: newSheep.name || 'İsimsiz',
      breed: newSheep.breed || 'Belirtilmemiş',
      gender: newSheep.gender as Gender.Ewe | Gender.Ram,
      status: newSheep.status as AnimalStatus,
      birthDate: newSheep.birthDate || '',
      notes: newSheep.notes || '',
      createdAt: new Date().toISOString()
    });

    setIsAddModalOpen(false);
    setNewSheep({
      id: '',
      name: '',
      breed: '',
      birthDate: '',
      gender: Gender.Ewe,
      status: AnimalStatus.Healthy,
      notes: ''
    });
  };

  const handleUpdateSheep = (id: string, updates: Partial<Sheep>) => {
    updateSheep(id, updates);
    setEditingSheepId(null);
  };

  const handleDeleteSheep = (id: string) => {
    if (confirm("Bu koyunu sürüden silmek istediğinize emin misiniz?")) {
      deleteSheep(id);
      if (selectedSheepId === id) setSelectedSheepId(null);
    }
  };

  const handleAddMedical = (e: React.FormEvent, animalId: string) => {
    e.preventDefault();
    if (!newRecord.medicine || !newRecord.type) return;

    addHealthRecord({
      animalId,
      date: newRecord.date,
      type: newRecord.type,
      medicine: newRecord.medicine,
      dosage: newRecord.dosage,
      notes: newRecord.notes
    });

    setNewRecord({
      type: 'Aşı',
      medicine: '',
      dosage: '',
      notes: '',
      date: new Date().toISOString().split('T')[0]
    });
  };

  const filteredSheep = sheep.filter(s => 
    s.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.breed?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedSheep = sheep.find(s => s.id === selectedSheepId);
  const selectedSheepRecords = healthRecords.filter(r => r.animalId === selectedSheepId);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-sans tracking-tight text-gray-900 italic">Sürü Yönetimi</h1>
          <p className="text-gray-500 font-mono text-xs uppercase tracking-widest mt-1">Ana Koyun ve Koç Envanteri (Yerel Hafıza)</p>
        </div>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="bg-black text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-800 transition-all font-medium h-fit"
        >
          <Plus size={18} />
          Yeni Hayvan Ekle
        </button>
      </header>

      <div className="flex items-center gap-4 bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
        <Search className="text-gray-400" size={20} />
        <input 
          type="text" 
          placeholder="Küpe No, İsim veya Irk ile Ara..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 outline-hidden text-sm font-sans"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sheep list */}
        <div className="lg:col-span-2 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AnimatePresence>
              {filteredSheep.map((s) => (
                <motion.div 
                  key={s.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={`bg-white p-5 rounded-2xl border transition-all cursor-pointer group relative ${
                    selectedSheepId === s.id ? 'border-black ring-2 ring-black/5' : 'border-gray-100 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedSheepId(s.id)}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${s.gender === Gender.Ewe ? 'bg-pink-50 text-pink-600' : 'bg-blue-50 text-blue-600'}`}>
                        <Tag size={20} />
                      </div>
                      <div>
                        {editingSheepId === s.id ? (
                          <input 
                            type="text" 
                            defaultValue={s.name}
                            onBlur={(e) => handleUpdateSheep(s.id, { name: e.target.value })}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleUpdateSheep(s.id, { name: e.currentTarget.value });
                              }
                            }}
                            className="font-bold text-gray-900 border-b border-black outline-none w-28 text-sm"
                            autoFocus
                            onClick={(e) => e.stopPropagation()}
                          />
                        ) : (
                          <h3 className="font-bold text-gray-900">{s.name || 'İsimsiz'}</h3>
                        )}
                        <p className="text-xs font-mono text-gray-400">KÜPE: {s.id}</p>
                      </div>
                    </div>
                    
                    {/* Status change select */}
                    <select
                      value={s.status}
                      onChange={(e) => handleUpdateSheep(s.id, { status: e.target.value as AnimalStatus })}
                      onClick={(e) => e.stopPropagation()}
                      className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider outline-none border-none cursor-pointer ${
                        s.status === AnimalStatus.Healthy ? 'bg-green-100 text-green-700' :
                        s.status === AnimalStatus.Pregnant ? 'bg-purple-100 text-purple-700' :
                        s.status === AnimalStatus.Sick ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-700'
                      }`}
                    >
                      <option value={AnimalStatus.Healthy}>Sağlıklı</option>
                      <option value={AnimalStatus.Pregnant}>Gebe</option>
                      <option value={AnimalStatus.Sick}>Hasta</option>
                      <option value={AnimalStatus.Sold}>Satıldı</option>
                      <option value={AnimalStatus.Deceased}>Vefat</option>
                    </select>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-xs text-gray-500 font-mono">
                      <Activity size={14} />
                      <span>Irk: {s.breed || 'Belirtilmemiş'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500 font-mono">
                      <Calendar size={14} />
                      <span>Doğum: {s.birthDate || 'Bilinmiyor'}</span>
                    </div>
                  </div>

                  {s.notes && (
                    <p className="text-xs text-gray-400 font-sans italic line-clamp-1 border-t border-gray-50 pt-2">
                      {s.notes}
                    </p>
                  )}

                  <div className="flex justify-end gap-2 pt-3 border-t border-gray-50 opacity-0 group-hover:opacity-100 transition-opacity mt-3">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingSheepId(s.id);
                      }}
                      className="p-1 hover:bg-gray-50 rounded-lg transition-colors text-gray-400 hover:text-black"
                      title="Düzenle"
                    >
                      <Edit size={14} />
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteSheep(s.id);
                      }}
                      className="p-1 hover:bg-red-50 rounded-lg transition-colors text-gray-400 hover:text-red-500"
                      title="Sil"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Selected Sheep Detail & Health Records */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 h-fit space-y-6">
          {selectedSheep ? (
            <>
              <div className="border-b border-gray-50 pb-4">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] uppercase font-mono tracking-widest text-gray-400">SEÇİLİ DETAY</span>
                    <h2 className="text-xl font-bold font-sans tracking-tight">{selectedSheep.name}</h2>
                    <p className="text-xs font-mono text-gray-500">Küpe No: {selectedSheep.id}</p>
                  </div>
                  <button 
                    onClick={() => setSelectedSheepId(null)}
                    className="p-1 hover:bg-gray-100 rounded-lg text-gray-400"
                  >
                    <X size={16} />
                  </button>
                </div>
                {selectedSheep.notes && (
                  <p className="text-xs text-gray-600 mt-3 bg-gray-50 p-2 rounded-lg border border-gray-100">
                    <strong>Not:</strong> {selectedSheep.notes}
                  </p>
                )}
              </div>

              {/* Health Record Treatment Log */}
              <div>
                <h3 className="font-bold text-sm tracking-tight mb-3 flex items-center gap-2">
                  <Activity size={16} className="text-red-500" />
                  Sağlık & Aşı Geçmişi
                </h3>

                <div className="space-y-3 max-h-60 overflow-y-auto mb-4">
                  {selectedSheepRecords.length > 0 ? (
                    selectedSheepRecords.map(r => (
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
                      Aşı veya sağlık kaydı bulunmamaktadır.
                    </p>
                  )}
                </div>

                {/* New Record Inline Form */}
                <form onSubmit={(e) => handleAddMedical(e, selectedSheep.id)} className="space-y-3 bg-gray-50/50 p-4 rounded-xl border border-gray-100">
                  <span className="text-[10px] font-mono uppercase text-gray-400 block font-semibold">Yeni Sağlık Kaydı Girişi</span>
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={newRecord.type}
                      onChange={(e) => setNewRecord({ ...newRecord, type: e.target.value })}
                      className="text-xs bg-white p-2 rounded-lg border border-gray-250 outline-none w-full"
                    >
                      <option value="Aşı">Aşı</option>
                      <option value="Vitamin">Vitamin</option>
                      <option value="Tedavi">Tedavi</option>
                      <option value="Parazit">Parazit İlacı</option>
                    </select>
                    <input 
                      type="text"
                      placeholder="Uygulanan İlaç"
                      required
                      value={newRecord.medicine}
                      onChange={(e) => setNewRecord({ ...newRecord, medicine: e.target.value })}
                      className="text-xs bg-white p-2 rounded-lg border border-gray-250 outline-none w-full"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input 
                      type="text"
                      placeholder="Dozaj (örn: 2cc)"
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
                    placeholder="Ek Not / Durum"
                    value={newRecord.notes}
                    onChange={(e) => setNewRecord({ ...newRecord, notes: e.target.value })}
                    className="text-xs bg-white p-2 rounded-lg border border-gray-250 outline-none w-full"
                  />
                  <button 
                    type="submit"
                    className="w-full bg-black text-white hover:bg-gray-800 transition-colors py-2 rounded-lg text-xs font-bold"
                  >
                    Kayıt Ekle
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <Tag size={36} className="mx-auto text-gray-300 mb-3" />
              <p className="text-xs text-gray-400 font-mono uppercase tracking-wider mb-1">DETAY GÖRÜNTÜLEYİCİ</p>
              <p className="text-xs text-gray-500">Geçmiş aşıları, notları ve sağlığı görüntülemek için soldan bir hayvan seçin.</p>
            </div>
          )}
        </div>
      </div>

      {/* Add Sheep Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl space-y-6"
          >
            <h2 className="text-2xl font-bold font-sans italic">Yeni Koyun/Koç Kaydı</h2>
            <form onSubmit={handleAddSheep} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-mono uppercase text-gray-400 tracking-widest">Küpe Numarası*</label>
                <input 
                  required
                  type="text" 
                  placeholder="örn: TR34D674"
                  value={newSheep.id || ''}
                  onChange={(e) => setNewSheep({...newSheep, id: e.target.value.toUpperCase()})}
                  className="w-full p-3 bg-gray-50 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-black/5"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-mono uppercase text-gray-400 tracking-widest">İsim / Nickname</label>
                  <input 
                    type="text" 
                    placeholder="örn: Sümbül"
                    value={newSheep.name || ''}
                    onChange={(e) => setNewSheep({...newSheep, name: e.target.value})}
                    className="w-full p-3 bg-gray-50 rounded-xl border border-gray-100 outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-mono uppercase text-gray-400 tracking-widest">Irk</label>
                  <input 
                    type="text" 
                    placeholder="örn: Merinos"
                    value={newSheep.breed || ''}
                    onChange={(e) => setNewSheep({...newSheep, breed: e.target.value})}
                    className="w-full p-3 bg-gray-50 rounded-xl border border-gray-100 outline-none"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-mono uppercase text-gray-400 tracking-widest">Cinsiyet</label>
                  <select 
                    value={newSheep.gender}
                    onChange={(e) => setNewSheep({...newSheep, gender: e.target.value as Gender})}
                    className="w-full p-3 bg-gray-50 rounded-xl border border-gray-250 outline-none"
                  >
                    <option value={Gender.Ewe}>Koyun (Dişi)</option>
                    <option value={Gender.Ram}>Koç (Erkek)</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-mono uppercase text-gray-400 tracking-widest">Durum</label>
                  <select 
                    value={newSheep.status}
                    onChange={(e) => setNewSheep({...newSheep, status: e.target.value as AnimalStatus})}
                    className="w-full p-3 bg-gray-50 rounded-xl border border-gray-250 outline-none"
                  >
                    <option value={AnimalStatus.Healthy}>Sağlıklı</option>
                    <option value={AnimalStatus.Pregnant}>Gebe</option>
                    <option value={AnimalStatus.Sick}>Hasta</option>
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-mono uppercase text-gray-400 tracking-widest">Doğum Tarihi</label>
                <input 
                  type="date" 
                  value={newSheep.birthDate || ''}
                  onChange={(e) => setNewSheep({...newSheep, birthDate: e.target.value})}
                  className="w-full p-3 bg-gray-50 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-black/5"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-mono uppercase text-gray-400 tracking-widest">Açıklama / Özel Notlar</label>
                <textarea 
                  placeholder="Hayvan hakkında genel notlar..."
                  value={newSheep.notes || ''}
                  onChange={(e) => setNewSheep({...newSheep, notes: e.target.value})}
                  className="w-full p-3 bg-gray-50 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-black/5 h-20 resize-none text-sm"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button 
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 py-3 border border-gray-100 rounded-xl font-medium hover:bg-gray-50"
                >
                  İptal
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-3 bg-black text-white rounded-xl font-medium hover:bg-gray-800 shadow-md"
                >
                  Kaydet
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
