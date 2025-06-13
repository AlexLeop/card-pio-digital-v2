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

                const handleCheckout = () => {
                  // Verificação adicional antes de abrir o checkout
                  if (!canProceed()) {
                    toast({
                      title: "Valor mínimo não atingido",
                      description: `O valor mínimo do pedido é R$ ${store.minimum_order?.toFixed(2) || '0,00'}`,
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
                };

                return (
                  <>
                    <Card>
                      <CardContent className="p-4">
                        {/* ... existing code ... */}

                        {/* Botão de Finalizar */}
                        <Button
                          onClick={handleCheckout}
                          disabled={!canProceed()}
                          className={`w-full ${
                            !canProceed() 
                              ? 'bg-gray-400 cursor-not-allowed' 
                              : 'bg-primary hover:bg-primary/90'
                          }`}
                        >
                          {!canProceed() && store.minimum_order && getSubtotal() < store.minimum_order
                            ? `Faltam R$ ${(store.minimum_order - getSubtotal()).toFixed(2)}`
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