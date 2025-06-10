export const isStoreOpen = (store: any): boolean => {
  const now = new Date();
  const currentDay = now.getDay(); // 0 = domingo, 1 = segunda, etc.
  const currentTime = now.toTimeString().slice(0, 5); // HH:MM
  
  // Mapear dias da semana
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const currentDayName = dayNames[currentDay];
  
  // Verificar se a loja tem horários configurados no weekly_schedule
  if (store.weekly_schedule && store.weekly_schedule[currentDayName]) {
    const daySchedule = store.weekly_schedule[currentDayName];
    
    // Se está fechado no dia
    if (daySchedule.closed) {
      return false;
    }
    
    // Verificar se está dentro do horário
    const openTime = daySchedule.open || '08:00';
    const closeTime = daySchedule.close || '22:00';
    
    return currentTime >= openTime && currentTime <= closeTime;
  }
  
  // Fallback para business_hours (compatibilidade)
  if (store.business_hours && store.business_hours[currentDay]) {
    const daySchedule = store.business_hours[currentDay];
    
    if (daySchedule.closed) {
      return false;
    }
    
    return currentTime >= daySchedule.open && currentTime <= daySchedule.close;
  }
  
  // Fallback para opening_time e closing_time
  if (store.opening_time && store.closing_time) {
    return currentTime >= store.opening_time && currentTime <= store.closing_time;
  }
  
  return false;
};