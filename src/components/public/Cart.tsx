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
                  if (!store?.allow_scheduling || !Array.isArray(cart) || cart.length === 0) return [];
                  return SchedulingManager.getAvailableSlots(store, 'delivery', 7, cart);
                }, [store?.allow_scheduling, cart]);

                // Função para formatar data e hora
                const formatDateTime = (dateStr: string, timeStr: string) => {
                  const date = new Date(dateStr + 'T' + timeStr);
                  return date.toLocaleDateString('pt-BR') + ' às ' + timeStr;
                };

                // Usar a calculadora unificada com validações
                const totals = useMemo(() => {
                  if (!Array.isArray(cart) || cart.length === 0) return { subtotal: 0, total: 0 };
                  return calculateOrderTotal(cart, 0);
                }, [cart]);

                const cartTotal = totals.total;

                const canProceed = useMemo(() => {
                  if (!Array.isArray(cart) || cart.length === 0) return false;
                  const minimumOrder = store?.minimum_order || 0;
                  return cartTotal >= minimumOrder;
                }, [cart, cartTotal, store?.minimum_order]);

                const updateQuantity = useCallback((index: number, newQuantity: number) => {
                  if (!Array.isArray(cart)) return;
                  
                  if (newQuantity <= 0) {
                    onRemoveItem(index);
                  } else {
                    onUpdateItem(index, { quantity: newQuantity });
                  }
                }, [onRemoveItem, onUpdateItem, cart]);

                const handleCheckout = useCallback(() => {
                  if (!Array.isArray(cart)) return;

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

                if (!Array.isArray(cart) || cart.length === 0) {
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
                        {/* Lista de itens */}
                        <div className="space-y-4">
                          {cart.map((item, index) => (
                            <div key={index} className="flex items-start space-x-4">
                              {/* Imagem do produto */}
                              <div className="w-16 h-16 flex-shrink-0">
                                <img
                                  src={item.product.image_url || '/placeholder.svg'}
                                  alt={item.product.name}
                                  className="w-full h-full object-cover rounded-lg"
                                />
                              </div>

                              {/* Detalhes do produto */}
                              <div className="flex-1">
                                <h3 className="font-medium">{item.product.name}</h3>
                                <p className="text-sm text-gray-500">
                                  R$ {item.product.price.toFixed(2)}
                                </p>
                                
                                {/* Adicionais */}
                                {Array.isArray(item.addons) && item.addons.length > 0 && (
                                  <div className="mt-1">
                                    {item.addons.map((addon, addonIndex) => (
                                      <p key={addonIndex} className="text-xs text-gray-500">
                                        + {addon.name} (R$ {addon.price.toFixed(2)})
                                      </p>
                                    ))}
                                  </div>
                                )}

                                {/* Observações */}
                                {item.notes && (
                                  <p className="text-xs text-gray-500 mt-1">
                                    Obs: {item.notes}
                                  </p>
                                )}
                              </div>

                              {/* Controles de quantidade */}
                              <div className="flex items-center space-x-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => updateQuantity(index, item.quantity - 1)}
                                >
                                  <Minus className="h-4 w-4" />
                                </Button>
                                <span className="w-8 text-center">{item.quantity}</span>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => updateQuantity(index, item.quantity + 1)}
                                >
                                  <Plus className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Total */}
                        <div className="mt-6 pt-6 border-t">
                          <div className="flex justify-between items-center mb-4">
                            <span className="text-lg font-medium">Total:</span>
                            <span className="text-xl font-bold">
                              R$ {cartTotal.toFixed(2)}
                            </span>
                          </div>

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
                        </div>
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