import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { useAuth } from './FirebaseContext';
import { 
  collection, doc, updateDoc, addDoc, onSnapshot, query, where, 
  serverTimestamp, runTransaction 
} from 'firebase/firestore';
import { Slot, Field, Team, SlotStatus, GameType } from '../types';
import { X, Shield, Lock, Globe, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';

interface BookingModalProps {
  slot: Slot;
  field: Field;
  onClose: () => void;
}

const BookingModal: React.FC<BookingModalProps> = ({ slot, field, onClose }) => {
  const { user } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string>('');
  const [gameType, setGameType] = useState<GameType>(GameType.PRIVATE);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'teams'), where('managerId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const teamData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Team));
      setTeams(teamData);
      if (teamData.length > 0) setSelectedTeamId(teamData[0].id);
    });
    return unsubscribe;
  }, [user]);

  const handleBooking = async () => {
    if (!selectedTeamId || !user) return;
    setLoading(true);
    setError(null);

    try {
      await runTransaction(db, async (transaction) => {
        const slotRef = doc(db, 'slots', slot.id);
        const slotSnap = await transaction.get(slotRef);

        if (!slotSnap.exists()) throw new Error("Slot does not exist!");
        if (slotSnap.data().status !== SlotStatus.AVAILABLE) {
          throw new Error("This slot was just booked by someone else!");
        }

        // Update slot
        transaction.update(slotRef, {
          status: SlotStatus.BOOKED,
          bookedByTeamId: selectedTeamId,
          gameType: gameType,
          updatedAt: serverTimestamp()
        });

        // Create booking record
        const bookingRef = doc(collection(db, 'bookings'));
        transaction.set(bookingRef, {
          slotId: slot.id,
          teamId: selectedTeamId,
          amount: slot.price,
          status: 'confirmed',
          createdAt: serverTimestamp()
        });
      });

      setSuccess(true);
      setTimeout(onClose, 2000);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An error occurred during booking.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white rounded-[32px] w-full max-w-lg overflow-hidden shadow-2xl"
      >
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900">Complete Booking</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <div className="p-8 space-y-8">
          {success ? (
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="py-12 text-center"
            >
              <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-10 h-10 text-green-500" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-2">Booking Confirmed!</h3>
              <p className="text-slate-500">Your field is reserved. Get ready for the game!</p>
            </motion.div>
          ) : (
            <>
              {/* Summary */}
              <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="font-bold text-slate-900">{field.name}</h4>
                    <p className="text-sm text-slate-500">{format(slot.startTime, 'EEEE, MMM d')}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-slate-900">${slot.price}</p>
                    <p className="text-xs text-slate-400">Total Price</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Clock className="w-4 h-4" />
                  {format(slot.startTime, 'h:mm a')} - {format(slot.endTime, 'h:mm a')}
                </div>
              </div>

              {/* Team Selection */}
              <div className="space-y-3">
                <label className="text-sm font-bold text-slate-900 uppercase tracking-wider">Select Your Team</label>
                {teams.length === 0 ? (
                  <div className="p-4 bg-orange-50 rounded-xl border border-orange-100 flex gap-3 text-orange-700 text-sm">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <p>You need to create a team in the "My Teams" tab before you can book a field.</p>
                  </div>
                ) : (
                  <select 
                    value={selectedTeamId}
                    onChange={(e) => setSelectedTeamId(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-slate-900/10 appearance-none"
                  >
                    {teams.map(team => (
                      <option key={team.id} value={team.id}>{team.name}</option>
                    ))}
                  </select>
                )}
              </div>

              {/* Game Type Selection */}
              <div className="space-y-3">
                <label className="text-sm font-bold text-slate-900 uppercase tracking-wider">Game Type</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setGameType(GameType.PRIVATE)}
                    className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${
                      gameType === GameType.PRIVATE 
                        ? 'border-slate-900 bg-slate-50' 
                        : 'border-slate-100 hover:border-slate-200'
                    }`}
                  >
                    <Lock className={`w-5 h-5 ${gameType === GameType.PRIVATE ? 'text-slate-900' : 'text-slate-400'}`} />
                    <span className="font-bold text-sm">Private</span>
                    <span className="text-[10px] text-slate-400">Invite-only game</span>
                  </button>
                  <button
                    onClick={() => setGameType(GameType.OPEN_CHALLENGE)}
                    className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${
                      gameType === GameType.OPEN_CHALLENGE 
                        ? 'border-slate-900 bg-slate-50' 
                        : 'border-slate-100 hover:border-slate-200'
                    }`}
                  >
                    <Globe className={`w-5 h-5 ${gameType === GameType.OPEN_CHALLENGE ? 'text-slate-900' : 'text-slate-400'}`} />
                    <span className="font-bold text-sm">Open Challenge</span>
                    <span className="text-[10px] text-slate-400">Matchmaker enabled</span>
                  </button>
                </div>
              </div>

              {error && (
                <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm flex gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  {error}
                </div>
              )}

              <button
                disabled={loading || teams.length === 0}
                onClick={handleBooking}
                className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-3"
              >
                {loading ? "Processing..." : "Confirm & Pay"}
              </button>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default BookingModal;
