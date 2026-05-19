import { db } from './firebase';
import { collection, addDoc, serverTimestamp, getDocs, deleteDoc, query } from 'firebase/firestore';
import { SlotStatus, GameType, MatchType } from '../types';
import { addDays, setHours, setMinutes } from 'date-fns';

export async function seedInitialData() {
  const fieldsSnap = await getDocs(collection(db, 'fields'));
  if (!fieldsSnap.empty) return; // Already seeded

  console.log("Seeding Azusa inventory...");

  // Create requested fields
  const fields = [
    {
      name: "Azusa High School",
      location: "Main Stadium",
      imageUrl: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&q=80&w=800",
      capacity: 22,
      amenities: ["Bleachers", "Lockers"]
    },
    {
      name: "Turf Field",
      location: "Azusa Campus",
      imageUrl: "https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&q=80&w=800",
      capacity: 14,
      amenities: ["Artificial Turf"]
    },
    {
      name: "11v11 Grass",
      location: "West Wing Fields",
      imageUrl: "https://images.unsplash.com/photo-1431324155629-1a6eda1eed2d?auto=format&fit=crop&q=80&w=800",
      capacity: 22,
      amenities: ["Natural Grass"]
    },
    {
      name: "SS #1",
      location: "Small Sided North",
      imageUrl: "https://images.unsplash.com/photo-1536122221562-f263c8dd0d7b?auto=format&fit=crop&q=80&w=800",
      capacity: 10,
      amenities: ["Floodlights"]
    },
    {
      name: "SS #2",
      location: "Small Sided South",
      imageUrl: "https://images.unsplash.com/photo-1518605336324-48055906f20b?auto=format&fit=crop&q=80&w=800",
      capacity: 10,
      amenities: ["Floodlights"]
    }
  ];

  const fieldIds: string[] = [];
  for (const field of fields) {
    const docRef = await addDoc(collection(db, 'fields'), field);
    fieldIds.push(docRef.id);
  }

  // Create requested time slots for the next 7 days
  const startHours = [9, 10.5, 12, 13.5, 15]; // 9am, 10:30am, 12pm, 1:30pm, 3pm

  for (let i = 0; i < 7; i++) {
    const date = addDays(new Date(), i);

    for (const startHr of startHours) {
      const hour = Math.floor(startHr);
      const mins = (startHr % 1) * 60;

      for (const fieldId of fieldIds) {
        const startTime = setMinutes(setHours(date, hour), mins);
        const endTime = addDays(startTime, 0); // Resetting back to today but keeping it relative
        
        // Actually we want 90 min duration
        const finalStartTime = setMinutes(setHours(date, hour), mins);
        const finalEndTime = setMinutes(setHours(date, Math.floor(startHr + 1.5)), ( (startHr + 1.5) % 1 ) * 60);

        const field = fields[fieldIds.indexOf(fieldId)];
        const isFullField = field.name.includes('11v11') || field.name.includes('Stadium');
        const matchType = isFullField ? MatchType.FULL_FIELD : MatchType.SMALL_SIDED;
        const price = isFullField ? 110 : 90;

        await addDoc(collection(db, 'slots'), {
          fieldId,
          startTime: finalStartTime,
          endTime: finalEndTime,
          price,
          status: SlotStatus.AVAILABLE,
          gameType: GameType.PRIVATE,
          matchType
        });
      }
    }
  }
  
  console.log("Seeding complete!");
}
