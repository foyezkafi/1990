import { useState, type FormEvent } from "react";
import { MapPin, Receipt, Clock, Clipboard, Calendar, ShieldAlert, ArrowRight } from "lucide-react";
import { Order, OrderStatus } from "../types";

interface CustomerHistoryProps {
  orders: Order[];
  onTrackOrder: (orderId: string) => Promise<Order | null>;
}

export default function CustomerHistory({
  orders,
  onTrackOrder,
}: CustomerHistoryProps) {
  const [searchOrderId, setSearchOrderId] = useState("");
  const [searchedOrder, setSearchedOrder] = useState<Order | null>(null);
  const [searchError, setSearchError] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const handleSearchTrack = async (e: FormEvent) => {
    e.preventDefault();
    if (!searchOrderId.trim()) return;

    setIsSearching(true);
    setSearchError("");
    setSearchedOrder(null);

    try {
      const order = await onTrackOrder(searchOrderId.trim().toUpperCase());
      if (order) {
        setSearchedOrder(order);
      } else {
        setSearchError("Order ID not found. Please double-check your ID.");
      }
    } catch (err) {
      setSearchError("Error searching order. Try again.");
    } finally {
      setIsSearching(false);
    }
  };

  const selectOrderToTrack = (order: Order) => {
    setSearchedOrder(order);
    setSearchOrderId(order.id);
  };

  // Status index mapping to render the progress timeline bar
  const statusSteps: { status: OrderStatus; label: string; desc: string }[] = [
    { status: "Pending Payment", label: "Pending Payment", desc: "Awaiting bank statement transfer" },
    { status: "Payment Verified", label: "Payment Verified", desc: "Admin matched Transaction ID" },
    { status: "Processing", label: "Processing", desc: "Warehouse sorting & packaging" },
    { status: "Shipped", label: "Shipped on Transit", desc: "Courier has picked up package" },
    { status: "Delivered", label: "Delivered", desc: "Package successfully received" }
  ];

  // Check where the order sits in the progress steps
  const getCurrentStepIndex = (status: OrderStatus) => {
    if (status === "Rejected" || status === "Cancelled") return -1;
    return statusSteps.findIndex(step => step.status === status);
  };

  const currentStepIdx = searchedOrder ? getCurrentStepIndex(searchedOrder.status) : -1;

  const formatDate = (isoStr: string) => {
    return new Date(isoStr).toLocaleString("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 sm:px-6 lg:px-8 space-y-10">
      
      {/* Title */}
      <div className="border-b border-stone-100 pb-5">
        <h2 className="font-sans text-2xl font-light tracking-tight text-stone-900">
          Track <span className="font-semibold">Your Orders</span>
        </h2>
        <p className="text-stone-500 text-xs mt-1 font-light">
          Verify payment processing status, shipping progress, and historic invoices.
        </p>
      </div>

      {/* Tracker Lookup Form */}
      <form onSubmit={handleSearchTrack} className="bg-stone-50 p-6 border border-stone-200">
        <label className="block text-xs uppercase tracking-wider text-stone-500 font-bold mb-2">
          Enter Order ID
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="e.g. ORDER-20260709-0001"
            value={searchOrderId}
            onChange={(e) => setSearchOrderId(e.target.value)}
            className="grow bg-white text-sm text-stone-950 rounded-none py-3 px-4 border border-stone-200 font-mono focus:outline-none focus:ring-1 focus:ring-stone-500 uppercase"
          />
          <button
            type="submit"
            disabled={isSearching}
            className="bg-stone-950 text-white px-6 sm:px-8 text-xs font-semibold uppercase tracking-widest hover:bg-stone-900 transition-colors rounded-none"
          >
            {isSearching ? "Searching..." : "Track"}
          </button>
        </div>
        {searchError && (
          <p className="text-red-500 text-xs mt-2 font-medium">{searchError}</p>
        )}
      </form>

      {/* Tracked Order Result Area */}
      {searchedOrder ? (
        <div className="bg-white border border-stone-200 p-6 sm:p-8 space-y-8 animate-fade-in">
          {/* Order Meta Header */}
          <div className="flex flex-col sm:flex-row justify-between border-b border-stone-100 pb-5 gap-4">
            <div>
              <span className={`text-[9px] px-2.5 py-1 uppercase tracking-widest font-bold inline-block rounded-xs ${
                searchedOrder.status === 'Pending Payment' ? 'bg-amber-100 text-amber-800' :
                searchedOrder.status === 'Payment Verified' ? 'bg-blue-100 text-blue-800' :
                searchedOrder.status === 'Processing' ? 'bg-indigo-100 text-indigo-800' :
                searchedOrder.status === 'Shipped' ? 'bg-purple-100 text-purple-800' :
                searchedOrder.status === 'Delivered' ? 'bg-emerald-100 text-emerald-800' :
                'bg-red-100 text-red-800'
              }`}>
                {searchedOrder.status}
              </span>
              <h3 className="font-sans font-semibold text-lg text-stone-950 mt-2 flex items-center gap-2">
                <span>ID: {searchedOrder.id}</span>
                <button
                  onClick={() => navigator.clipboard.writeText(searchedOrder.id)}
                  className="text-stone-400 hover:text-stone-800"
                  title="Copy ID"
                >
                  <Clipboard size={14} />
                </button>
              </h3>
              <p className="text-stone-400 text-xs mt-1 font-light flex items-center gap-1.5">
                <Calendar size={12} />
                <span>Placed on {formatDate(searchedOrder.createdAt)}</span>
              </p>
            </div>
            
            <div className="sm:text-right">
              <span className="text-stone-400 text-xs font-semibold uppercase tracking-wider block">Grand Total</span>
              <span className="font-sans font-bold text-xl sm:text-2xl text-stone-950">
                ৳{searchedOrder.totalAmount.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Graphical Progress Steps */}
          {searchedOrder.status !== "Rejected" && searchedOrder.status !== "Cancelled" ? (
            <div className="space-y-6">
              <h4 className="font-sans text-xs uppercase tracking-widest text-stone-400 font-bold">
                Delivery Timeline Progress
              </h4>
              <div className="relative pt-4 pb-8">
                {/* Connector line */}
                <div className="absolute left-4 sm:left-1/2 top-4 bottom-4 w-0.5 bg-stone-100 -translate-x-1/2 z-0"></div>
                <div 
                  className="absolute left-4 sm:left-1/2 top-4 bottom-4 w-0.5 bg-stone-950 -translate-x-1/2 z-0 transition-all duration-1000"
                  style={{
                    height: `${currentStepIdx >= 0 ? (currentStepIdx / (statusSteps.length - 1)) * 100 : 0}%`
                  }}
                ></div>

                {/* Steps markers */}
                <div className="space-y-8 relative z-10">
                  {statusSteps.map((step, idx) => {
                    const isDone = idx <= currentStepIdx;
                    const isActive = idx === currentStepIdx;

                    return (
                      <div key={step.status} className="flex sm:justify-between items-start gap-4 sm:gap-0">
                        {/* Mobile left line offset spacing, desktop centered alignment */}
                        <div className="sm:w-5/12 sm:text-right hidden sm:block pr-8">
                          {isDone ? (
                            <div>
                              <p className="text-xs font-bold text-stone-900">{step.label}</p>
                              <p className="text-[10px] text-stone-500 font-light">{step.desc}</p>
                            </div>
                          ) : (
                            <p className="text-xs text-stone-300 font-medium">{step.label}</p>
                          )}
                        </div>

                        {/* Node circle */}
                        <div className="shrink-0 flex items-center justify-center">
                          <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${
                            isActive ? "border-stone-950 bg-stone-950 text-white scale-110 shadow-lg shadow-stone-950/20" :
                            isDone ? "border-stone-950 bg-white text-stone-950" :
                            "border-stone-200 bg-white text-stone-300"
                          }`}>
                            {isDone ? (
                              <span className="text-[10px] font-bold">✓</span>
                            ) : (
                              <span className="text-[10px] font-semibold">{idx + 1}</span>
                            )}
                          </div>
                        </div>

                        {/* Mobile Right layout text */}
                        <div className="sm:w-5/12 sm:pl-8">
                          <p className={`text-xs font-bold sm:hidden ${isDone ? "text-stone-900" : "text-stone-300"}`}>{step.label}</p>
                          <p className={`text-[10px] sm:hidden ${isDone ? "text-stone-500" : "text-stone-300"} font-light`}>{step.desc}</p>
                          
                          {/* Display the actual timestamp if this is the currently reached status step */}
                          {isDone && searchedOrder.statusTimeline.find(t => t.status === step.status) && (
                            <span className="inline-block text-[9px] bg-stone-100 text-stone-500 px-1.5 py-0.5 mt-1 font-mono rounded-xs">
                              At {formatDate(searchedOrder.statusTimeline.find(t => t.status === step.status)!.timestamp)}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            /* Red Alert Box for Cancelled / Rejected orders */
            <div className="p-5 bg-red-50 border border-red-200 text-red-800 flex gap-3 items-start rounded-sm">
              <ShieldAlert size={20} className="shrink-0 text-red-600 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold uppercase tracking-wider">
                  Order {searchedOrder.status}
                </h4>
                <p className="text-xs font-light mt-1 text-red-700">
                  {searchedOrder.statusTimeline[searchedOrder.statusTimeline.length - 1]?.note || "This order is cancelled and will not be processed further."}
                </p>
                <span className="inline-block text-[9px] text-red-500 font-mono mt-2">
                  Timestamp: {formatDate(searchedOrder.statusTimeline[searchedOrder.statusTimeline.length - 1]?.timestamp)}
                </span>
              </div>
            </div>
          )}

          {/* Full Details Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t border-stone-100">
            {/* Products purchased */}
            <div className="space-y-4">
              <h4 className="font-sans text-xs uppercase tracking-widest text-stone-400 font-bold flex items-center gap-1.5">
                <Receipt size={14} />
                <span>Items Purchased</span>
              </h4>
              <div className="space-y-3">
                {searchedOrder.items.map((item, idx) => (
                  <div key={idx} className="flex gap-3 items-center">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-10 h-14 object-cover object-center bg-stone-50 border border-stone-200 rounded-none shrink-0"
                      referrerPolicy="no-referrer"
                    />
                    <div className="grow min-w-0">
                      <h5 className="text-xs font-medium text-stone-900 truncate">{item.name}</h5>
                      <p className="text-[10px] text-stone-400">
                        ৳{item.price.toLocaleString()} • Qty: {item.quantity} • {item.selectedSize} / {item.selectedColor}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Delivery address & bank verification */}
            <div className="space-y-5">
              {/* Address */}
              <div className="space-y-2">
                <h4 className="font-sans text-xs uppercase tracking-widest text-stone-400 font-bold flex items-center gap-1.5">
                  <MapPin size={14} />
                  <span>Shipping Address</span>
                </h4>
                <p className="text-xs text-stone-700 leading-relaxed font-light">
                  {searchedOrder.shippingAddress}
                </p>
                <p className="text-[11px] text-stone-500">
                  Recipient Name: {searchedOrder.customerName} <br />
                  Phone: {searchedOrder.phone}
                </p>
              </div>

              {/* Bank Transfer info */}
              <div className="space-y-2">
                <h4 className="font-sans text-xs uppercase tracking-widest text-stone-400 font-bold flex items-center gap-1.5">
                  <Clock size={14} />
                  <span>Mobile Banking Transfer Info</span>
                </h4>
                <div className="p-3.5 bg-stone-50 border border-stone-200 rounded-sm font-mono text-[11px] text-stone-700 space-y-1">
                  <div>
                    <span className="text-stone-400">Gateway:</span> {searchedOrder.paymentMethod}
                  </div>
                  <div>
                    <span className="text-stone-400">TrxID:</span> <span className="text-stone-900 font-bold">{searchedOrder.transactionId || "Awaiting Payment Submission"}</span>
                  </div>
                  {searchedOrder.screenshot && (
                    <div className="pt-1.5">
                      <span className="text-stone-400">Screenshot Attached:</span> <span className="text-emerald-700 font-semibold uppercase text-[9px]">Yes</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Full Status Logs (Timeline Logs) */}
          <div className="pt-6 border-t border-stone-100">
            <h4 className="font-sans text-xs uppercase tracking-widest text-stone-400 font-bold mb-4">
              Status Activity Logs
            </h4>
            <div className="space-y-3.5">
              {searchedOrder.statusTimeline.map((t, idx) => (
                <div key={idx} className="flex gap-3 text-xs items-start">
                  <div className="w-1.5 h-1.5 rounded-full bg-stone-900 mt-1.5 shrink-0"></div>
                  <div className="grow">
                    <p className="text-stone-800 font-medium">{t.note}</p>
                    <span className="text-[10px] text-stone-400 font-mono">{formatDate(t.timestamp)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      ) : null}

      {/* customer history quick overview list */}
      {orders.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-sans text-sm font-semibold uppercase tracking-wider text-stone-950">
            Your Purchase History ({orders.length})
          </h3>
          <div className="space-y-3">
            {orders.map((o) => (
              <div
                key={o.id}
                onClick={() => selectOrderToTrack(o)}
                className="flex items-center justify-between p-4 border border-stone-200 bg-white hover:border-stone-950 transition-all cursor-pointer group"
              >
                <div>
                  <h4 className="text-xs font-mono font-bold text-stone-900 group-hover:text-stone-600 transition-colors">
                    {o.id}
                  </h4>
                  <p className="text-[11px] text-stone-400 mt-1">
                    Placed: {new Date(o.createdAt).toLocaleDateString()} • {o.items.length} item{o.items.length > 1 ? "s" : ""}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-xs font-bold text-stone-950">৳{o.totalAmount.toLocaleString()}</p>
                    <span className={`text-[9px] font-bold uppercase ${
                      o.status === 'Pending Payment' ? 'text-amber-700 bg-amber-50' :
                      o.status === 'Payment Verified' ? 'text-blue-700 bg-blue-50' :
                      o.status === 'Processing' ? 'text-indigo-700 bg-indigo-50' :
                      o.status === 'Shipped' ? 'text-purple-700 bg-purple-50' :
                      o.status === 'Delivered' ? 'text-emerald-700 bg-emerald-50' :
                      'text-red-700 bg-red-50'
                    } px-2 py-0.5 rounded-xs`}>
                      {o.status}
                    </span>
                  </div>
                  <ArrowRight size={14} className="text-stone-400 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
