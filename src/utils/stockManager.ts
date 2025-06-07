
import { Product, Store, SchedulingOption } from '@/types';

export class StockManager {
  static checkDailyStock(product: Product): boolean {
    if (!(product as any).daily_stock) return true;
    
    const today = new Date().toDateString();
    const lastReset = (product as any).stock_last_reset ? new Date((product as any).stock_last_reset).toDateString() : '';
    
    // Se o estoque não foi resetado hoje, considerar que tem estoque total
    if (lastReset !== today) {
      return (product as any).daily_stock > 0;
    }
    
    return ((product as any).current_stock || 0) > 0;
  }

  static resetDailyStock(products: Product[]): Product[] {
    const today = new Date().toISOString();
    
    return products.map(product => {
      if ((product as any).daily_stock && (product as any).stock_last_reset) {
        const lastReset = new Date((product as any).stock_last_reset).toDateString();
        const currentDate = new Date().toDateString();
        
        if (lastReset !== currentDate) {
          return {
            ...product,
            current_stock: (product as any).daily_stock,
            stock_last_reset: today
          } as Product;
        }
      }
      return product;
    });
  }

  static reduceStock(product: Product, quantity: number): Product {
    if (!(product as any).daily_stock) return product;
    
    const newStock = Math.max(0, ((product as any).current_stock || (product as any).daily_stock) - quantity);
    
    return {
      ...product,
      current_stock: newStock
    } as Product;
  }

  static canDeliverSameDay(store: Store, product: Product): boolean {
    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5);
    
    // Verificar se passou do horário limite
    if ((store as any).same_day_cutoff_time && currentTime > (store as any).same_day_cutoff_time) {
      return false;
    }
    
    // Verificar estoque
    if (!this.checkDailyStock(product)) {
      return false;
    }
    
    // Verificar se o produto permite agendamento no mesmo dia
    return (product as any).allow_same_day_scheduling !== false;
  }
}

export class SchedulingManager {
  static getAvailableSlots(
    store: Store, 
    deliveryType: 'delivery' | 'pickup',
    daysAhead: number = 7
  ): SchedulingOption[] {
    const slots: SchedulingOption[] = [];
    const today = new Date();
    
    for (let i = 0; i <= daysAhead; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      
      // Get day name correctly
      const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const dayName = dayNames[date.getDay()];
      
      const schedule = deliveryType === 'delivery' 
        ? (store as any).delivery_schedule?.[dayName] 
        : (store as any).pickup_schedule?.[dayName];
      
      if (!schedule?.enabled) continue;
      
      const dateStr = date.toISOString().split('T')[0];
      
      // Gerar slots de horário a cada 30 minutos
      const startTime = this.parseTime(schedule.start);
      const endTime = this.parseTime(schedule.end);
      
      for (let hour = startTime.hours; hour <= endTime.hours; hour++) {
        for (let minute = 0; minute < 60; minute += 30) {
          if (hour === endTime.hours && minute > endTime.minutes) break;
          if (hour === startTime.hours && minute < startTime.minutes) continue;
          
          const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
          
          // Verificar se é no mesmo dia e já passou do horário limite
          const isToday = i === 0;
          const isSameDay = isToday;
          
          if (isSameDay) {
            const now = new Date();
            const currentTime = now.getHours() * 60 + now.getMinutes();
            const slotTime = hour * 60 + minute;
            
            if ((store as any).same_day_cutoff_time) {
              const cutoffParts = (store as any).same_day_cutoff_time.split(':');
              const cutoffTime = parseInt(cutoffParts[0]) * 60 + parseInt(cutoffParts[1]);
              
              if (currentTime > cutoffTime || slotTime <= currentTime + 60) {
                continue;
              }
            }
          }
          
          slots.push({
            date: dateStr,
            time: timeStr,
            available: true
          });
        }
      }
    }
    
    return slots;
  }
  
  private static parseTime(timeStr: string): { hours: number; minutes: number } {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return { hours, minutes };
  }
}
