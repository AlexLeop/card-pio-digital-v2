import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import StorePage from "./pages/StorePage";
import OrderSuccess from "./pages/OrderSuccess";
import NotFound from "./pages/NotFound";
import StoresList from "@/components/stores/StoresList";
import CategoriesList from "@/components/categories/CategoriesList";
import CategoryForm from "@/components/categories/CategoryForm";
import ProductsList from "@/components/products/ProductsList";
import ProductForm from "@/components/products/ProductForm";
import OrdersList from "@/components/orders/OrdersList";
import OrderForm from "@/components/orders/OrderForm";
import CustomersList from "@/components/customers/CustomersList";
import CustomerForm from "@/components/customers/CustomerForm";
import AddonCategoryForm from "@/components/addons/AddonCategoryForm";
import ProductAddonForm from "@/components/addons/ProductAddonForm";
import AddonCategoriesTable from "@/components/addons/AddonCategoriesTable";
import SalesReport from "@/components/reports/SalesReport";
import SettingsPage from "@/components/settings/SettingsPage";
import OrderViewModal from "@/components/orders/OrderViewModal";
import PasswordProtectedEdit from "@/components/orders/PasswordProtectedEdit";
import StoreViewModal from "@/components/stores/StoreViewModal";
import { useState, useEffect } from "react";
import { useStores } from "./hooks/useStores";
import { useCategories } from "./hooks/useCategories";
import { useProducts } from "./hooks/useProducts";
import { useOrders } from "./hooks/useOrders";
import { useCustomers } from "./hooks/useCustomers";
import { useAddonCategories } from "./hooks/useAddonCategories";
import { useProductAddons } from "./hooks/useProductAddons";
import { supabase } from '@/integrations/supabase/client';
import { Category, Product, Order, Customer, AddonCategory, ProductAddon, Store } from '@/types';

const queryClient = new QueryClient();

