import React, { useState, useRef } from "react";
import { ArrowLeft, CheckCircle2, ShieldCheck, CreditCard, UploadCloud, Smartphone, ArrowRight, Clipboard } from "lucide-react";
import { CartItem, Order } from "../types";

interface CheckoutProps {
  cart: CartItem[];
  onPlaceOrder: (checkoutData: {
    customerName: string;
    phone: string;
    email: string;
    shippingAddress: string;
    notes?: string;
  }) => Promise<Order>;
  onSubmitPayment: (orderId: string, paymentData: {
    paymentMethod: 'bKash' | 'Nagad' | 'Rocket';
    transactionId: string;
    screenshot?: string;
  }) => Promise<boolean>;
  onNavigate: (view: "shop" | "cart" | "checkout" | "history" | "admin") => void;
}

export default function Checkout({
  cart,
  onPlaceOrder,
  onSubmitPayment,
  onNavigate,
}: CheckoutProps) {
  // Wizard steps: 'shipping' | 'payment' | 'complete'
  const [step, setStep] = useState<'shipping' | 'payment' | 'complete'>('shipping');

  // Shipping Form State
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [shippingAddress, setShippingAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

  // Payment Form State
  const [paymentMethod, setPaymentMethod] = useState<'bKash' | 'Nagad' | 'Rocket'>('bKash');
  const [transactionId, setTransactionId] = useState("");
  const [screenshotBase64, setScreenshotBase64] = useState<string | undefined>(undefined);
  const [uploadError, setUploadError] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);
  const [copiedText, setCopiedText] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Active Order details once created
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null);
  const [isPlacing, setIsPlacing] = useState(false);
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);

  const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const shippingFee = subtotal > 0 ? 100 : 0;
  const grandTotal = subtotal + shippingFee;

  // Merchant Details
  const merchants = {
    bKash: { number: "01712-345678", type: "Merchant" },
    Nagad: { number: "01987-654321", type: "Merchant" },
    Rocket: { number: "01555-999888", type: "Personal" },
  };

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(type);
    setTimeout(() => setCopiedText(""), 2000);
  };

  const validateShippingForm = () => {
    const errors: { [key: string]: string } = {};
    if (!customerName.trim()) errors.customerName = "Full Name is required.";
    if (!phone.trim()) {
      errors.phone = "Phone Number is required.";
    } else if (!/^(?:\+88|01)?\d{11}$/.test(phone.trim().replace(/[-\s]/g, ""))) {
      errors.phone = "Provide a valid 11-digit Bangladeshi phone number.";
    }
    if (!email.trim()) {
      errors.email = "Email Address is required.";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errors.email = "Provide a valid email address.";
    }
    if (!shippingAddress.trim()) errors.shippingAddress = "Shipping Address is required.";

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleProceedToPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateShippingForm()) return;

    setIsPlacing(true);
    try {
      const order = await onPlaceOrder({
        customerName,
        phone,
        email,
        shippingAddress,
        notes,
      });
      setCreatedOrder(order);
      setStep('payment');
    } catch (err) {
      console.error(err);
    } finally {
      setIsPlacing(false);
    }
  };

  // Convert files to base64
  const processFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setUploadError("Only image files are allowed.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setUploadError("Image size must be smaller than 2MB.");
      return;
    }

    setUploadError("");
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setScreenshotBase64(reader.result);
      }
    };
    reader.onerror = () => {
      setUploadError("Error reading file.");
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createdOrder) return;
    if (!transactionId.trim()) {
      alert("Please provide the Transaction ID.");
      return;
    }

    setIsSubmittingPayment(true);
    try {
      const success = await onSubmitPayment(createdOrder.id, {
        paymentMethod,
        transactionId: transactionId.trim(),
        screenshot: screenshotBase64,
      });
      if (success) {
        setStep('complete');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
      
      {/* Checkout progress headers */}
      <div className="flex justify-between items-center border-b border-stone-100 pb-5 mb-8">
        <button
          onClick={() => step === 'payment' ? setStep('shipping') : onNavigate("cart")}
          className="flex items-center gap-1.5 text-xs text-stone-500 hover:text-stone-950 font-semibold uppercase tracking-wider transition-colors"
        >
          <ArrowLeft size={14} />
          <span>{step === 'payment' ? "Back to Details" : "Back to Bag"}</span>
        </button>

        {/* Dynamic Wizard Steppers */}
        <div className="flex gap-4 sm:gap-6 text-xs font-semibold tracking-wider uppercase text-stone-400">
          <span className={step === 'shipping' ? "text-stone-950" : "text-stone-300"}>1. Shipping</span>
          <span>/</span>
          <span className={step === 'payment' ? "text-stone-950" : "text-stone-300"}>2. Payment</span>
          <span>/</span>
          <span className={step === 'complete' ? "text-stone-950" : "text-stone-300"}>3. Complete</span>
        </div>
      </div>

      {step === 'shipping' && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
          
          {/* Form */}
          <form onSubmit={handleProceedToPayment} className="lg:col-span-3 space-y-6">
            <h3 className="font-sans text-lg font-semibold text-stone-900 mb-2">
              Shipping & Customer Information
            </h3>

            <div className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-xs uppercase tracking-wider text-stone-500 font-semibold mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Shakib Al Hasan"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className={`w-full bg-white text-sm text-stone-900 rounded-none py-3 px-4 border ${
                    formErrors.customerName ? "border-red-500" : "border-stone-200"
                  } focus:outline-none focus:ring-1 focus:ring-stone-500`}
                />
                {formErrors.customerName && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.customerName}</p>
                )}
              </div>

              {/* Grid Contact info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Phone */}
                <div>
                  <label className="block text-xs uppercase tracking-wider text-stone-500 font-semibold mb-1.5">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    placeholder="e.g. 017XXXXXXXX"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className={`w-full bg-white text-sm text-stone-900 rounded-none py-3 px-4 border ${
                      formErrors.phone ? "border-red-500" : "border-stone-200"
                    } focus:outline-none focus:ring-1 focus:ring-stone-500`}
                  />
                  {formErrors.phone && (
                    <p className="text-red-500 text-xs mt-1">{formErrors.phone}</p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className="block text-xs uppercase tracking-wider text-stone-500 font-semibold mb-1.5">
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="e.g. shakib@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`w-full bg-white text-sm text-stone-900 rounded-none py-3 px-4 border ${
                      formErrors.email ? "border-red-500" : "border-stone-200"
                    } focus:outline-none focus:ring-1 focus:ring-stone-500`}
                  />
                  {formErrors.email && (
                    <p className="text-red-500 text-xs mt-1">{formErrors.email}</p>
                  )}
                </div>
              </div>

              {/* Shipping Address */}
              <div>
                <label className="block text-xs uppercase tracking-wider text-stone-500 font-semibold mb-1.5">
                  Shipping Address (Detail Area/House/Road)
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. House 45, Road 12, Sector 3, Uttara, Dhaka"
                  value={shippingAddress}
                  onChange={(e) => setShippingAddress(e.target.value)}
                  className={`w-full bg-white text-sm text-stone-900 rounded-none py-3 px-4 border ${
                    formErrors.shippingAddress ? "border-red-500" : "border-stone-200"
                  } focus:outline-none focus:ring-1 focus:ring-stone-500`}
                />
                {formErrors.shippingAddress && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.shippingAddress}</p>
                )}
              </div>

              {/* Order Notes */}
              <div>
                <label className="block text-xs uppercase tracking-wider text-stone-400 font-semibold mb-1.5">
                  Order Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Please wrap with clean bubble bag or call before delivery"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-white text-sm text-stone-900 rounded-none py-3 px-4 border border-stone-200 focus:outline-none focus:ring-1 focus:ring-stone-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isPlacing || cart.length === 0}
              className="group w-full flex items-center justify-center gap-2 bg-stone-950 text-white py-4 text-xs font-semibold uppercase tracking-widest hover:bg-stone-900 transition-all rounded-none"
            >
              <span>{isPlacing ? "Generating Order..." : "Proceed to Payment"}</span>
              <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </form>

          {/* Cart items list on side */}
          <div className="lg:col-span-2 bg-stone-50 p-6 border border-stone-100">
            <h3 className="font-sans text-xs uppercase tracking-widest text-stone-400 font-bold mb-5">
              Order Items
            </h3>
            <div className="space-y-4 max-h-75 overflow-y-auto pr-2">
              {cart.map((item) => (
                <div key={item.id} className="flex gap-3 items-center">
                  <img
                    src={item.product.image}
                    alt={item.product.name}
                    className="w-12 h-16 object-cover object-center bg-stone-100 border border-stone-200 shrink-0"
                    referrerPolicy="no-referrer"
                  />
                  <div className="grow min-w-0">
                    <h4 className="text-xs font-medium text-stone-900 truncate">
                      {item.product.name}
                    </h4>
                    <p className="text-[10px] text-stone-400">
                      Qty: {item.quantity} • {item.selectedSize} / {item.selectedColor}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xs font-bold text-stone-900">
                      ৳{(item.product.price * item.quantity).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-stone-200 pt-4 mt-6 space-y-3 text-xs">
              <div className="flex justify-between text-stone-600 font-light">
                <span>Subtotal</span>
                <span>৳{subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-stone-600 font-light">
                <span>Delivery Charge</span>
                <span>৳{shippingFee.toLocaleString()}</span>
              </div>
              <div className="border-t border-stone-100 pt-3 flex justify-between font-bold text-sm text-stone-950">
                <span>Total Amount</span>
                <span>৳{grandTotal.toLocaleString()}</span>
              </div>
            </div>
          </div>

        </div>
      )}

      {step === 'payment' && createdOrder && (
        <div className="space-y-8 animate-fade-in">
          
          {/* Order Details Header */}
          <div className="bg-stone-50 p-6 border border-stone-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <span className="text-[10px] bg-amber-100 text-amber-800 px-2.5 py-1 uppercase tracking-widest font-bold">
                Pending Payment
              </span>
              <h3 className="font-sans font-semibold text-lg text-stone-950 mt-2">
                Order ID: <span className="font-mono text-stone-800">{createdOrder.id}</span>
              </h3>
              <p className="text-xs text-stone-500 font-light">
                Customer: {createdOrder.customerName} • {createdOrder.phone}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-stone-400 uppercase tracking-widest font-semibold">Total to Pay</p>
              <h4 className="font-sans font-bold text-xl sm:text-2xl text-stone-950">
                ৳{createdOrder.totalAmount.toLocaleString()}
              </h4>
            </div>
          </div>

          {/* Payment Method Selector Tab bar */}
          <div>
            <span className="block text-xs uppercase tracking-wider text-stone-500 font-semibold mb-3">
              Choose Payment Method
            </span>
            <div className="grid grid-cols-3 gap-3">
              {(['bKash', 'Nagad', 'Rocket'] as const).map((method) => (
                <button
                  key={method}
                  type="button"
                  onClick={() => setPaymentMethod(method)}
                  className={`flex flex-col items-center justify-center p-4 border transition-all ${
                    paymentMethod === method
                      ? "border-stone-950 bg-stone-950/5 ring-1 ring-stone-950"
                      : "border-stone-200 bg-white hover:border-stone-400"
                  }`}
                >
                  <Smartphone size={20} className={paymentMethod === method ? "text-stone-950" : "text-stone-400"} />
                  <span className="text-xs font-semibold mt-1.5">{method}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Instructions Stage */}
          <div className="p-6 sm:p-8 bg-stone-50 border border-stone-200 space-y-6">
            <h4 className="font-sans font-semibold text-sm uppercase tracking-wider text-stone-900 flex items-center gap-2">
              <Smartphone size={16} className="text-stone-800" />
              <span>{paymentMethod} Payment Instructions</span>
            </h4>

            <div className="space-y-4 text-xs sm:text-sm text-stone-700">
              <div className="flex flex-wrap items-center justify-between p-3 bg-white border border-stone-100 rounded-sm">
                <span className="text-stone-500 font-medium">1. Send money of:</span>
                <span className="font-bold text-stone-900">৳{createdOrder.totalAmount.toLocaleString()}</span>
              </div>

              <div className="flex flex-wrap items-center justify-between p-3 bg-white border border-stone-100 rounded-sm gap-2">
                <span className="text-stone-500 font-medium">2. Transfer to {paymentMethod} {merchants[paymentMethod].type}:</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-stone-950 text-base">{merchants[paymentMethod].number}</span>
                  <button
                    onClick={() => handleCopy(merchants[paymentMethod].number, "number")}
                    className="p-1 text-stone-400 hover:text-stone-900 transition-colors"
                    title="Copy Number"
                  >
                    <Clipboard size={14} />
                  </button>
                  {copiedText === "number" && (
                    <span className="text-[10px] text-emerald-600 font-bold uppercase">Copied</span>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between p-3 bg-white border border-stone-100 rounded-sm gap-2">
                <span className="text-stone-500 font-medium">3. Use Reference Code (MANDATORY):</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-amber-700 text-sm bg-amber-50 px-2 py-1">{createdOrder.id}</span>
                  <button
                    onClick={() => handleCopy(createdOrder.id, "ref")}
                    className="p-1 text-stone-400 hover:text-stone-900 transition-colors"
                    title="Copy Reference Code"
                  >
                    <Clipboard size={14} />
                  </button>
                  {copiedText === "ref" && (
                    <span className="text-[10px] text-emerald-600 font-bold uppercase">Copied</span>
                  )}
                </div>
              </div>

              <div className="border-t border-stone-200 pt-4 mt-2">
                <h5 className="font-semibold text-stone-900 mb-1">Easy Steps to Pay:</h5>
                <ol className="list-decimal pl-5 space-y-1 text-stone-600 text-xs font-light">
                  <li>Dial the {paymentMethod} USSD menu or open your {paymentMethod} app.</li>
                  <li>Choose <b>"Send Money"</b> (or Cash Out/Payment as matching our type).</li>
                  <li>Enter the Merchant Number displayed above.</li>
                  <li>Enter exactly <b>৳{createdOrder.totalAmount}</b> as the amount.</li>
                  <li>In the **Reference** input field, paste the Order ID: <b>{createdOrder.id}</b>.</li>
                  <li>Enter your PIN to complete the mobile banking transaction.</li>
                  <li>Copy the resulting <b>Transaction ID (TrxID)</b> and paste it below. Optionally, upload a payment screenshot.</li>
                </ol>
              </div>
            </div>
          </div>

          {/* Submission Form */}
          <form onSubmit={handlePaymentSubmit} className="space-y-6">
            <h4 className="font-sans font-semibold text-sm uppercase tracking-wider text-stone-900">
              Submit Payment Proof
            </h4>

            <div className="space-y-4">
              {/* Transaction ID Input */}
              <div>
                <label className="block text-xs uppercase tracking-wider text-stone-500 font-semibold mb-1.5">
                  Transaction ID (TrxID) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. AX98JKLP23D"
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value.toUpperCase())}
                  required
                  className="w-full bg-white text-sm text-stone-900 font-mono rounded-none py-3 px-4 border border-stone-200 focus:outline-none focus:ring-1 focus:ring-stone-500"
                />
              </div>

              {/* Drag and Drop Screenshot */}
              <div>
                <span className="block text-xs uppercase tracking-wider text-stone-500 font-semibold mb-1.5">
                  Payment Screenshot (Optional, but highly recommended)
                </span>
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={triggerFileSelect}
                  className={`border-2 border-dashed rounded-none p-6 text-center cursor-pointer transition-all ${
                    isDragOver 
                      ? "border-stone-950 bg-stone-50" 
                      : "border-stone-200 bg-white hover:border-stone-400"
                  }`}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    className="hidden"
                  />
                  <UploadCloud size={32} className="mx-auto text-stone-400 mb-2" />
                  
                  {screenshotBase64 ? (
                    <div className="space-y-2">
                      <p className="text-xs text-emerald-600 font-semibold">✓ Image uploaded successfully!</p>
                      <img
                        src={screenshotBase64}
                        alt="Screenshot Preview"
                        className="mx-auto h-24 object-contain border border-stone-200"
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setScreenshotBase64(undefined);
                        }}
                        className="text-[10px] text-red-500 hover:underline font-semibold"
                      >
                        Remove Image
                      </button>
                    </div>
                  ) : (
                    <div>
                      <p className="text-xs text-stone-600 font-medium">
                        Drag & Drop your screenshot here, or <span className="text-stone-950 underline font-semibold">browse files</span>
                      </p>
                      <p className="text-[10px] text-stone-400 mt-1">PNG, JPG or JPEG up to 2MB</p>
                    </div>
                  )}

                  {uploadError && <p className="text-red-500 text-xs mt-2">{uploadError}</p>}
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmittingPayment}
              className="w-full flex items-center justify-center bg-stone-950 text-white py-4 text-xs font-semibold uppercase tracking-widest hover:bg-stone-900 transition-colors rounded-none"
            >
              {isSubmittingPayment ? "Submitting details..." : "Submit Payment for Verification"}
            </button>
          </form>

        </div>
      )}

      {step === 'complete' && createdOrder && (
        <div className="text-center py-16 px-4 animate-scale-up space-y-6 max-w-xl mx-auto">
          <div className="inline-flex items-center justify-center p-4 bg-emerald-50 rounded-full mb-2">
            <CheckCircle2 size={48} className="text-emerald-600" />
          </div>

          <h2 className="font-sans text-2xl font-semibold text-stone-900 tracking-tight">
            Thank you! Your order is placed.
          </h2>

          <p className="text-stone-600 text-sm font-light leading-relaxed">
            Your manual payment transfer has been submitted to the merchant dashboard. Our audit team will verify the Transaction ID against our statements shortly.
          </p>

          <div className="bg-stone-50 border border-stone-200 p-5 font-mono text-left space-y-2.5 rounded-sm text-xs text-stone-700">
            <div>
              <span className="text-stone-400">Order ID:</span> <span className="font-bold text-stone-950">{createdOrder.id}</span>
            </div>
            <div>
              <span className="text-stone-400">Amount Paid:</span> <span className="font-bold text-stone-950">৳{createdOrder.totalAmount.toLocaleString()}</span>
            </div>
            <div>
              <span className="text-stone-400">Paid Via:</span> <span className="font-bold text-stone-950">{paymentMethod}</span>
            </div>
            <div>
              <span className="text-stone-400">Txn ID:</span> <span className="font-bold text-stone-950">{transactionId}</span>
            </div>
            <div>
              <span className="text-stone-400">Order Status:</span> <span className="text-amber-800 font-bold bg-amber-50 px-2 py-0.5 uppercase tracking-widest text-[9px]">Pending Payment</span>
            </div>
          </div>

          <div className="pt-4 flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => onNavigate("history")}
              className="flex-1 bg-stone-950 text-white py-3.5 text-xs font-semibold uppercase tracking-widest hover:bg-stone-900 transition-colors"
            >
              Track Order Status
            </button>
            <button
              onClick={() => onNavigate("shop")}
              className="flex-1 bg-white border border-stone-200 text-stone-800 py-3.5 text-xs font-semibold uppercase tracking-widest hover:border-stone-900 transition-colors"
            >
              Back to Store
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
