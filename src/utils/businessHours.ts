export const isStoreOpen = (store: Store): boolean => {
  const now = new Date();
  const currentDay = now.getDay(); // 0 = domingo, 1 = segunda, etc.
  const currentTime = now.toTimeString().slice(0, 5); // HH:MM
  
  // Verificar se a loja tem horários configurados
  if (!store.business_hours || !store.business_hours[currentDay]) {
    return false;
  }
  
  const daySchedule = store.business_hours[currentDay];
  
  // Se está fechado no dia
  if (daySchedule.closed) {
    return false;
  }
  
  // Verificar se está dentro do horário
  return currentTime >= daySchedule.open && currentTime <= daySchedule.close;
};