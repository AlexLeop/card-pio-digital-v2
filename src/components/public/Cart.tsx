                {/* Opções rápidas */}
                <div className="grid grid-cols-1 gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowCalendar(true)}
                    className="text-sm"
                  >
                    <Calendar className="h-4 w-4 mr-1" />
                    Escolher Data
                  </Button>
                </div>

                {/* Slots rápidos */} 

                // Obter slots disponíveis
                const availableSlots = useMemo(() => {
                  if (!store?.allow_scheduling || !cart || cart.length === 0) return [];
                  return SchedulingManager.getAvailableSlots(store, 'delivery', 7, cart);
                }, [store?.allow_scheduling, cart]);

                // Função para formatar data e hora
                const formatDateTime = (dateStr: string, timeStr: string) => {
                  const date = new Date(dateStr + 'T' + timeStr);
                  return date.toLocaleDateString('pt-BR') + ' às ' + timeStr;
                };

                // Usar a calculadora unificada
                const totals = useMemo(() => {
                  if (!cart || cart.length === 0) return { subtotal: 0, total: 0 };
                  return calculateOrderTotal(cart, 0);
                }, [cart]);

                const cartTotal = totals.total;

                const canProceed = useMemo(() => {
                  if (!cart || cart.length === 0) return false;
                  const minimumOrder = store?.minimum_order || 0;
                  return cartTotal >= minimumOrder;
                }, [cart, cartTotal, store?.minimum_order]);

                const updateQuantity = useCallback((index: number, newQuantity: number) => {
                  if (newQuantity <= 0) {
                    onRemoveItem(index);
                  } else {
                    onUpdateItem(index, { quantity: newQuantity });
                  }
                }, [onRemoveItem, onUpdateItem]);

                const handleCheckout = useCallback(() => {
                  // Verificação adicional antes de abrir o checkout
                  if (!canProceed) {
                    toast({
                      title: "Valor mínimo não atingido",
                      description: `O valor mínimo do pedido é R$ ${store?.minimum_order?.toFixed(2) || '0,00'}`,
                      variant: "destructive"
                    });
                    return;
                  }

                  // Validar agendamento se houver
                  if (scheduledFor) {
                    const [date, time] = scheduledFor.split('T');
                    const validation = SchedulingManager.canScheduleOrder(
                      store, cart, deliveryType, date, time
                    );
                    
                    if (!validation.canSchedule) {
                      toast({
                        title: "Agendamento inválido",
                        description: validation.reason,
                        variant: "destructive"
                      });
                      setScheduledFor('');
                      return;
                    }
                  }

                  setShowCheckout(true);
                }, [canProceed, store, cart, deliveryType, scheduledFor]);

                if (!cart || cart.length === 0) {
                  return (
                    <Card>
                      <CardContent className="text-center py-8">
                        <ShoppingCart className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500">Seu carrinho está vazio</p>
                        <p className="text-sm text-gray-400">Adicione produtos para continuar</p>
                      </CardContent>
                    </Card>
                  );
                }

                return (
                  <>
                    <Card>
                      <CardContent className="p-4">
                        {/* ... existing code ... */}

                        {/* Botão de Finalizar */}
                        <Button
                          onClick={handleCheckout}
                          disabled={!canProceed}
                          className={`w-full ${
                            !canProceed 
                              ? 'bg-gray-400 cursor-not-allowed' 
                              : 'bg-primary hover:bg-primary/90'
                          }`}
                        >
                          {!canProceed && store?.minimum_order && cartTotal < store.minimum_order
                            ? `Faltam R$ ${(store.minimum_order - cartTotal).toFixed(2)}`
                            : 'Finalizar Pedido'
                          }
                        </Button>
                      </CardContent>
                    </Card>

                    {/* Modal de Checkout */}
                    {showCheckout && (
                      <CheckoutModal
                        cart={cart}
                        store={store}
                        onClose={() => setShowCheckout(false)}
                        onSuccess={() => {
                          setShowCheckout(false);
                          onCheckout();
                        }}
                        scheduledFor={scheduledFor}
                      />
                    )}
                  </>
                ); 