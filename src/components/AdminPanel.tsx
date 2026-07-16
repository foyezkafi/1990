import React, { useState, useEffect } from "react";
import { Search, MapPin, Receipt, ShieldCheck, DollarSign, Package, ShoppingBag, Eye, X, Check, Clipboard, AlertCircle } from "lucide-react";
import { Order, OrderStatus, Product } from "../types";

interface AdminPanelProps {
  orders: Order[];
  products: Product[];
  onAddProduct: (productData: Partial<Product>) => Promise<boolean>;
  onUpdateOrderStatus: (orderId: string, status: OrderStatus, note?: string) => Promise<boolean>;
  onRefreshData: () => void;
}

export interface StatsSummary {
  totalRevenue: number;
  totalOrders: number;
  pendingCount: number;
  processingCount: number;
  deliveredCount: number;
}

export default function AdminPanel({
  orders,
  products,
  onAddProduct,
  onUpdateOrderStatus,
  onRefreshData,
}: AdminPanelProps) {
  // Tabs: 'orders' | 'catalog'
  const [activeTab, setActiveTab] = useState<'orders' | 'catalog'>('orders');

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");

  // Selected order details for sliding drawer/modal
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [statusNote, setStatusNote] = useState("");
  const [actionSuccessMessage, setActionSuccessMessage] = useState("");

  // Inspect screenshot popup
  const [inspectedScreenshot, setInspectedScreenshot] = useState<string | null>(null);

  // New product form
  const [prodName, setProdName] = useState("");
  const [prodDesc, setProdDesc] = useState("");
  const [prodPrice, setProdPrice] = useState("");
  const [prodOrigPrice, setProdOrigPrice] = useState("");
  const [prodCategory, setProdCategory] = useState("Streetwear");
  const [prodStock, setProdStock] = useState("15");
  const [prodImage, setProdImage] = useState("");
  const [catalogMessage, setCatalogMessage] = useState("");

  // Calculate statistics
  const verifiedOrders = orders.filter((o) =>
    ["Payment Verified", "Processing", "Shipped", "Delivered"].includes(o.status)
  );
  const totalRevenue = verifiedOrders.reduce((sum, o) => sum + o.totalAmount, 0);
  const pendingCount = orders.filter((o) => o.status === "Pending Payment").length;
  const processingCount = orders.filter((o) => o.status === "Processing").length;
  const deliveredCount = orders.filter((o) => o.status === "Delivered").length;

  const filteredOrders = orders.filter((o) => {
    const matchesSearch =
      o.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.phone.includes(searchQuery) ||
      o.transactionId.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === "All" || o.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleUpdateStatus = async (status: OrderStatus) => {
    if (!selectedOrder) return;
    const note = statusNote.trim() || undefined;

    const success = await onUpdateOrderStatus(selectedOrder.id, status, note);
    if (success) {
      setActionSuccessMessage(`Order ${selectedOrder.id} status updated to: ${status}`);
      setStatusNote("");
      // Refresh local selected order instance
      const updated = orders.find(o => o.id === selectedOrder.id);
      if (updated) {
        setSelectedOrder({ ...updated, status, statusTimeline: [...updated.statusTimeline, { status, timestamp: new Date().toISOString(), note: note || `Updated status to ${status}` }] });
      }
      setTimeout(() => setActionSuccessMessage(""), 4000);
      onRefreshData();
    }
  };

  const handleAddProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodName || !prodPrice || !prodStock) {
      alert("Please fill all mandatory fields.");
      return;
    }

    const success = await onAddProduct({
      name: prodName,
      description: prodDesc,
      price: Number(prodPrice),
      originalPrice: prodOrigPrice ? Number(prodOrigPrice) : undefined,
      category: prodCategory,
      stock: Number(prodStock),
      image: prodImage || "https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&q=80&w=600"
    });

    if (success) {
      setCatalogMessage("✓ Product successfully added to the catalog!");
      setProdName("");
      setProdDesc("");
      setProdPrice("");
      setProdOrigPrice("");
      setProdStock("15");
      setProdImage("");
      setTimeout(() => setCatalogMessage(""), 4000);
      onRefreshData();
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8 space-y-8">
      
      {/* Admin dashboard header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-stone-100 pb-6 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse"></span>
            <span className="text-[10px] uppercase font-bold tracking-widest text-red-600">Merchant Workspace</span>
          </div>
          <h2 className="font-sans text-2xl font-semibold tracking-tight text-stone-900 mt-1">
            Store Management Dashboard
          </h2>
        </div>

        {/* Tab switchers */}
        <div className="flex bg-stone-100 p-1.5 rounded-none border border-stone-200">
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-5 py-2.5 text-xs font-semibold uppercase tracking-wider transition-all ${
              activeTab === 'orders'
                ? "bg-stone-950 text-white shadow-sm"
                : "text-stone-500 hover:text-stone-900"
            }`}
          >
            Orders Portal ({orders.length})
          </button>
          <button
            onClick={() => setActiveTab('catalog')}
            className={`px-5 py-2.5 text-xs font-semibold uppercase tracking-wider transition-all ${
              activeTab === 'catalog'
                ? "bg-stone-950 text-white shadow-sm"
                : "text-stone-500 hover:text-stone-900"
            }`}
          >
            Catalog Registry
          </button>
        </div>
      </div>

      {/* Stats row widgets */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Stat 1 */}
        <div className="bg-white border border-stone-200 p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold tracking-wider text-stone-400">Total Sales</span>
            <DollarSign size={16} className="text-stone-400" />
          </div>
          <div className="mt-4">
            <h3 className="font-sans font-bold text-xl sm:text-2xl text-stone-950">৳{totalRevenue.toLocaleString()}</h3>
            <span className="text-[9px] text-emerald-600 font-bold block mt-1">Verified Revenue</span>
          </div>
        </div>

        {/* Stat 2 */}
        <div className="bg-white border border-stone-200 p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold tracking-wider text-stone-400">Total Orders</span>
            <ShoppingBag size={16} className="text-stone-400" />
          </div>
          <div className="mt-4">
            <h3 className="font-sans font-bold text-xl sm:text-2xl text-stone-950">{orders.length}</h3>
            <span className="text-[9px] text-stone-400 font-bold block mt-1">Transactions Placed</span>
          </div>
        </div>

        {/* Stat 3 */}
        <div className="bg-white border border-stone-200 p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold tracking-wider text-amber-600">Pending Verify</span>
            <AlertCircle size={16} className="text-amber-500" />
          </div>
          <div className="mt-4">
            <h3 className="font-sans font-bold text-xl sm:text-2xl text-amber-700">{pendingCount}</h3>
            <span className="text-[9px] text-amber-600 font-bold block mt-1">Awaiting statement match</span>
          </div>
        </div>

        {/* Stat 4 */}
        <div className="bg-white border border-stone-200 p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-600">Processing</span>
            <Package size={16} className="text-indigo-500" />
          </div>
          <div className="mt-4">
            <h3 className="font-sans font-bold text-xl sm:text-2xl text-indigo-700">{processingCount}</h3>
            <span className="text-[9px] text-stone-400 font-bold block mt-1">In warehouse packaging</span>
          </div>
        </div>

        {/* Stat 5 */}
        <div className="bg-white border border-stone-200 p-5 flex flex-col justify-between col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-600">Delivered</span>
            <Check size={16} className="text-emerald-500" />
          </div>
          <div className="mt-4">
            <h3 className="font-sans font-bold text-xl sm:text-2xl text-emerald-700">{deliveredCount}</h3>
            <span className="text-[9px] text-emerald-600 font-bold block mt-1">Courier completed</span>
          </div>
        </div>
      </div>

      {activeTab === 'orders' ? (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          
          {/* Orders table list */}
          <div className="xl:col-span-2 space-y-4">
            
            {/* Search and Filter strip */}
            <div className="flex flex-col sm:flex-row gap-3 bg-stone-50 p-4 border border-stone-200">
              <div className="relative grow">
                <input
                  type="text"
                  placeholder="Search by ID, client name, phone or TxnID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white text-xs text-stone-900 rounded-none py-2.5 pl-3 pr-10 border border-stone-200 focus:outline-none"
                />
                <Search size={14} className="absolute right-3 top-3 text-stone-400" />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-white text-xs text-stone-700 py-2.5 px-4 border border-stone-200 rounded-none focus:outline-none"
              >
                <option value="All">All Statuses</option>
                <option value="Pending Payment">Pending Payment</option>
                <option value="Payment Verified">Payment Verified</option>
                <option value="Processing">Processing</option>
                <option value="Shipped">Shipped</option>
                <option value="Delivered">Delivered</option>
                <option value="Rejected">Rejected</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>

            {/* Orders list table/cards */}
            <div className="border border-stone-200 bg-white overflow-hidden">
              {filteredOrders.length === 0 ? (
                <div className="text-center py-20">
                  <span className="text-stone-300 font-semibold block mb-2 font-mono">NO_ORDERS_FOUND</span>
                  <p className="text-stone-500 text-xs font-light">No transaction invoices match this selection.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-stone-100 text-xs text-left">
                    <thead className="bg-stone-50 text-stone-400 font-semibold uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="px-5 py-4">Order ID</th>
                        <th className="px-5 py-4">Customer Details</th>
                        <th className="px-5 py-4">Payment TrxID</th>
                        <th className="px-5 py-4">Amount</th>
                        <th className="px-5 py-4 text-center">Status</th>
                        <th className="px-5 py-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {filteredOrders.map((o) => (
                        <tr
                          key={o.id}
                          className={`hover:bg-stone-50 transition-colors cursor-pointer ${
                            selectedOrder?.id === o.id ? "bg-stone-50/50 font-medium" : ""
                          }`}
                          onClick={() => { setSelectedOrder(o); setStatusNote(""); }}
                        >
                          {/* Order ID */}
                          <td className="px-5 py-4.5 font-mono font-bold text-stone-900">
                            {o.id}
                          </td>
                          {/* Customer */}
                          <td className="px-5 py-4.5">
                            <span className="font-semibold block text-stone-900">{o.customerName}</span>
                            <span className="text-stone-400 text-[10px] block">{o.phone}</span>
                          </td>
                          {/* Payment */}
                          <td className="px-5 py-4.5 font-mono">
                            <span className="font-semibold text-stone-800">{o.paymentMethod}</span>
                            <span className="text-[10px] text-stone-500 block truncate max-w-30">
                              {o.transactionId || "NO_TRX_ID"}
                            </span>
                          </td>
                          {/* Amount */}
                          <td className="px-5 py-4.5 font-semibold text-stone-900">
                            ৳{o.totalAmount.toLocaleString()}
                          </td>
                          {/* Status */}
                          <td className="px-5 py-4.5 text-center">
                            <span className={`text-[8.5px] font-bold uppercase px-2 py-0.5 rounded-xs inline-block ${
                              o.status === 'Pending Payment' ? 'text-amber-800 bg-amber-50 border border-amber-200' :
                              o.status === 'Payment Verified' ? 'text-blue-800 bg-blue-50 border border-blue-200' :
                              o.status === 'Processing' ? 'text-indigo-800 bg-indigo-50 border border-indigo-200' :
                              o.status === 'Shipped' ? 'text-purple-800 bg-purple-50 border border-purple-200' :
                              o.status === 'Delivered' ? 'text-emerald-800 bg-emerald-50 border border-emerald-200' :
                              'text-red-800 bg-red-50 border border-red-200'
                            }`}>
                              {o.status}
                            </span>
                          </td>
                          {/* Action */}
                          <td className="px-5 py-4.5 text-right">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedOrder(o);
                                setStatusNote("");
                              }}
                              className="text-stone-500 hover:text-stone-950 flex items-center gap-1 ml-auto underline"
                            >
                              <Eye size={13} />
                              <span>View</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Selected Order Detailed Sidebar Drawer */}
          <div className="xl:col-span-1 bg-white border border-stone-200 p-6 flex flex-col justify-between min-h-112.5">
            {selectedOrder ? (
              <div className="space-y-6">
                
                {/* Meta details Header */}
                <div className="flex items-center justify-between border-b border-stone-100 pb-4">
                  <div>
                    <h3 className="font-mono font-bold text-sm text-stone-950">
                      {selectedOrder.id}
                    </h3>
                    <span className="text-[10px] text-stone-400">
                      Placed: {new Date(selectedOrder.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <button
                    onClick={() => setSelectedOrder(null)}
                    className="text-stone-400 hover:text-stone-950"
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* Customer Details info block */}
                <div className="space-y-2 text-xs">
                  <h4 className="text-[10px] uppercase font-bold tracking-widest text-stone-400">
                    Client Details
                  </h4>
                  <p className="text-stone-800 font-medium">{selectedOrder.customerName}</p>
                  <p className="text-stone-500 font-light">Email: {selectedOrder.email}</p>
                  <p className="text-stone-500 font-light">Phone: {selectedOrder.phone}</p>
                  <p className="text-stone-500 font-light flex gap-1"><MapPin size={12} className="mt-0.5" /> <span>{selectedOrder.shippingAddress}</span></p>
                  {selectedOrder.notes && (
                    <p className="text-amber-800 bg-amber-50/50 p-2 border border-amber-100 italic text-[11px]">
                      "Notes: {selectedOrder.notes}"
                    </p>
                  )}
                </div>

                {/* Ordered Products */}
                <div className="space-y-3">
                  <h4 className="text-[10px] uppercase font-bold tracking-widest text-stone-400">
                    Cart Items ({selectedOrder.items.length})
                  </h4>
                  <div className="space-y-2 max-h-35 overflow-y-auto pr-1">
                    {selectedOrder.items.map((item, idx) => (
                      <div key={idx} className="flex gap-2 items-center text-xs">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-8 h-10 object-cover object-center bg-stone-50 border shrink-0"
                          referrerPolicy="no-referrer"
                        />
                        <div className="grow min-w-0">
                          <p className="font-medium text-stone-900 truncate">{item.name}</p>
                          <p className="text-[10px] text-stone-400 font-light">
                            Size: {item.selectedSize} / Color: {item.selectedColor} • Qty: {item.quantity}
                          </p>
                        </div>
                        <div className="text-right font-semibold text-stone-950 shrink-0">
                          ৳{(item.price * item.quantity).toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between border-t border-stone-100 pt-2 text-xs font-bold text-stone-950">
                    <span>Total Bill</span>
                    <span>৳{selectedOrder.totalAmount.toLocaleString()}</span>
                  </div>
                </div>

                {/* Submited Payment and Screenshot Trigger */}
                <div className="space-y-3 bg-stone-50 p-4 border border-stone-200 rounded-sm">
                  <h4 className="text-[10px] uppercase font-bold tracking-widest text-stone-400">
                    Payment Evidence
                  </h4>
                  <div className="text-xs space-y-1 font-mono text-stone-700">
                    <div><span className="text-stone-400">Gateway:</span> {selectedOrder.paymentMethod}</div>
                    <div><span className="text-stone-400">TrxID:</span> <span className="font-bold text-stone-950 bg-white px-1.5 border">{selectedOrder.transactionId || "NONE"}</span></div>
                  </div>

                  {selectedOrder.screenshot ? (
                    <button
                      onClick={() => setInspectedScreenshot(selectedOrder.screenshot!)}
                      className="w-full flex items-center justify-center gap-1.5 bg-white border border-stone-200 text-stone-800 py-1.5 text-[11px] font-semibold hover:border-stone-950 transition-colors"
                    >
                      <Eye size={12} />
                      <span>Inspect Attached Screenshot</span>
                    </button>
                  ) : (
                    <p className="text-[10px] text-stone-400 italic font-light text-center">
                      No Screenshot proof uploaded by customer.
                    </p>
                  )}
                </div>

                {/* Action Notes Field */}
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-stone-400 font-bold mb-1.5">
                    Custom Timeline Note (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Received. Package sent for courier packing."
                    value={statusNote}
                    onChange={(e) => setStatusNote(e.target.value)}
                    className="w-full bg-white text-xs text-stone-900 rounded-none py-2 px-3 border border-stone-200 focus:outline-none"
                  />
                </div>

                {/* Status Transitions buttons matrix */}
                <div className="space-y-2">
                  <h4 className="text-[10px] uppercase font-bold tracking-widest text-stone-400">
                    Actions / Modify Order Status
                  </h4>

                  {actionSuccessMessage && (
                    <p className="text-xs text-emerald-600 font-semibold text-center mb-2 animate-pulse">
                      {actionSuccessMessage}
                    </p>
                  )}

                  {selectedOrder.status === "Pending Payment" && (
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => handleUpdateStatus("Payment Verified")}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white py-2 text-xs font-semibold uppercase tracking-wider"
                      >
                        ✓ Approve Payment
                      </button>
                      <button
                        onClick={() => handleUpdateStatus("Rejected")}
                        className="bg-red-600 hover:bg-red-700 text-white py-2 text-xs font-semibold uppercase tracking-wider"
                      >
                        ✗ Reject Payment
                      </button>
                    </div>
                  )}

                  {selectedOrder.status === "Payment Verified" && (
                    <button
                      onClick={() => handleUpdateStatus("Processing")}
                      className="w-full bg-stone-950 hover:bg-stone-900 text-white py-2 text-xs font-semibold uppercase tracking-wider"
                    >
                      Mark as Processing
                    </button>
                  )}

                  {selectedOrder.status === "Processing" && (
                    <button
                      onClick={() => handleUpdateStatus("Shipped")}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 text-xs font-semibold uppercase tracking-wider"
                    >
                      Mark as Shipped
                    </button>
                  )}

                  {selectedOrder.status === "Shipped" && (
                    <button
                      onClick={() => handleUpdateStatus("Delivered")}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2 text-xs font-semibold uppercase tracking-wider"
                    >
                      Mark as Delivered
                    </button>
                  )}

                  {/* General Cancel button for non-terminal statuses */}
                  {!["Delivered", "Rejected", "Cancelled"].includes(selectedOrder.status) && (
                    <button
                      onClick={() => handleUpdateStatus("Cancelled")}
                      className="w-full border border-stone-200 text-stone-400 hover:text-red-500 hover:border-red-500 py-1.5 text-xs uppercase tracking-wider mt-2 bg-transparent"
                    >
                      Cancel Order
                    </button>
                  )}
                </div>

              </div>
            ) : (
              <div className="text-center py-24 text-stone-400 text-xs font-light">
                Click any order from the table to manage customer details, inspect transfers, and trigger order timeline step updates.
              </div>
            )}
          </div>

        </div>
      ) : (
        /* Catalog Creation Tab */
        <div className="bg-white border border-stone-200 p-6 sm:p-8">
          <h3 className="font-sans text-lg font-semibold text-stone-900 mb-6">
            Register New Clothing Article
          </h3>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
            {/* Form */}
            <form onSubmit={handleAddProductSubmit} className="lg:col-span-3 space-y-4">
              {catalogMessage && (
                <div className="p-3.5 bg-emerald-50 text-emerald-800 text-xs font-semibold border border-emerald-200">
                  {catalogMessage}
                </div>
              )}

              {/* Product Title */}
              <div>
                <label className="block text-xs uppercase tracking-wider text-stone-500 font-bold mb-1.5">
                  Garment Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Luxury Handloom Silk Kurta"
                  value={prodName}
                  onChange={(e) => setProdName(e.target.value)}
                  required
                  className="w-full bg-white text-xs text-stone-900 rounded-none py-2.5 px-3 border border-stone-200 focus:outline-none focus:ring-1 focus:ring-stone-500"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs uppercase tracking-wider text-stone-500 font-bold mb-1.5">
                  Description
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Crafted with pure silk warp. Features hand-knotted buttons, structured slim collars..."
                  value={prodDesc}
                  onChange={(e) => setProdDesc(e.target.value)}
                  className="w-full bg-white text-xs text-stone-900 rounded-none py-2.5 px-3 border border-stone-200 focus:outline-none focus:ring-1 focus:ring-stone-500"
                />
              </div>

              {/* Price rows */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase tracking-wider text-stone-500 font-bold mb-1.5">
                    Selling Price (৳) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 1950"
                    value={prodPrice}
                    onChange={(e) => setProdPrice(e.target.value)}
                    required
                    className="w-full bg-white text-xs text-stone-900 rounded-none py-2.5 px-3 border border-stone-200 focus:outline-none focus:ring-1 focus:ring-stone-500"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wider text-stone-400 font-bold mb-1.5">
                    Original Price (৳ - Optional for Sale Tag)
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 2500"
                    value={prodOrigPrice}
                    onChange={(e) => setProdOrigPrice(e.target.value)}
                    className="w-full bg-white text-xs text-stone-900 rounded-none py-2.5 px-3 border border-stone-200 focus:outline-none focus:ring-1 focus:ring-stone-500"
                  />
                </div>
              </div>

              {/* Category, stock */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase tracking-wider text-stone-500 font-bold mb-1.5">
                    Category
                  </label>
                  <select
                    value={prodCategory}
                    onChange={(e) => setProdCategory(e.target.value)}
                    className="w-full bg-white text-xs text-stone-900 rounded-none py-2.5 px-3 border border-stone-200 focus:outline-none"
                  >
                    <option value="Menswear">Menswear</option>
                    <option value="Womenswear">Womenswear</option>
                    <option value="Streetwear">Streetwear</option>
                    <option value="Accessories">Accessories</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wider text-stone-500 font-bold mb-1.5">
                    Stock Quantity <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 25"
                    value={prodStock}
                    onChange={(e) => setProdStock(e.target.value)}
                    required
                    className="w-full bg-white text-xs text-stone-900 rounded-none py-2.5 px-3 border border-stone-200 focus:outline-none"
                  />
                </div>
              </div>

              {/* Unsplash Image Link */}
              <div>
                <label className="block text-xs uppercase tracking-wider text-stone-500 font-bold mb-1.5">
                  Product Image Link (URL)
                </label>
                <input
                  type="url"
                  placeholder="e.g. https://images.unsplash.com/photo-..."
                  value={prodImage}
                  onChange={(e) => setProdImage(e.target.value)}
                  className="w-full bg-white text-xs text-stone-900 rounded-none py-2.5 px-3 border border-stone-200 focus:outline-none"
                />
                <p className="text-[10px] text-stone-400 mt-1">
                  Leave blank to apply an aesthetic default mockup image.
                </p>
              </div>

              <button
                type="submit"
                className="w-full bg-stone-950 text-white py-3.5 text-xs font-semibold uppercase tracking-widest hover:bg-stone-900 transition-colors rounded-none"
              >
                Register Garment Article
              </button>
            </form>

            {/* Catalog Grid View */}
            <div className="lg:col-span-2 space-y-4">
              <h4 className="text-xs uppercase tracking-widest text-stone-400 font-bold">
                Registered Collection ({products.length})
              </h4>
              <div className="space-y-2 max-h-100 overflow-y-auto pr-1">
                {products.map((p) => (
                  <div key={p.id} className="flex gap-3 items-center border p-2.5 border-stone-100 bg-stone-50">
                    <img
                      src={p.image}
                      alt={p.name}
                      className="w-10 h-14 object-cover object-center bg-stone-100 border shrink-0"
                      referrerPolicy="no-referrer"
                    />
                    <div className="grow min-w-0">
                      <h5 className="text-xs font-medium text-stone-900 truncate">{p.name}</h5>
                      <span className="text-[10px] uppercase font-bold text-stone-400 tracking-wider">
                        {p.category} • Stock: {p.stock}
                      </span>
                    </div>
                    <div className="text-right font-bold text-xs text-stone-950">
                      ৳{p.price.toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Screenshot Fullscreen lightbox inspect tool */}
      {inspectedScreenshot && (
        <div className="fixed inset-0 z-50 overflow-auto bg-stone-950/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative max-w-4xl max-h-[85vh] overflow-hidden">
            <button
              onClick={() => setInspectedScreenshot(null)}
              className="absolute right-4 top-4 bg-stone-900 text-white hover:bg-stone-800 p-2 rounded-full transition-all"
            >
              <X size={20} />
            </button>
            <img
              src={inspectedScreenshot}
              alt="Inspected Bank Statement screenshot"
              className="max-w-full max-h-[80vh] object-contain shadow-2xl"
            />
          </div>
        </div>
      )}

    </div>
  );
}
