import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { useAuth } from './FirebaseContext';
import { 
  collection, query, where, onSnapshot, doc, updateDoc, 
  getDocs, getDoc 
} from 'firebase/firestore';
import { Slot, Team, Field, SlotStatus, GameType } from '../types';
import { Sword, MapPin, Clock, Users, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import { motion } from 'motion/react';

const Opponents: React.FC = () => {
  const { user } = useAuth();
  const [openSlots, setOpenSlots] = useState<Slot[]>([]);
  const [fields, setFields] = useState<Record<string, Field>>({});
  const [myTeams, setMyTeams] = useState<Team[]>([]);
  const [challengerTeams, setChallengerTeams] = useState<Record<string, Team>>({});
  const [loading, setLoading] = useState(true);
  const [joiningSlotId, setJoiningSlotId] = useState<string | null>(null);

  useEffect(() => {
    // 1. Fetch Open Challenge Slots
    const qSlots = query(
      collection(db, 'slots'), 
      where('status', '==', SlotStatus.BOOKED),
      where('gameType', '==', GameType.OPEN_CHALLENGE)
    );

    const unsubscribeSlots = onSnapshot(qSlots, async (snapshot) => {
      const slotData = snapshot.docs
        .map(doc => {
          const d = doc.data();
          return { 
            id: doc.id, 
            ...d, 
            startTime: d.startTime?.toDate(),
            endTime: d.endTime?.toDate()
          } as Slot;
        })
        .filter(s => !s.opponentTeamId); // Only those waiting for an opponent

      // Fetch challenger teams info
      const challengerIds = [...new Set(slotData.map(s => s.bookedByTeamId).filter(Boolean))];
      const teamMap: Record<string, Team> = { ...challengerTeams };
      
      for (const tId of challengerIds) {
        if (!tId || teamMap[tId]) continue;
        const tSnap = await getDoc(doc(db, 'teams', tId));
        if (tSnap.exists()) {
          teamMap[tId] = { id: tSnap.id, ...tSnap.data() } as Team;
        }
      }
      setChallengerTeams(teamMap);
      setOpenSlots(slotData);
      setLoading(false);
    });

    // 2. Fetch Fields
    const unsubscribeFields = onSnapshot(collection(db, 'fields'), (snapshot) => {
      const fieldMap: Record<string, Field> = {};
      snapshot.docs.forEach(doc => {
        fieldMap[doc.id] = { id: doc.id, ...doc.data() } as Field;
      });
      setFields(fieldMap);
    });

    // 3. Fetch My Teams
    if (user) {
      const qTeams = query(collection(db, 'teams'), where('managerId', '==', user.uid));
      const unsubscribeTeams = onSnapshot(qTeams, (snapshot) => {
        setMyTeams(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Team)));
      });
      return () => {
        unsubscribeSlots();
        unsubscribeFields();
        unsubscribeTeams();
      };
    }

    return () => {
      unsubscribeSlots();
      unsubscribeFields();
    };
  }, [user]);

  const handleJoinChallenge = async (slotId: string, teamId: string) => {
    setJoiningSlotId(slotId);
    try {
      await updateDoc(doc(db, 'slots', slotId), {
        opponentTeamId: teamId,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error("Error joining challenge:", error);
    } finally {
      setJoiningSlotId(null);
    }
  };

  if (loading) return <div className="p-8 text-slate-500">Scanning for challenges...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Open Challenges</h2>
        <p className="text-slate-500">Pick a fight! Join a team looking for an opponent.</p>
      </div>

      {openSlots.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-dashed border-slate-200">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Sword className="text-slate-300 w-8 h-8" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900">No active challenges</h3>
          <p className="text-slate-500 max-w-sm mx-auto">Wait for other teams to post an open challenge, or post one yourself when booking a field.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {openSlots.map((slot) => {
            const field = fields[slot.fieldId];
            const challenger = challengerTeams[slot.bookedByTeamId!];
            if (!field || !challenger) return null;

            return (
              <motion.div
                key={slot.id}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center font-bold text-slate-400">
                        {challenger.name.charAt(0)}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900">{challenger.name}</h4>
                        <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Challenger</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-slate-900 tracking-tight">{format(slot.startTime, 'MMM d')}</p>
                      <p className="text-xs text-slate-500">{format(slot.startTime, 'h:mm a')}</p>
                    </div>
                  </div>

                  <div className="space-y-3 bg-slate-50 p-4 rounded-2xl mb-6">
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <MapPin className="w-4 h-4 text-slate-400" />
                      {field.name}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Clock className="w-4 h-4 text-slate-400" />
                      2 Hours Match
                    </div>
                  </div>

                  {myTeams.length > 0 ? (
                    <div className="space-y-3">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Accept with team:</p>
                      <div className="flex flex-wrap gap-2">
                        {myTeams.map(myTeam => (
                          <button
                            key={myTeam.id}
                            disabled={joiningSlotId !== null || myTeam.id === challenger.id}
                            onClick={() => handleJoinChallenge(slot.id, myTeam.id)}
                            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
                              myTeam.id === challenger.id 
                                ? 'hidden' 
                                : 'bg-slate-900 text-white hover:bg-slate-800'
                            }`}
                          >
                            {joiningSlotId === slot.id ? 'Joining...' : <>
                              <CheckCircle2 className="w-4 h-4" />
                              Accept as {myTeam.name}
                            </>}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 bg-slate-100 rounded-2xl text-center">
                      <p className="text-xs text-slate-500 font-medium">Create a team to accept this challenge</p>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Opponents;
