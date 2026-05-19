import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { useAuth } from './FirebaseContext';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { Team } from '../types';
import { Plus, Shield, Users } from 'lucide-react';
import { motion } from 'motion/react';

const MyTeams: React.FC = () => {
  const { user } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');

  useEffect(() => {
    if (!user) return;

    const q = query(collection(db, 'teams'), where('managerId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const teamData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Team));
      setTeams(teamData);
      setLoading(false);
    });

    return unsubscribe;
  }, [user]);

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamName.trim() || !user) return;

    try {
      await addDoc(collection(db, 'teams'), {
        name: newTeamName,
        managerId: user.uid,
        createdAt: serverTimestamp(),
      });
      setNewTeamName('');
      setShowCreate(false);
    } catch (error) {
      console.error("Error creating team:", error);
    }
  };

  if (loading) return <div className="p-8 text-slate-500">Loading teams...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Your Teams</h2>
          <p className="text-slate-500">Manage your rosters and view booking history.</p>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-xl font-medium hover:bg-slate-800 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create Team
        </button>
      </div>

      {showCreate && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm"
        >
          <form onSubmit={handleCreateTeam} className="flex gap-4">
            <input
              type="text"
              value={newTeamName}
              onChange={(e) => setNewTeamName(e.target.value)}
              placeholder="Enter team name..."
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
              autoFocus
            />
            <button
              type="submit"
              className="bg-slate-900 text-white px-6 py-2 rounded-xl font-medium"
            >
              Save
            </button>
          </form>
        </motion.div>
      )}

      {teams.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-dashed border-slate-200">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="text-slate-300 w-8 h-8" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900">No teams found</h3>
          <p className="text-slate-500 max-w-xs mx-auto mb-6">Create your first team to start booking field slots and challenging others.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {teams.map((team) => (
            <motion.div
              key={team.id}
              whileHover={{ y: -4 }}
              className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center">
                  <Users className="text-slate-400 w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-lg text-slate-900">{team.name}</h4>
                  <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Manager</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button className="flex-1 text-sm bg-slate-50 text-slate-600 py-2 rounded-xl font-medium hover:bg-slate-100 transition-colors">
                  Roster
                </button>
                <button className="flex-1 text-sm bg-slate-50 text-slate-600 py-2 rounded-xl font-medium hover:bg-slate-100 transition-colors">
                  History
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyTeams;
