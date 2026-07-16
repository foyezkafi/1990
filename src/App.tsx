import React, { useState, useEffect } from "react";
import { 
  Heart, 
  Bell,
  X,
  Sparkles,
  HelpCircle,
  Facebook,
  Instagram,
  MapPin,
  Phone,
  Mail
} from "lucide-react";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import ProductCard from "./components/ProductCard";
import DirectCheckoutModal from "./components/DirectCheckoutModal";
import AdminPanel from "./components/AdminPanel";
import { Product, Order, Notification, OrderStatus } from "./types";

export default function App() {
  // Navigation & layout
  const [currentView, setCurrentView] = useState<"shop" | "admin">("shop");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProductForOrder, setSelectedProductForOrder] = useState<Product | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [onlyShowWishlist, setOnlyShowWishlist] = useState(false);

  // Core Data
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [wishlist, setWishlist] = useState<Product[]>([]);

  // UI elements
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ title: string; message: string; type: 'success' | 'info' | 'warn' } | null>(null);
  const [isNotificationPanelOpen, setIsNotificationPanelOpen] = useState(false);

  // Load wishlist from Local Storage on mount
  useEffect(() => {
    try {
      const storedWishlist = localStorage.getItem("this1990_wishlist");
      if (storedWishlist) setWishlist(JSON.parse(storedWishlist));
    } catch (e) {
      console.error("Local storage error:", e);
    }
  }, []);

  const syncWishlistToStorage = (newWishlist: Product[]) => {
    setWishlist(newWishlist);
    localStorage.setItem("this1990_wishlist", JSON.stringify(newWishlist));
  };

  // REST API fetchers
  const fetchProducts = async () => {
    try {
      const res = await fetch("/api/products");
      if (res.ok) {
        const data = await res.json();
        setProducts(data);
      }
    } catch (e) {
      console.error("Fetch products failed:", e);
    }
  };

  const fetchOrders = async () => {
    try {
      const res = await fetch("/api/orders");
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      }
    } catch (e) {
      console.error("Fetch orders failed:", e);
    }
  };

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch (e) {
      console.error("Fetch notifications failed:", e);
    }
  };

  // Initialize data
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await fetchProducts();
      await fetchOrders();
      await fetchNotifications();
      setLoading(false);
    };
    init();
  }, []);

  // Real-time tracking polling: Check for status logs
  useEffect(() => {
    const interval = setInterval(async () => {
      await fetchNotifications();
      await fetchOrders();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Toast notifier trigger
  const showToast = (title: string, message: string, type: 'success' | 'info' | 'warn' = 'success') => {
    setToast({ title, message, type });
    setTimeout(() => setToast(null), 4500);
  };

  // Wishlist Toggle
  const handleToggleWishlist = (product: Product) => {
    const isSaved = wishlist.some((item) => item.id === product.id);
    let newWishlist;
    if (isSaved) {
      newWishlist = wishlist.filter((item) => item.id !== product.id);
      showToast("Removed from Saved Items", `${product.name} removed from wishlist.`);
    } else {
      newWishlist = [...wishlist, product];
      showToast("Saved to Wishlist", `${product.name} added to wishlist.`);
    }
    syncWishlistToStorage(newWishlist);
  };

  // Create order & pay via Manual Payment Transaction ID
  const handlePlaceOrderDirect = async (orderData: {
    customerName: string;
    phone: string;
    shippingAddress: string;
    selectedSize: string;
    selectedColor: string;
    quantity: number;
    paymentMethod: "bKash" | "Nagad";
    transactionId: string;
  }): Promise<Order | null> => {
    if (!selectedProductForOrder) return null;

    try {
      const grandTotal = selectedProductForOrder.price * orderData.quantity;

      const formattedItems = [{
        productId: selectedProductForOrder.id,
        name: selectedProductForOrder.name,
        price: selectedProductForOrder.price,
        quantity: orderData.quantity,
        selectedSize: orderData.selectedSize,
        selectedColor: orderData.selectedColor,
        image: selectedProductForOrder.image,
      }];

      // 1. Submit Order to Back-end Rest API
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: orderData.customerName,
          phone: orderData.phone,
          email: "customer@example.com", // standard email placeholder
          shippingAddress: orderData.shippingAddress,
          notes: `Ordered via WhatsApp Direct Checkout. Size: ${orderData.selectedSize}, Color: ${orderData.selectedColor}`,
          items: formattedItems,
          totalAmount: grandTotal,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to place order.");
      }

      const order: Order = await res.json();

      // 2. Submit payment transaction proof directly
      const paymentRes = await fetch(`/api/orders/${order.id}/payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentMethod: orderData.paymentMethod,
          transactionId: orderData.transactionId,
        }),
      });

      if (paymentRes.ok) {
        showToast("Order Created", `Payment transaction ${orderData.transactionId} has been successfully submitted for verification.`);
        await fetchOrders();
        await fetchNotifications();
        return order;
      }
      
      return order;
    } catch (e) {
      console.error("Direct order placement failure:", e);
      return null;
    }
  };

  // Admin status transition executor
  const handleAdminUpdateOrderStatus = async (
    orderId: string,
    status: OrderStatus,
    note?: string
  ): Promise<boolean> => {
    const res = await fetch(`/api/orders/${orderId}/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, note }),
    });

    if (res.ok) {
      showToast("Order Status Updated", `Status for ${orderId} is now '${status}'.`);
      await fetchOrders();
      await fetchNotifications();
      return true;
    }
    return false;
  };

  // Add a new product to database
  const handleAdminAddProduct = async (productData: Partial<Product>): Promise<boolean> => {
    const res = await fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(productData),
    });

    if (res.ok) {
      showToast("Catalog Updated", `Garment '${productData.name}' has been listed!`);
      await fetchProducts();
      return true;
    }
    return false;
  };

  // Read Notifications helper
  const handleMarkNotifRead = async (id: string) => {
    await fetch(`/api/notifications/${id}/read`, { method: "POST" });
    await fetchNotifications();
  };

  // Filters logic
  const filteredProducts = products.filter((p) => {
    const matchesCategory = selectedCategory === "All" || p.category === selectedCategory;
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesWishlist = !onlyShowWishlist || wishlist.some((item) => item.id === p.id);

    return matchesCategory && matchesSearch && matchesWishlist;
  });

  const unreadNotifs = notifications.filter(n => n.status === "unread");

  return (
    <div className="min-h-screen bg-stone-50 font-sans text-stone-900 flex flex-col justify-between">
      
      {/* Navigation Header */}
      <Navbar
        wishlist={wishlist}
        currentView="shop"
        onNavigate={(view) => {
          setCurrentView(view);
        }}
        onSearch={setSearchQuery}
        searchQuery={searchQuery}
        selectedCategory={selectedCategory}
        onSelectCategory={(cat) => {
          setSelectedCategory(cat);
          setOnlyShowWishlist(false);
        }}
      />

      {/* Main content stage */}
      <main className="flex-grow">
        
        {currentView === "shop" && (
          <div className="space-y-12 pb-24">
            {/* Display Hero slider only when not filtering for wishlist specifically */}
            {!onlyShowWishlist && selectedCategory === "All" && searchQuery === "" && (
              <Hero onShopNow={() => {
                const element = document.getElementById("collection-grid");
                element?.scrollIntoView({ behavior: "smooth" });
              }} />
            )}

            <div id="collection-grid" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
              
              {/* Category details header */}
              <div className="flex flex-col md:flex-row md:items-baseline justify-between border-b border-stone-200 pb-5 mb-8 gap-4">
                <div>
                  <h2 className="font-sans text-2xl font-light tracking-tight text-stone-900">
                    {onlyShowWishlist ? (
                      <span>Your <span className="font-semibold">Saved Items</span></span>
                    ) : (
                      <span>Explore <span className="font-semibold">{selectedCategory} Collection</span></span>
                    )}
                  </h2>
                  <p className="text-xs text-stone-400 mt-1 font-light">
                    Showing {filteredProducts.length} premium clothing items.
                  </p>
                </div>

                {/* Filter and sorting tabs */}
                <div className="flex flex-wrap items-center gap-3">
                  {/* Toggle Saved/Wishlist filter button */}
                  <button
                    onClick={() => setOnlyShowWishlist(!onlyShowWishlist)}
                    className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-all border ${
                      onlyShowWishlist 
                        ? "bg-red-50 text-red-700 border-red-200" 
                        : "bg-white text-stone-700 border-stone-200 hover:border-stone-950"
                    }`}
                  >
                    <Heart size={14} className={onlyShowWishlist ? "fill-red-500 text-red-500" : ""} />
                    <span>{onlyShowWishlist ? "Show All Products" : "Wishlist Only"}</span>
                  </button>
                </div>
              </div>

              {/* Grid content */}
              {loading ? (
                <div className="text-center py-20 font-mono text-stone-400 text-xs animate-pulse">
                  LOADING_COLLECTIONS_AND_MODELS...
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="text-center py-24 bg-white border border-stone-100 rounded-none">
                  <span className="text-stone-300 font-bold font-mono block text-base mb-2">NO_PRODUCTS_MATCH_FILTER</span>
                  <p className="text-stone-400 text-xs font-light max-w-md mx-auto leading-relaxed">
                    No articles match your filters. Try shifting price sliders, changing categories, or clearing search inputs.
                  </p>
                  <button
                    onClick={() => {
                      setSelectedCategory("All");
                      setSearchQuery("");
                      setOnlyShowWishlist(false);
                    }}
                    className="mt-6 inline-block text-xs bg-stone-950 text-white px-6 py-3 uppercase tracking-widest font-semibold cursor-pointer"
                  >
                    Reset All Filters
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-8">
                  {filteredProducts.map((prod) => (
                    <ProductCard
                      key={prod.id}
                      product={prod}
                      onOrderNow={setSelectedProductForOrder}
                      onToggleWishlist={handleToggleWishlist}
                      isWishlisted={wishlist.some((item) => item.id === prod.id)}
                    />
                  ))}
                </div>
              )}

            </div>
          </div>
        )}

        {currentView === "admin" && (
          <AdminPanel
            orders={orders}
            products={products}
            onAddProduct={handleAdminAddProduct}
            onUpdateOrderStatus={handleAdminUpdateOrderStatus}
            onRefreshData={async () => {
              await fetchOrders();
              await fetchProducts();
            }}
          />
        )}

      </main>

      {/* Global Direct Order Form Checkout Modal popup */}
      <DirectCheckoutModal
        product={selectedProductForOrder}
        onClose={() => setSelectedProductForOrder(null)}
        onPlaceOrder={handlePlaceOrderDirect}
      />

      {/* Elegant Micro-Toast Alert Slider */}
      {toast && (
        <div className="fixed top-24 right-6 z-50 bg-stone-950 text-white text-xs px-5 py-4 border border-white/10 shadow-2xl flex items-start gap-3 w-80 animate-fade-in rounded-none">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 flex-shrink-0 animate-ping"></div>
          <div>
            <h5 className="font-bold tracking-wide text-white uppercase text-[10px]">{toast.title}</h5>
            <p className="text-stone-300 font-light mt-1 text-[11px] leading-relaxed">{toast.message}</p>
          </div>
        </div>
      )}

      {/* Footer bar */}
      <footer className="bg-[#080808] text-white border-t border-white/5 pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          
          {/* Column 1: Logo, Brand Text & Social Icons */}
          <div className="space-y-5">
            <div className="flex items-center gap-2.5">
              <img 
                src="/src/assets/images/this1990_logo_1784210637465.jpg" 
                alt="This'1990 Logo" 
                className="w-8 h-8 object-cover rounded-sm border border-stone-800"
                referrerPolicy="no-referrer" 
              />
              <span className="font-sans font-black text-base tracking-wider text-white uppercase">
                This'1990
              </span>
            </div>
            
            <p className="text-xs text-stone-400 font-light leading-relaxed max-w-xs">
              This'1990 is a premium lifestyle brand based in Bangladesh, dedicated to bringing the finest quality Men's ethnic and casual wear to your wardrobe.
            </p>
            
            {/* Social Media Links */}
            <div className="flex items-center gap-3 pt-2">
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full border border-stone-800 flex items-center justify-center text-stone-400 hover:text-white hover:border-white transition-all">
                <Facebook size={14} />
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full border border-stone-800 flex items-center justify-center text-stone-400 hover:text-white hover:border-white transition-all">
                <Instagram size={14} />
              </a>
              <a href="https://www.tiktok.com/@vipman2524?_r=1&_t=ZS-977esqnS3K1" target="https://www.tiktok.com/@vipman2524?_r=1&_t=ZS-977esqnS3K1" rel="noopener noreferrer" className="w-8 h-8 rounded-full border border-stone-800 flex items-center justify-center text-stone-400 hover:text-white hover:border-white transition-all" aria-label="TikTok">
                <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 448 512" className="w-3.5 h-3.5">
                  <path d="M448,209.91a210.06,210.06,0,0,1-122.77-39.25V349.38A162.55,162.55,0,1,1,185,188.31V278.2a74.62,74.62,0,1,0,52.23,71.18V0l88,0a121.18,121.18,0,0,0,1.86,22.17h0A122.18,122.18,0,0,0,381,102.39a121.43,121.43,0,0,0,67,20.14Z"></path>
                </svg>
              </a>
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-stone-200 mb-5">Quick Links</h4>
            <ul className="text-xs text-stone-400 font-light space-y-3">
              <li>
                <button onClick={() => { setSelectedCategory("All"); setCurrentView("shop"); }} className="hover:text-white transition-colors text-left">
                  Shop All
                </button>
              </li>
              <li>
                <button onClick={() => { setSelectedCategory("All"); setCurrentView("shop"); }} className="hover:text-white transition-colors text-left">
                  About Us
                </button>
              </li>
              <li>
                <button onClick={() => { setSelectedCategory("All"); setCurrentView("shop"); }} className="hover:text-white transition-colors text-left">
                  Panjabi Collection
                </button>
              </li>
              <li>
                <button onClick={() => { setSelectedCategory("All"); setCurrentView("shop"); }} className="hover:text-white transition-colors text-left">
                  Contact Us
                </button>
              </li>
            </ul>
          </div>

          {/* Column 3: Customer Care */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-stone-200 mb-5">Customer Care</h4>
            <ul className="text-xs text-stone-400 font-light space-y-3">
              <li>
                <button onClick={() => { setSelectedCategory("All"); setCurrentView("shop"); }} className="hover:text-white transition-colors text-left">
                  Shipping Policy
                </button>
              </li>
              <li>
                <button onClick={() => { setSelectedCategory("All"); setCurrentView("shop"); }} className="hover:text-white transition-colors text-left">
                  Return & Refund
                </button>
              </li>
              <li>
                <button onClick={() => { setSelectedCategory("All"); setCurrentView("shop"); }} className="hover:text-white transition-colors text-left">
                  Terms of Service
                </button>
              </li>
              <li>
                <button onClick={() => { setSelectedCategory("All"); setCurrentView("shop"); }} className="hover:text-white transition-colors text-left">
                  Privacy Policy
                </button>
              </li>
            </ul>
          </div>

          {/* Column 4: Store Location */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-stone-200 mb-5">Store Location</h4>
            <ul className="text-xs text-stone-400 font-light space-y-4">
              <li className="flex items-start gap-2.5">
                <MapPin size={16} className="text-stone-500 mt-0.5 shrink-0" />
                <span className="leading-relaxed">
                  Head Office: House-12, Road-2, Block-C, Banasree, Dhaka-1219, Bangladesh.
                </span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone size={15} className="text-stone-500 shrink-0" />
                <span>+880 1851-186945</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail size={15} className="text-stone-500 shrink-0" />
                <a href="mailto:info@this1990.com" className="hover:text-white transition-colors">
                  info@this1990.com
                </a>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom copyright line */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-white/5 mt-16 pt-8 text-[10px] text-stone-500 font-light uppercase tracking-widest">
          © 2026 This'1990. ALL RIGHTS RESERVED.
        </div>
      </footer>

    </div>
  );
}