const App = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeView, setActiveView] = useState('dashboard');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  
  // Form states
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | undefined>();
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [showAddonCategoryForm, setShowAddonCategoryForm] = useState(false);
  const [editingAddonCategory, setEditingAddonCategory] = useState<AddonCategory | null>(null);
  const [showAddonForm, setShowAddonForm] = useState(false);
  const [editingAddon, setEditingAddon] = useState<ProductAddon | null>(null);

  // View states for orders and stores
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null);
  const [showPasswordProtection, setShowPasswordProtection] = useState(false);
  const [pendingEditOrder, setPendingEditOrder] = useState<Order | null>(null);
  const [viewingStore, setViewingStore] = useState<Store | null>(null);

  // Use the real store ID from the database
  const currentStoreId = "7688fcbf-a2a7-483a-aefd-62edadf6db82"; // Real store ID from database
  const currentStoreName = "Alex's Doces e Salgados"; // Real store name

  // Hooks de dados - agora usando currentStoreId corretamente
  const { stores, addStore, updateStore, deleteStore, refetch: refetchStores } = useStores();
  const { categories, addCategory, updateCategory, deleteCategory, refetch: refetchCategories } = useCategories();
  const { products, addProduct, updateProduct, deleteProduct, loading: productsLoading, error: productsError, refetch: refetchProducts } = useProducts(currentStoreId); // Adicionar currentStoreId aqui
  const { orders, createOrder, updateOrderStatus, refetch: refetchOrders } = useOrders(currentStoreId);
  const { customers, addCustomer, updateCustomer, deleteCustomer, refetch: refetchCustomers } = useCustomers(currentStoreId);
  const { addonCategories, addAddonCategory, updateAddonCategory, deleteAddonCategory, refetch: refetchAddonCategories } = useAddonCategories(currentStoreId);
  const { productAddons, addProductAddon, updateProductAddon, deleteProductAddon, refetch: refetchProductAddons } = useProductAddons();

  useEffect(() => {
    // Check initial session
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
    };

    checkSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Category handlers
  const handleAddCategory = () => {
    setEditingCategory(undefined);
    setShowCategoryForm(true);
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setShowCategoryForm(true);
  };

  const handleSaveCategory = async (categoryData: Partial<Category>) => {
    try {
      if (editingCategory) {
        await updateCategory(editingCategory.id, categoryData);
      } else {
        await addCategory(categoryData as Omit<Category, 'id' | 'created_at'>);
      }
      setShowCategoryForm(false);
      setEditingCategory(undefined);
    } catch (error) {
      console.error('Error saving category:', error);
    }
  };

  // Product handlers
  const handleAddProduct = async (productData: Omit<Product, 'id' | 'created_at'>) => {
    try {
      await addProduct(productData);
      refetchProducts();
    } catch (error) {
      console.error('Erro ao adicionar produto:', error);
      throw error;
    }
  };

  const handleEditProduct = async (productId: string, productData: Partial<Product> & { selectedAddonCategories?: string[] }) => {
    try {
      await updateProduct(productId, productData);
      refetchProducts();
    } catch (error) {
      console.error('Erro ao editar produto:', error);
      throw error;
    }
  };

  const handleSaveProduct = async () => {
    setShowProductForm(false);
    setEditingProduct(null);
    refetchProducts();
  };

  // Order handlers
  const handleAddOrder = () => {
    setEditingOrder(null);
    setShowOrderForm(true);
  };

  const handleViewOrder = (order: Order) => {
    setViewingOrder(order);
  };

  const handleEditOrder = (order: Order) => {
    setPendingEditOrder(order);
    setShowPasswordProtection(true);
  };

  const handlePasswordSuccess = () => {
    setShowPasswordProtection(false);
    setEditingOrder(pendingEditOrder);
    setShowOrderForm(true);
    setPendingEditOrder(null);
  };

  const handleSaveOrder = () => {
    setShowOrderForm(false);
    setEditingOrder(null);
    refetchOrders();
  };

  // Customer handlers
  const handleAddCustomer = () => {
    setEditingCustomer(null);
    setShowCustomerForm(true);
  };

  const handleEditCustomer = (customer: Customer) => {
    setEditingCustomer(customer);
    setShowCustomerForm(true);
  };

  const handleSaveCustomer = () => {
    setShowCustomerForm(false);
    setEditingCustomer(null);
    refetchCustomers();
  };

  // Store handlers
  const handleViewStore = (store: Store) => {
    setViewingStore(store);
  };

  const handleEditStore = async (store: Store) => {
    try {
      await updateStore(store.id, store);
      setViewingStore(null);
    } catch (error) {
      console.error('Error updating store:', error);
    }
  };

  // Addon category handlers
  const handleEditAddonCategory = (category: AddonCategory) => {
    setEditingAddonCategory(category);
    setShowAddonCategoryForm(true);
  };

  const handleAddAddonCategory = () => {
    setEditingAddonCategory(null);
    setShowAddonCategoryForm(true);
  };

  const handleSaveAddonCategory = () => {
    setShowAddonCategoryForm(false);
    setEditingAddonCategory(null);
    refetchAddonCategories();
  };

  // Product addon handlers
  const handleEditAddon = (addon: ProductAddon) => {
    setEditingAddon(addon);
    setShowAddonForm(true);
  };

  const handleAddAddon = (categoryId?: string) => {
    setEditingAddon(null);
    // Store categoryId for form
    setEditingAddon({ addon_category_id: categoryId } as ProductAddon);
    setShowAddonForm(true);
  };

  const handleSaveAddon = () => {
    setShowAddonForm(false);
    setEditingAddon(null);
    refetchProductAddons();
    refetchAddonCategories();
  };

  const renderMainContent = () => {
    switch (activeView) {
      case 'stores':
        return (
          <>
            <StoresList 
              stores={stores} 
              onAddStore={async (storeData) => {
                try {
                  await addStore(storeData);
                } catch (error) {
                  console.error('Error adding store:', error);
                }
              }} 
              onEditStore={handleEditStore} 
              onViewStore={handleViewStore} 
            />
            {viewingStore && (
              <StoreViewModal
                store={viewingStore}
                onClose={() => setViewingStore(null)}
                onEdit={handleEditStore}
              />
            )}
          </>
        );
      case 'categories':
        return (
          <>
            {showCategoryForm ? (
              <CategoryForm
                category={editingCategory}
                onSave={handleSaveCategory}
                onCancel={() => {
                  setShowCategoryForm(false);
                  setEditingCategory(undefined);
                }}
              />
            ) : (
              <CategoriesList 
                categories={categories} 
                onAddCategory={handleAddCategory} 
                onEditCategory={handleEditCategory} 
                onViewCategory={(category) => console.log('View category:', category)} 
              />
            )}
          </>
        );
      case 'products':
        return (
          <>
            <ProductsList 
              products={products} 
              categories={categories} 
              storeId={currentStoreId}
              loading={productsLoading}
              error={productsError}
              onAddProduct={handleAddProduct} 
              onEditProduct={handleEditProduct} 
              onViewProduct={(product) => console.log('View product:', product)} 
              onRefresh={refetchProducts}
            />
          </>
        );
      case 'orders':
        return (
          <>
            {showOrderForm && (
              <OrderForm
                order={editingOrder}
                storeId={currentStoreId}
                onClose={() => setShowOrderForm(false)}
                onSave={handleSaveOrder}
              />
            )}
            {viewingOrder && (
              <OrderViewModal
                order={viewingOrder}
                onClose={() => setViewingOrder(null)}
                storeName={currentStoreName}
              />
            )}
            {showPasswordProtection && (
              <PasswordProtectedEdit
                isOpen={showPasswordProtection}
                onClose={() => {
                  setShowPasswordProtection(false);
                  setPendingEditOrder(null);
                }}
                onSuccess={handlePasswordSuccess}
                title="Editar Pedido"
              />
            )}
            <OrdersList 
              orders={orders} 
              onAddOrder={handleAddOrder} 
              onEditOrder={handleEditOrder} 
              onViewOrder={handleViewOrder}
              onUpdateStatus={(orderId, status) => updateOrderStatus(orderId, status)} 
            />
          </>
        );
      case 'customers':
        return (
          <>
            {showCustomerForm && (
              <CustomerForm
                customer={editingCustomer}
                storeId={currentStoreId}
                onClose={() => setShowCustomerForm(false)}
                onSave={handleSaveCustomer}
              />
            )}
            <CustomersList 
              customers={customers} 
              onAddCustomer={handleAddCustomer} 
              onEditCustomer={handleEditCustomer} 
              onViewCustomer={(customer) => console.log('View customer:', customer)} 
            />
          </>
        );
      case 'addons':
        return (
          <>
            {showAddonCategoryForm && (
              <AddonCategoryForm
                addonCategory={editingAddonCategory}
                storeId={currentStoreId}
                onClose={() => setShowAddonCategoryForm(false)}
                onSave={handleSaveAddonCategory}
              />
            )}
            {showAddonForm && (
              <ProductAddonForm
                addon={editingAddon}
                storeId={currentStoreId}
                categoryId={editingAddon?.addon_category_id}
                onClose={() => setShowAddonForm(false)}
                onSave={handleSaveAddon}
              />
            )}
            <AddonCategoriesTable 
              categories={addonCategories} 
              addons={productAddons}
              onEditCategory={(category) => {
                if (category.id) {
                  handleEditAddonCategory(category);
                } else {
                  handleAddAddonCategory();
                }
              }}
              onEditAddon={(addon) => {
                if (addon.id) {
                  handleEditAddon(addon);
                } else {
                  handleAddAddon();
                }
              }}
              onAddCategory={handleAddAddonCategory}
              onAddAddon={handleAddAddon}
              onRefresh={() => {
                refetchAddonCategories();
                refetchProductAddons();
              }}
            />
          </>
        );
      case 'reports':
        return <SalesReport storeId={currentStoreId} storeName={currentStoreName} />;
      case 'settings':
        return <SettingsPage onSave={() => console.log('Settings saved')} storeId={currentStoreId} />;
      default:
        return <Index />;
    }
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/loja/:slug" element={<StorePage />} />
            <Route path="/pedido/:orderId" element={<OrderSuccess />} />
            <Route
              path="/*"
              element={
                isAuthenticated === false ? (
                  <Auth />
                ) : isAuthenticated === null ? (
                  <div className="min-h-screen flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : (
                  <SidebarProvider>
                    <div className="min-h-screen flex w-full">
                      <Sidebar 
                        isOpen={sidebarOpen}
                        activeView={activeView}
                        onViewChange={setActiveView}
                      />
                      <div className="flex-1 flex flex-col lg:ml-64">
                        <Navbar 
                          onMenuClick={() => setSidebarOpen(!sidebarOpen)}
                        />
                        <main className="flex-1 p-6">
                          <Routes>
                            <Route path="/" element={renderMainContent()} />
                            <Route path="/dashboard" element={renderMainContent()} />
                            <Route path="*" element={<NotFound />} />
                          </Routes>
                        </main>
                      </div>
                    </div>
                  </SidebarProvider>
                )
              }
            />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
