import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, onSnapshot, query, where, orderBy } from 'firebase/firestore';
import { Slot, Field, SlotStatus } from '../types';
import { format } from 'date-fns';
import { MapPin, Clock, DollarSign, Info, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import { seedInitialData } from '../lib/seeds';
import BookingModal from './BookingModal';

const Inventory: React.FC = () => {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [fields, setFields] = useState<Record<string, Field>>({});
  const [loading, setLoading] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);

  useEffect(() => {
    // 1. Fetch Fields
    const unsubscribeFields = onSnapshot(collection(db, 'fields'), (snapshot) => {
      const fieldMap: Record<string, Field> = {};
      snapshot.docs.forEach(doc => {
        fieldMap[doc.id] = { id: doc.id, ...doc.data() } as Field;
      });
      setFields(fieldMap);
    });

    // 2. Fetch Slots
    const q = query(
      collection(db, 'slots'), 
      where('status', '==', SlotStatus.AVAILABLE),
      orderBy('startTime', 'asc')
    );
    const unsubscribeSlots = onSnapshot(q, (snapshot) => {
      const slotData = snapshot.docs.map(doc => {
        const data = doc.data();
        return { 
          id: doc.id, 
          ...data,
          startTime: data.startTime?.toDate(),
          endTime: data.endTime?.toDate()
        } as Slot;
      });
      setSlots(slotData);
      setLoading(false);
    });

    return () => {
      unsubscribeFields();
      unsubscribeSlots();
    };
  }, []);

  const handleSeed = async () => {
    setLoading(true);
    await seedInitialData();
  };

  if (loading) return <div className="p-8 text-slate-500">Loading inventory...</div>;

  if (slots.length === 0) {
    return (
      <div className="bg-white rounded-3xl p-12 text-center border border-dashed border-slate-200">
        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <Info className="text-slate-300 w-8 h-8" />
        </div>
        <h3 className="text-lg font-semibold text-slate-900">No available slots</h3>
        <p className="text-slate-500 max-w-xs mx-auto mb-6">There are currently no slots available for booking. If this is a new setup, you can seed example data.</p>
        <button
          onClick={handleSeed}
          className="flex items-center gap-2 bg-slate-900 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-slate-800 transition-colors mx-auto"
        >
          <Sparkles className="w-4 h-4" />
          Seed Example Fields & Slots
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Available Slots</h2>
          <p className="text-slate-500">Choose a venue and time that fits your team's schedule.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {slots.map((slot) => {
          const field = fields[slot.fieldId];
          if (!field) return null;

          return (
            <motion.div
              key={slot.id}
              whileHover={{ y: -4 }}
              className="bg-white rounded-3xl overflow-hidden border border-slate-200 shadow-sm flex flex-col"
            >
              <div className="relative h-48 overflow-hidden">
                <img 
                  src={field.imageUrl || 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&q=80&w=800'} 
                  alt={field.name}
                  className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                />
                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-slate-900 shadow-sm">
                  ${slot.price}/hr
                </div>
              </div>
              
              <div className="p-6 flex-1 flex flex-col">
                <h3 className="text-lg font-bold text-slate-900 mb-1">{field.name}</h3>
                <div className="flex items-center gap-1.5 text-slate-500 text-sm mb-4">
                  <MapPin className="w-3.5 h-3.5" />
                  <span className="line-clamp-1">{field.location}</span>
                </div>

                <div className="space-y-3 mb-6">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-slate-600 font-medium">
                      <Clock className="w-4 h-4" />
                      {format(slot.startTime, 'MMM d, h:mm a')}
                    </div>
                    <div className="text-slate-400">
                      - {format(slot.endTime, 'h:mm a')}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedSlot(slot)}
                  className="w-full mt-auto bg-slate-900 text-white py-3 rounded-2xl font-semibold hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
                >
                  <DollarSign className="w-4 h-4" />
                  Book Now
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {selectedSlot && (
        <BookingModal 
          slot={selectedSlot} 
          field={fields[selectedSlot.fieldId]}
          onClose={() => setSelectedSlot(null)} 
        />
      )}
    </div>
  );
};

export default Inventory;
