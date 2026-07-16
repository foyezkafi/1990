import React, { useState } from "react";
import { X, Smartphone, MapPin, User, ShoppingBag, Send, Clipboard, CheckCircle, ArrowRight, Ruler, Palette, Hash, Tag } from "lucide-react";
import { Product, Order } from "../types";

interface DirectCheckoutModalProps {
  product: Product | null;
  onClose: () => void;
  onPlaceOrder: (orderData: {
    customerName: string;
    phone: string;
    shippingAddress: string;
    selectedSize: string;
    selectedColor: string;
    quantity: number;
    paymentMethod: "bKash" | "Nagad";
    transactionId: string;
  }) => Promise<Order | null>;
}

export default function DirectCheckoutModal({
  product,
  onClose,
  onPlaceOrder,
}: DirectCheckoutModalProps) {
  if (!product) return null;

  // Selected configurations
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [quantity, setQuantity] = useState<number | "">("");

  // Delivery details
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [shippingAddress, setShippingAddress] = useState("");

  // Payment details
  const [paymentMethod, setPaymentMethod] = useState<"bKash" | "Nagad">("bKash");
  const [transactionId, setTransactionId] = useState("");

  // UI States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedNumber, setCopiedNumber] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<Order | null>(null);

  const MERCHANT_NUMBER = "01636334996"; // Change this to your client's actual number
  const WHATSAPP_TARGET = "8801851186945"; // Bangladesh country code prefix + merchant number

  const totalPrice = product.price * (Number(quantity) || 1);

  const handleCopyNumber = () => {
    navigator.clipboard.writeText(MERCHANT_NUMBER);
    setCopiedNumber(true);
    setTimeout(() => setCopiedNumber(false), 2000);
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedSize.trim()) return alert("Please enter the size.");
    if (!selectedColor.trim()) return alert("Please enter the color.");
    const qtyNum = Number(quantity);
    if (!qtyNum || qtyNum < 1) return alert("Please enter a valid quantity.");
    if (!customerName.trim()) return alert("Please enter your name.");
    if (!phone.trim()) return alert("Please enter your mobile number.");
    if (!shippingAddress.trim()) return alert("Please enter your full shipping address.");
    if (!transactionId.trim()) return alert("Please enter your bKash or Nagad transaction ID.");

    setIsSubmitting(true);

    try {
      const order = await onPlaceOrder({
        customerName,
        phone,
        shippingAddress,
        selectedSize,
        selectedColor,
        quantity: qtyNum,
        paymentMethod,
        transactionId: transactionId.trim().toUpperCase(),
      });

      if (order) {
        setOrderSuccess(order);

        // Construct pre-filled elegant WhatsApp message
        const messageText = `*NEW ORDER VERIFICATION (This'1990)* 🛍️\n` +
          `----------------------------------\n` +
          `📦 *Order ID:* ${order.id}\n` +
          `👤 *Customer Name:* ${customerName}\n` +
          `📞 *Mobile Number:* ${phone}\n` +
          `🏠 *Address:* ${shippingAddress}\n\n` +
          `🛒 *Product:* ${product.name}\n` +
          `🏷️ *Product Code:* ${product.code || "N/A"}\n` +
          `📐 *Size:* ${selectedSize}\n` +
          `🎨 *Color:* ${selectedColor}\n` +
          `🔢 *Quantity:* ${quantity}\n` +
          `💰 *Total Price:* ৳${totalPrice.toLocaleString()}\n\n` +
          `💸 *Payment Method:* ${paymentMethod}\n` +
          `🔑 *Transaction ID:* ${transactionId.trim().toUpperCase()}\n` +
          `----------------------------------\n` +
          `_Please verify this payment to confirm my order. Thank you!_`;

        const encodedMessage = encodeURIComponent(messageText);
        const whatsAppUrl = `https://wa.me/${WHATSAPP_TARGET}?text=${encodedMessage}`;

        // Automatically trigger redirect to WhatsApp
        window.open(whatsAppUrl, "_blank");
      } else {
        alert("There was an error creating the order. Please try again.");
      }
    } catch (error) {
      console.error(error);
      alert("Error placing order. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white border border-stone-200 w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-none flex flex-col relative animate-scale-up shadow-2xl">
        
        {/* Header bar */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-stone-100 bg-stone-50 sticky top-0 z-10">
          <span className="text-xs uppercase tracking-widest font-bold text-stone-500 flex items-center gap-2">
            <ShoppingBag size={14} className="text-stone-800" />
            <span>Direct Ordering</span>
          </span>
          <button 
            onClick={onClose}
            className="text-stone-400 hover:text-stone-900 p-1"
            title="Close"
          >
            <X size={18} />
          </button>
        </div>

        {orderSuccess ? (
          /* Order Complete / Success screen with WhatsApp trigger */
          <div className="p-8 sm:p-12 text-center space-y-6 max-w-xl mx-auto flex flex-col items-center justify-center">
            <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mb-2">
              <CheckCircle size={36} />
            </div>
            <h2 className="font-sans text-xl font-bold text-stone-950">
              Order Submitted Successfully!
            </h2>
            <p className="text-xs text-stone-500 leading-relaxed font-light">
              Your Order ID is <strong className="font-mono text-stone-950 text-sm bg-stone-100 px-2 py-0.5">{orderSuccess.id}</strong>. Now click the button below to send your payment and order details directly to our customer care WhatsApp to confirm your order.
            </p>

            <div className="p-4 bg-stone-50 border border-stone-200 text-left text-xs space-y-1.5 font-mono w-full">
              <div className="text-stone-400 border-b border-stone-100 pb-1.5 mb-1.5 uppercase tracking-wider font-bold text-[10px]">Order Summary</div>
              <div><span className="text-stone-400">Name:</span> {customerName}</div>
              <div><span className="text-stone-400">Product:</span> {product.name} ({selectedSize})</div>
              {product.code && <div><span className="text-stone-400">Product Code:</span> {product.code}</div>}
              <div><span className="text-stone-400">Total Price:</span> ৳{totalPrice.toLocaleString()}</div>
              <div><span className="text-stone-400">TxnID:</span> {transactionId}</div>
            </div>

            <button
              onClick={() => {
                const messageText = `*NEW ORDER VERIFICATION (This'1990)* 🛍️\n` +
                  `----------------------------------\n` +
                  `📦 *Order ID:* ${orderSuccess.id}\n` +
                  `👤 *Customer Name:* ${customerName}\n` +
                  `📞 *Mobile Number:* ${phone}\n` +
                  `🏠 *Address:* ${shippingAddress}\n\n` +
                  `🛒 *Product:* ${product.name}\n` +
                  `🏷️ *Product Code:* ${product.code || "N/A"}\n` +
                  `📐 *Size:* ${selectedSize}\n` +
                  `🎨 *Color:* ${selectedColor}\n` +
                  `🔢 *Quantity:* ${quantity}\n` +
                  `💰 *Total Price:* ৳${totalPrice.toLocaleString()}\n\n` +
                  `💸 *Payment Method:* ${paymentMethod}\n` +
                  `🔑 *Transaction ID:* ${transactionId.trim().toUpperCase()}\n` +
                  `----------------------------------\n`;
                window.open(`https://wa.me/${WHATSAPP_TARGET}?text=${encodeURIComponent(messageText)}`, "_blank");
              }}
              className="w-full py-4 bg-emerald-600 text-white font-bold text-xs uppercase tracking-widest hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2"
            >
              <Send size={14} />
              <span>Send Info to WhatsApp</span>
            </button>

            <button
              onClick={() => {
                onClose();
              }}
              className="text-stone-500 hover:text-stone-900 text-xs underline"
            >
              Back to Collection
            </button>
          </div>
        ) : (
          /* Checkout Interactive Form Container */
          <div className="w-full">
            
            {/* Right Column: Order Form & Payment details */}
            <form onSubmit={handleSubmitOrder} className="p-6 space-y-5">
              <h4 className="text-xs uppercase tracking-wider font-bold text-stone-900 border-b border-stone-100 pb-2">
                Delivery & Payment
              </h4>

              {/* Product Code Display (Read-only) */}
              {product.code && (
                <div className="space-y-1.5">
                  <label className="block text-xs text-stone-600 font-medium">
                    Product Code
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      readOnly
                      value={product.code}
                      className="w-full bg-stone-100 text-xs font-mono font-bold text-stone-800 py-2.5 pl-9 pr-3 border border-stone-200 cursor-default"
                    />
                    <Tag size={13} className="absolute left-3 top-3.5 text-stone-400" />
                  </div>
                </div>
              )}

              {/* Size Input */}
              <div className="space-y-1.5">
                <label className="block text-xs text-stone-600 font-medium">
                  Size <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="e.g. M, L, XL"
                    value={selectedSize}
                    onChange={(e) => setSelectedSize(e.target.value)}
                    className="w-full bg-white text-xs text-stone-900 py-2.5 pl-9 pr-3 border border-stone-200 focus:outline-none focus:ring-1 focus:ring-stone-950"
                  />
                  <Ruler size={13} className="absolute left-3 top-3.5 text-stone-400" />
                </div>
              </div>

              {/* Color Input */}
              <div className="space-y-1.5">
                <label className="block text-xs text-stone-600 font-medium">
                  Color <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="e.g. Black, Navy, Red"
                    value={selectedColor}
                    onChange={(e) => setSelectedColor(e.target.value)}
                    className="w-full bg-white text-xs text-stone-900 py-2.5 pl-9 pr-3 border border-stone-200 focus:outline-none focus:ring-1 focus:ring-stone-950"
                  />
                  <Palette size={13} className="absolute left-3 top-3.5 text-stone-400" />
                </div>
              </div>

              {/* Quantity Input */}
              <div className="space-y-1.5">
                <label className="block text-xs text-stone-600 font-medium">
                  Quantity <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="e.g. 1, 2, 3"
                    value={quantity}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === "") {
                        setQuantity("");
                      } else {
                        setQuantity(Math.max(1, parseInt(val) || 1));
                      }
                    }}
                    className="w-full bg-white text-xs text-stone-900 py-2.5 pl-9 pr-3 border border-stone-200 font-mono focus:outline-none focus:ring-1 focus:ring-stone-950"
                  />
                  <Hash size={13} className="absolute left-3 top-3.5 text-stone-400" />
                </div>
              </div>

              {/* Name */}
              <div className="space-y-1.5">
                <label className="block text-xs text-stone-600 font-medium">
                  Your Full Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="e.g. Foyez Ahmed"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full bg-white text-xs text-stone-900 py-2.5 pl-9 pr-3 border border-stone-200 focus:outline-none focus:ring-1 focus:ring-stone-950"
                  />
                  <User size={13} className="absolute left-3 top-3.5 text-stone-400" />
                </div>
              </div>

              {/* Phone */}
              <div className="space-y-1.5">
                <label className="block text-xs text-stone-600 font-medium">
                  Mobile Number <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    required
                    placeholder="e.g. 017XXXXXXXX"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-white text-xs text-stone-900 py-2.5 pl-9 pr-3 border border-stone-200 font-mono focus:outline-none focus:ring-1 focus:ring-stone-950"
                  />
                  <Smartphone size={13} className="absolute left-3 top-3.5 text-stone-400" />
                </div>
              </div>

              {/* Shipping Address */}
              <div className="space-y-1.5">
                <label className="block text-xs text-stone-600 font-medium">
                  Full Shipping Address <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <textarea
                    required
                    rows={2}
                    placeholder="e.g. House 45, Road 12, Dhanmondi, Dhaka"
                    value={shippingAddress}
                    onChange={(e) => setShippingAddress(e.target.value)}
                    className="w-full bg-white text-xs text-stone-900 py-2 px-9 border border-stone-200 focus:outline-none focus:ring-1 focus:ring-stone-950"
                  />
                  <MapPin size={13} className="absolute left-3 top-3.5 text-stone-400" />
                </div>
              </div>

              {/* Prominent Payment Banner with COPY option */}
              <div className="bg-amber-50 border border-amber-200 p-4 space-y-2.5 rounded-none">
                <div className="text-[11px] font-semibold text-amber-950 leading-relaxed">
                  📢 <strong className="font-bold">Payment Instructions:</strong> Please Send Money to the bKash or Nagad Personal number below, then enter the Transaction ID.
                </div>

                <div className="flex items-center justify-between bg-white px-3.5 py-2 border border-amber-100 font-mono text-xs text-stone-900">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] bg-amber-500 text-stone-950 px-1 py-0.5 uppercase tracking-wide font-bold">Personal</span>
                    <strong className="text-stone-950 text-sm">{MERCHANT_NUMBER}</strong>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyNumber}
                    className="text-amber-800 hover:text-amber-950 text-[10px] font-bold flex items-center gap-1 uppercase"
                  >
                    <Clipboard size={12} />
                    <span>{copiedNumber ? "Copied" : "Copy"}</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <label className={`flex items-center justify-center gap-1.5 py-2 border text-xs cursor-pointer transition-all ${
                    paymentMethod === "bKash" 
                      ? "bg-stone-950 text-white border-stone-950 font-bold" 
                      : "bg-white text-stone-700 border-stone-200 hover:border-stone-400"
                  }`}>
                    <input
                      type="radio"
                      name="payment_gateway"
                      value="bKash"
                      checked={paymentMethod === "bKash"}
                      onChange={() => setPaymentMethod("bKash")}
                      className="hidden"
                    />
                    <span>bKash</span>
                  </label>

                  <label className={`flex items-center justify-center gap-1.5 py-2 border text-xs cursor-pointer transition-all ${
                    paymentMethod === "Nagad" 
                      ? "bg-stone-950 text-white border-stone-950 font-bold" 
                      : "bg-white text-stone-700 border-stone-200 hover:border-stone-400"
                  }`}>
                    <input
                      type="radio"
                      name="payment_gateway"
                      value="Nagad"
                      checked={paymentMethod === "Nagad"}
                      onChange={() => setPaymentMethod("Nagad")}
                      className="hidden"
                    />
                    <span>Nagad</span>
                  </label>
                </div>
              </div>

              {/* Transaction ID input */}
              <div className="space-y-1.5">
                <label className="block text-xs text-stone-700 font-bold">
                  Payment Transaction ID <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. TR7185X2"
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  className="w-full bg-white text-xs font-bold text-stone-950 rounded-none py-3 px-4 border border-stone-300 font-mono focus:outline-none focus:border-stone-950 uppercase"
                />
                <p className="text-[10px] text-stone-400 leading-snug">
                  After sending the payment, enter the 8 to 10-character Transaction ID or TrxID received from bKash or Nagad.
                </p>
              </div>

              {/* Dispatch WhatsApp Order Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-stone-950 hover:bg-stone-900 text-white py-4 text-xs font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <span>Creating Order...</span>
                ) : (
                  <>
                    <Send size={13} />
                    <span>Confirm Order & Send WhatsApp</span>
                  </>
                )}
              </button>
            </form>

          </div>
        )}

      </div>
    </div>
  );
}
