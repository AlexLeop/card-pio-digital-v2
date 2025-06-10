
import { useState, useEffect } from 'react';
import { Store } from '@/types';

interface SchedulingSlot {
  date: string;
  time: string;
  available: boolean;
  reason?: string;
}

interface DeliveryScheduleSlot {
  start: string;
  end: string;
  enabled: boolean;
}

export const useSchedulingManager = (store: Store) => {
  const [availableSlots, setAvailableSlots] = useState<SchedulingSlot[]>([]);

  useEffect(() => {
    generateAvailableSlots();
  }, [store]);

  const generateAvailableSlots = () => {
    if (!store.allow_scheduling) {
      setAvailableSlots([]);
      return;
    }

    const slots: SchedulingSlot[] = [];
    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5);

    // Generate slots for the next 7 days
    for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
      const date = new Date();
      date.setDate(date.getDate() + dayOffset);
      
      // Fix the date formatting - get the day name correctly
      const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const dayName = dayNames[date.getDay()];
      
      // Type guard for weekly_schedule
      const weeklySchedule = store.weekly_schedule as any;
      const daySchedule = weeklySchedule?.[dayName];
      
      if (!daySchedule || daySchedule.closed) continue;

      // Check for special dates
      const dateString = date.toISOString().split('T')[0];
      const specialDates = store.special_dates as any[];
      const specialDate = specialDates?.find((sd: any) => sd.date === dateString);
      
      if (specialDate?.closed) continue;

      const openTime = specialDate?.open || daySchedule.open;
      const closeTime = specialDate?.close || daySchedule.close;

      // Generate hourly slots
      const startHour = parseInt(openTime.split(':')[0]);
      const endHour = parseInt(closeTime.split(':')[0]);

      for (let hour = startHour; hour < endHour; hour++) {
        const timeSlot = `${hour.toString().padStart(2, '0')}:00`;
        
        let available = true;
        let reason = '';

        // Check if it's today and already past the cutoff time
        if (dayOffset === 0 && store.same_day_cutoff_time && currentTime > store.same_day_cutoff_time) {
          available = false;
          reason = 'Horário limite para hoje já passou';
        }

        // Check if the time slot is in delivery schedule
        const deliverySchedule = store.delivery_schedule as Record<string, DeliveryScheduleSlot>;
        if (deliverySchedule) {
          const deliverySlots = Object.values(deliverySchedule);
          const hasDeliverySlot = deliverySlots.some((slot: DeliveryScheduleSlot) => 
            slot.enabled && timeSlot >= slot.start && timeSlot <= slot.end
          );

          if (!hasDeliverySlot && deliverySlots.length > 0) {
            available = false;
            reason = 'Horário não disponível para entrega';
          }
        }

        slots.push({
          date: dateString,
          time: timeSlot,
          available,
          reason
        });
      }
    }

    setAvailableSlots(slots);
  };

  const isSlotAvailable = (date: string, time: string) => {
    const slot = availableSlots.find(s => s.date === date && s.time === time);
    return slot?.available || false;
  };

  const getSlotsByDate = (date: string) => {
    return availableSlots.filter(slot => slot.date === date);
  };

  const getNextAvailableSlot = () => {
    return availableSlots.find(slot => slot.available);
  };

  return {
    availableSlots,
    isSlotAvailable,
    getSlotsByDate,
    getNextAvailableSlot,
    refreshSlots: generateAvailableSlots
  };
};
