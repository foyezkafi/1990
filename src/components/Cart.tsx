import { Trash2, ShoppingBag, ArrowRight } from "lucide-react";
import { CartItem } from "../types";

interface CartProps {
  cart: CartItem[];
  onUpdateQty: (cartItemId: string, newQty: number) => void;
  onRemoveItem: (cartItemId: string) => void;
  onNavigate: (view: "shop" | "cart" | "checkout" | "history" | "admin") => void;
}

export default function Cart({
  cart,
  onUpdateQty,
  onRemoveItem,
  onNavigate,
}: CartProps) {
  const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const shippingFee = subtotal > 0 ? 100 : 0; // Flat ৳100 Shipping charge
  const grandTotal = subtotal + shippingFee;

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between border-b border-stone-100 pb-5 mb-8">
        <h2 className="font-sans text-2xl font-light tracking-tight text-stone-900">
          Your <span className="font-semibold">Shopping Bag</span>
        </h2>
        <button
          onClick={() => onNavigate("shop")}
          className="text-xs text-stone-500 hover:text-stone-950 font-semibold uppercase tracking-wider underline underline-offset-4"
        >
          Continue Shopping
        </button>
      </div>

      {cart.length === 0 ? (
        <div className="text-center py-20 bg-stone-50 border border-dashed border-stone-200">
          <ShoppingBag size={48} className="mx-auto text-stone-300 mb-4" />
          <p className="text-stone-500 font-light mb-6">Your shopping bag is currently empty.</p>
          <button
            onClick={() => onNavigate("shop")}
            className="inline-block bg-stone-950 text-white px-8 py-3.5 text-xs font-semibold uppercase tracking-widest hover:bg-stone-900 transition-colors"
          >
            Shop the Collection
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          
          {/* Cart Items List */}
          <div className="lg:col-span-2 space-y-6">
            {cart.map((item) => (
              <div
                key={item.id}
                className="flex gap-4 sm:gap-6 py-5 border-b border-stone-100 items-start sm:items-center"
              >
                <img
                  src={item.product.image}
                  alt={item.product.name}
                  className="w-20 sm:w-24 aspect-3/4 object-cover object-center bg-stone-50 border border-stone-100 shrink-0"
                  referrerPolicy="no-referrer"
                />

                <div className="grow">
                  <div className="flex justify-between">
                    <h3 className="font-sans text-sm font-medium text-stone-900 pr-4">
                      {item.product.name}
                    </h3>
                    <button
                      onClick={() => onRemoveItem(item.id)}
                      className="text-stone-400 hover:text-red-600 transition-colors"
                      title="Remove Item"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <p className="text-xs text-stone-400 mt-1 uppercase tracking-wider font-semibold">
                    Size: {item.selectedSize} • Color: {item.selectedColor}
                  </p>

                  <div className="flex justify-between items-center mt-4">
                    {/* Quantity Selector */}
                    <div className="flex items-center border border-stone-200 bg-stone-50 w-24">
                      <button
                        onClick={() => onUpdateQty(item.id, item.quantity - 1)}
                        className="w-1/3 text-center py-1 text-stone-500 hover:text-stone-900 font-semibold"
                      >
                        -
                      </button>
                      <span className="w-1/3 text-center text-xs font-bold text-stone-800">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => onUpdateQty(item.id, item.quantity + 1)}
                        className="w-1/3 text-center py-1 text-stone-500 hover:text-stone-900 font-semibold"
                      >
                        +
                      </button>
                    </div>

                    <div className="text-right">
                      <span className="font-sans text-sm font-bold text-stone-900">
                        ৳{(item.product.price * item.quantity).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Cart Summary */}
          <div className="bg-stone-50 p-6 sm:p-8 border border-stone-100 flex flex-col justify-between">
            <div>
              <h3 className="font-sans text-xs uppercase tracking-widest text-stone-400 font-bold mb-6">
                Order Summary
              </h3>

              <div className="space-y-4 border-b border-stone-200 pb-5 mb-5 text-sm">
                <div className="flex justify-between text-stone-600 font-light">
                  <span>Bag Subtotal</span>
                  <span className="font-semibold text-stone-900">৳{subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-stone-600 font-light">
                  <span>Delivery Charge</span>
                  <span className="font-semibold text-stone-900">৳{shippingFee.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-stone-400 text-xs font-light">
                  <span>Standard Shipping Flat Rate</span>
                </div>
              </div>

              <div className="flex justify-between items-baseline mb-8">
                <span className="font-sans text-base font-semibold text-stone-900">Total BDT</span>
                <span className="font-sans text-xl font-bold text-stone-950">
                  ৳{grandTotal.toLocaleString()}
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => onNavigate("checkout")}
                className="group w-full flex items-center justify-center gap-2 bg-stone-950 text-white py-4 text-xs font-semibold uppercase tracking-widest hover:bg-stone-900 transition-all rounded-none"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </button>
              <p className="text-[10px] text-stone-400 text-center font-light leading-relaxed">
                Manual mobile banking (bKash, Nagad, Rocket) instructions will be provided in the next step.
              </p>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
