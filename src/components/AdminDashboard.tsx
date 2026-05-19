import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { 
  collection, onSnapshot, addDoc, deleteDoc, doc, updateDoc, 
  query, orderBy, serverTimestamp, getDocs 
} from 'firebase/firestore';
import { Field, Slot, Team, SlotStatus, GameType, MatchType } from '../types';
import { Plus, Trash2, MapPin, Clock, Users, ShieldAlert, Check, X, Users2, Sword } from 'lucide-react';
import { format, addHours, parse } from 'date-fns';
import { motion } from 'motion/react';

const AdminDashboard: React.FC = () => {
  const [fields, setFields] = useState<Field[]>([]);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [allTeams, setAllTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [newFieldName, setNewFieldName] = useState('');
  const [newFieldLocation, setNewFieldLocation] = useState('');
  const [newSlotFieldId, setNewSlotFieldId] = useState('');
  const [newSlotDate, setNewSlotDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [newSlotTime, setNewSlotTime] = useState('09:00');
  const [newSlotMatchType, setNewSlotMatchType] = useState<MatchType>(MatchType.SMALL_SIDED);
  const [newSlotPrice, setNewSlotPrice] = useState(90);

  useEffect(() => {
    // Update price when match type changes in slot creation
    setNewSlotPrice(newSlotMatchType === MatchType.SMALL_SIDED ? 90 : 110);
  }, [newSlotMatchType]);

  useEffect(() => {
    const unsubFields = onSnapshot(collection(db, 'fields'), (snapshot) => {
      setFields(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Field)));
    });

    const unsubSlots = onSnapshot(query(collection(db, 'slots'), orderBy('startTime', 'asc')), (snapshot) => {
      setSlots(snapshot.docs.map(doc => {
        const d = doc.data();
        return { 
          id: doc.id, 
          ...d, 
          startTime: d.startTime?.toDate(),
          endTime: d.endTime?.toDate()
        } as Slot;
      }));
    });

    const unsubTeams = onSnapshot(collection(db, 'teams'), (snapshot) => {
      setAllTeams(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Team)));
    });

    setLoading(false);
    return () => {
      unsubFields();
      unsubSlots();
      unsubTeams();
    };
  }, []);

  const handleAddField = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFieldName || !newFieldLocation) return;
    await addDoc(collection(db, 'fields'), {
      name: newFieldName,
      location: newFieldLocation,
      capacity: 22,
      amenities: ["Grass"]
    });
    setNewFieldName('');
    setNewFieldLocation('');
  };

  const handleDeleteField = async (id: string) => {
    if (window.confirm('Delete this venue and all its slots?')) {
      await deleteDoc(doc(db, 'fields', id));
      // In a real app, delete associated slots too
    }
  };

  const handleAddSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSlotFieldId || !newSlotDate || !newSlotTime) return;
    
    const start = parse(`${newSlotDate} ${newSlotTime}`, 'yyyy-MM-dd HH:mm', new Date());
    const end = addHours(start, 1.5);

    await addDoc(collection(db, 'slots'), {
      fieldId: newSlotFieldId,
      startTime: start,
      endTime: end,
      price: Number(newSlotPrice),
      status: SlotStatus.AVAILABLE,
      gameType: GameType.PRIVATE,
      matchType: newSlotMatchType
    });
  };

  const handleDeleteSlot = async (id: string) => {
    await deleteDoc(doc(db, 'slots', id));
  };

  const handleMatchmake = async (slotId: string, opponentTeamId: string) => {
    await updateDoc(doc(db, 'slots', slotId), {
      opponentTeamId,
      updatedAt: serverTimestamp()
    });
  };

  if (loading) return <div className="p-8">Loading Admin...</div>;

  return (
    <div className="space-y-12 pb-20">
      <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-2xl text-amber-800">
        <ShieldAlert className="w-5 h-5 shrink-0" />
        <p className="text-sm font-medium">Admin Control Panel - Manage venues, inventory, and official match-ups.</p>
      </div>

      {/* Venues Management */}
      <section className="space-y-6">
        <h3 className="text-xl font-bold text-slate-900 px-1">Venues</h3>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <form onSubmit={handleAddField} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4 h-fit">
            <h4 className="font-bold text-slate-900 border-b border-slate-50 pb-2 mb-2">Add New Venue</h4>
            <input 
              type="text" placeholder="Venue Name" 
              value={newFieldName} onChange={e => setNewFieldName(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2"
            />
            <input 
              type="text" placeholder="Location" 
              value={newFieldLocation} onChange={e => setNewFieldLocation(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2"
            />
            <button className="w-full bg-slate-900 text-white py-2 rounded-xl font-bold">Add Field</button>
          </form>

          <div className="lg:col-span-2 space-y-3">
            {fields.map(f => (
              <div key={f.id} className="bg-white p-4 rounded-2xl border border-slate-100 flex items-center justify-between">
                <div>
                  <h5 className="font-bold text-slate-900">{f.name}</h5>
                  <p className="text-sm text-slate-500">{f.location}</p>
                </div>
                <button onClick={() => handleDeleteField(f.id)} className="p-2 text-slate-400 hover:text-red-500 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Slot Management */}
      <section className="space-y-6">
        <h3 className="text-xl font-bold text-slate-900 px-1">Time Slots</h3>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <form onSubmit={handleAddSlot} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h4 className="font-bold text-slate-900 border-b border-slate-50 pb-2 mb-2">Create Slot</h4>
            <select 
              value={newSlotFieldId} onChange={e => setNewSlotFieldId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2"
            >
              <option value="">Select Venue</option>
              {fields.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>
            <div className="grid grid-cols-2 gap-2">
              <input type="date" value={newSlotDate} onChange={e => setNewSlotDate(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm" />
              <input type="time" value={newSlotTime} onChange={e => setNewSlotTime(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm" />
            </div>
            
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold text-slate-400 px-1">Match Type</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setNewSlotMatchType(MatchType.SMALL_SIDED)}
                  className={`flex items-center justify-center gap-2 py-2 rounded-xl border text-xs font-bold transition-all ${
                    newSlotMatchType === MatchType.SMALL_SIDED ? 'bg-slate-900 text-white border-slate-900' : 'bg-slate-50 text-slate-500 border-slate-200'
                  }`}
                >
                  <Users2 className="w-3 h-3" />
                  Small Sided
                </button>
                <button
                  type="button"
                  onClick={() => setNewSlotMatchType(MatchType.FULL_FIELD)}
                  className={`flex items-center justify-center gap-2 py-2 rounded-xl border text-xs font-bold transition-all ${
                    newSlotMatchType === MatchType.FULL_FIELD ? 'bg-slate-900 text-white border-slate-900' : 'bg-slate-50 text-slate-500 border-slate-200'
                  }`}
                >
                  <Sword className="w-3 h-3" />
                  11v11
                </button>
              </div>
            </div>

            <div className="relative">
              <input type="number" placeholder="Price" value={newSlotPrice} onChange={e => setNewSlotPrice(Number(e.target.value))} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2" />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-bold">$</span>
            </div>
            <button className="w-full bg-slate-900 text-white py-2 rounded-xl font-bold">Add Slot</button>
          </form>

          <div className="lg:col-span-2 max-h-[500px] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
            {slots.map(s => {
              const field = fields.find(f => f.id === s.fieldId);
              return (
                <div key={s.id} className={`p-4 rounded-2xl border border-slate-100 flex items-center justify-between ${s.status === SlotStatus.BOOKED ? 'bg-slate-50 outline-2 outline-slate-100' : 'bg-white'}`}>
                  <div className="flex flex-col">
                    <span className="font-bold text-slate-900">{field?.name || 'Unknown'}</span>
                    <span className="text-xs text-slate-400">{format(s.startTime, 'MMM d, h:mm a')}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`text-[10px] uppercase font-black px-2 py-0.5 rounded-full ${s.status === SlotStatus.BOOKED ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'}`}>
                      {s.status}
                    </span>
                    <button onClick={() => handleDeleteSlot(s.id)} className="p-2 text-slate-300 hover:text-red-500 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Matchmaking Control */}
      <section className="space-y-6">
        <h3 className="text-xl font-bold text-slate-900 px-1">Live Matchmaking</h3>
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-400 text-[10px] uppercase font-black tracking-widest">
              <tr>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Match Type</th>
                <th className="px-6 py-4">Venue & Time</th>
                <th className="px-6 py-4">Team A (Challenger)</th>
                <th className="px-6 py-4">Team B (Opponent)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-sm">
              {slots.filter(s => s.status === SlotStatus.BOOKED).map(s => {
                const teamA = allTeams.find(t => t.id === s.bookedByTeamId);
                const teamB = allTeams.find(t => t.id === s.opponentTeamId);
                return (
                  <tr key={s.id} className="hover:bg-slate-50/50">
                    <td className="px-6 py-4">
                      {s.gameType === GameType.OPEN_CHALLENGE ? (
                        <span className="bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full text-[10px] font-bold">Open</span>
                      ) : (
                        <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-[10px] font-bold">Private</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-tighter">
                        {(s as any).matchType === 'small_sided' ? 'Small Sided' : (s as any).matchType === '11v11' ? '11v11' : '---'}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-900">
                      <div>{fields.find(f => f.id === s.fieldId)?.name}</div>
                      <div className="text-xs text-slate-400">{format(s.startTime, 'MMM d, h:mm a')}</div>
                    </td>
                    <td className="px-6 py-4 text-slate-600 font-bold">{teamA?.name || '---'}</td>
                    <td className="px-6 py-4">
                      {teamB ? (
                        <div className="flex items-center gap-2 text-green-600 font-bold">
                          <Check className="w-4 h-4" />
                          {teamB.name}
                        </div>
                      ) : (
                        <select 
                          onChange={(e) => handleMatchmake(s.id, e.target.value)}
                          className="bg-slate-50 border border-slate-100 rounded-lg px-2 py-1 text-xs outline-none"
                        >
                          <option value="">Assign Opponent...</option>
                          {allTeams.filter(t => t.id !== s.bookedByTeamId).map(t => (
                            <option key={t.id} value={t.id}>{t.name}</option>
                          ))}
                        </select>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default AdminDashboard;
