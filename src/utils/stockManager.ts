
import { Product, Store, SchedulingOption, CartItem } from '@/types';

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
    daysAhead: number = 7,
    cartItems?: CartItem[]
  ): SchedulingOption[] {
    const slots: SchedulingOption[] = [];
    const today = new Date();
    
    // Verificar se há produtos com estoque esgotado ou que não permitem agendamento no mesmo dia
    const hasStockIssues = cartItems?.some(item => {
      const product = item.product;
      // Verificar estoque diário
      if ((product as any).daily_stock && !StockManager.checkDailyStock(product)) {
        return true;
      }
      // Verificar se permite agendamento no mesmo dia
      if (!(product as any).allow_same_day_scheduling) {
        return true;
      }
      return false;
    }) || false;
    
    // Se há problemas de estoque ou produtos que não permitem mesmo dia, começar do dia seguinte
    const startDay = hasStockIssues ? 1 : 0;
    
    for (let i = startDay; i <= daysAhead; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      
      const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const dayName = dayNames[date.getDay()];
      
      let schedule;
      
      if (deliveryType === 'delivery') {
        // Para entrega: usar horários de entrega definidos pelo lojista
        schedule = (store as any).delivery_schedule?.[dayName];
      } else {
        // Para retirada: usar horários de funcionamento da loja
        schedule = (store as any).business_hours?.[dayName] || (store as any).pickup_schedule?.[dayName];
      }
      
      if (!schedule || schedule.closed || !schedule.enabled) continue;
      
      const dateStr = date.toISOString().split('T')[0];
      const isToday = i === 0;
      
      // Verificar estoque para cada produto do carrinho
      if (cartItems) {
        const hasStockForDay = cartItems.every(item => {
          const product = item.product;
          if ((product as any).daily_stock) {
            return StockManager.checkDailyStock(product);
          }
          return true;
        });
        
        if (!hasStockForDay) continue;
      }
      
      // Gerar slots de horário
      const startTime = this.parseTime(schedule.start || schedule.open);
      const endTime = this.parseTime(schedule.end || schedule.close);
      
      for (let hour = startTime.hours; hour <= endTime.hours; hour++) {
        for (let minute = 0; minute < 60; minute += 30) {
          if (hour === endTime.hours && minute > endTime.minutes) break;
          if (hour === startTime.hours && minute < startTime.minutes) continue;
          
          const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
          
          // Verificar horário limite para mesmo dia
          if (isToday) {
            const now = new Date();
            const currentTime = now.getHours() * 60 + now.getMinutes();
            const slotTime = hour * 60 + minute;
            
            // Aplicar horário limite baseado no tipo de entrega
            let cutoffTime;
            if (deliveryType === 'delivery') {
              cutoffTime = (store as any).delivery_cutoff_time || (store as any).same_day_cutoff_time;
            } else {
              cutoffTime = (store as any).pickup_cutoff_time || (store as any).same_day_cutoff_time;
            }
            
            if (cutoffTime) {
              const cutoffParts = cutoffTime.split(':');
              const cutoffMinutes = parseInt(cutoffParts[0]) * 60 + parseInt(cutoffParts[1]);
              
              if (currentTime > cutoffMinutes || slotTime <= currentTime + 60) {
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
  
  // Método específico para validar se um agendamento é possível
  static canScheduleOrder(
    store: Store,
    cartItems: CartItem[],
    deliveryType: 'delivery' | 'pickup',
    scheduledDate: string,
    scheduledTime: string
  ): { canSchedule: boolean; reason?: string } {
    const date = new Date(scheduledDate);
    const today = new Date();
    const isToday = date.toDateString() === today.toDateString();
    
    // Verificar se há produtos com estoque esgotado
    const outOfStockProducts = cartItems.filter(item => {
      const product = item.product;
      return (product as any).daily_stock && !StockManager.checkDailyStock(product);
    });
    
    if (outOfStockProducts.length > 0 && isToday) {
      return {
        canSchedule: false,
        reason: 'Alguns produtos estão com estoque esgotado para hoje. Escolha uma data futura.'
      };
    }
    
    // Verificar produtos que não permitem agendamento no mesmo dia
    const noSameDayProducts = cartItems.filter(item => {
      const product = item.product;
      return !(product as any).allow_same_day_scheduling;
    });
    
    if (noSameDayProducts.length > 0 && isToday) {
      return {
        canSchedule: false,
        reason: 'Alguns produtos não permitem agendamento para o mesmo dia. Escolha uma data futura.'
      };
    }
    
    // Verificar horários baseado no tipo de entrega
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayName = dayNames[date.getDay()];
    
    let schedule;
    if (deliveryType === 'delivery') {
      schedule = (store as any).delivery_schedule?.[dayName];
      if (!schedule || schedule.closed) {
        return {
          canSchedule: false,
          reason: 'Entrega não disponível neste dia da semana.'
        };
      }
    } else {
      schedule = (store as any).business_hours?.[dayName] || (store as any).pickup_schedule?.[dayName];
      if (!schedule || schedule.closed) {
        return {
          canSchedule: false,
          reason: 'Loja fechada neste dia da semana.'
        };
      }
    }
    
    // Verificar se o horário está dentro do funcionamento
    const startTime = schedule.start || schedule.open;
    const endTime = schedule.end || schedule.close;
    
    if (scheduledTime < startTime || scheduledTime > endTime) {
      return {
        canSchedule: false,
        reason: `Horário fora do funcionamento (${startTime} às ${endTime}).`
      };
    }
    
    return { canSchedule: true };
  }
  
  private static parseTime(timeStr: string): { hours: number; minutes: number } {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return { hours, minutes };
  }
}
