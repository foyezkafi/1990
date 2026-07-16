import { useState } from "react";
import { X, ShoppingBag, Heart, Shield, RefreshCw, Truck } from "lucide-react";
import { Product } from "../types";

interface ProductDetailsProps {
  product: Product | null;
  onClose: () => void;
  onAddToCart: (product: Product, quantity: number, size: string, color: string) => void;
  onToggleWishlist: (product: Product) => void;
  isWishlisted: boolean;
}

export default function ProductDetails({
  product,
  onClose,
  onAddToCart,
  onToggleWishlist,
  isWishlisted,
}: ProductDetailsProps) {
  if (!product) return null;

  const [selectedSize, setSelectedSize] = useState(product.sizes[0] || "M");
  const [selectedColor, setSelectedColor] = useState(product.colors[0]?.name || "");
  const [quantity, setQuantity] = useState(1);
  const [addedMessage, setAddedMessage] = useState(false);

  const activeColorHex = product.colors.find(c => c.name === selectedColor)?.hex || "#000000";

  const handleAddToCart = () => {
    if (product.stock <= 0) return;
    onAddToCart(product, quantity, selectedSize, selectedColor);
    setAddedMessage(true);
    setTimeout(() => setAddedMessage(false), 2000);
  };

  const incrementQty = () => {
    if (quantity < product.stock) {
      setQuantity(prev => prev + 1);
    }
  };

  const decrementQty = () => {
    if (quantity > 1) {
      setQuantity(prev => prev - 1);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative bg-white w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-none shadow-2xl flex flex-col md:flex-row">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-10 p-2 text-stone-400 hover:text-stone-950 bg-white/80 hover:bg-white rounded-full transition-all"
        >
          <X size={20} />
        </button>

        {/* Product Images Stage */}
        <div className="w-full md:w-1/2 bg-stone-50 p-6 flex flex-col justify-center items-center relative border-r border-stone-100">
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-auto max-h-112.5 object-cover object-center shadow-md rounded-none"
            referrerPolicy="no-referrer"
          />
          
          <div className="mt-4 flex gap-2">
            <span className="text-[10px] uppercase font-bold tracking-widest text-stone-400">
              Double Stitching • Premium Finish
            </span>
          </div>
        </div>

        {/* Product Settings Stage */}
        <div className="w-full md:w-1/2 p-6 sm:p-8 flex flex-col justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-stone-400 uppercase tracking-widest font-semibold mb-2">
              <span>{product.category}</span>
              <span>•</span>
              <span className={product.stock > 0 ? "text-emerald-600" : "text-red-500"}>
                {product.stock > 0 ? `In Stock (${product.stock} units)` : "Out of Stock"}
              </span>
              {product.code && (
                <>
                  <span>•</span>
                  <span className="font-mono text-stone-600 bg-stone-100 px-1.5 py-0.5 rounded-none font-bold">
                    Code: {product.code}
                  </span>
                </>
              )}
            </div>

            <h2 className="font-sans text-xl sm:text-2xl font-semibold text-stone-900 mb-3 tracking-tight">
              {product.name}
            </h2>

            {/* Price Tags */}
            <div className="flex items-baseline gap-3 mb-4">
              <span className="font-sans text-2xl font-bold text-stone-900">
                ৳{product.price.toLocaleString()}
              </span>
              {product.originalPrice && (
                <span className="text-sm text-stone-400 line-through">
                  ৳{product.originalPrice.toLocaleString()}
                </span>
              )}
            </div>

            {/* Description */}
            <p className="text-xs sm:text-sm text-stone-600 font-light leading-relaxed mb-6">
              {product.description}
            </p>

            {/* Color Select */}
            {product.colors.length > 0 && (
              <div className="mb-5">
                <span className="block text-xs uppercase tracking-wider text-stone-400 font-semibold mb-2">
                  Color: <span className="text-stone-800">{selectedColor}</span>
                </span>
                <div className="flex gap-2.5">
                  {product.colors.map((color) => (
                    <button
                      key={color.name}
                      onClick={() => setSelectedColor(color.name)}
                      className={`w-7 h-7 rounded-full flex items-center justify-center border transition-all ${
                        selectedColor === color.name
                          ? "ring-2 ring-stone-950 ring-offset-2 border-transparent scale-105"
                          : "border-stone-200 hover:scale-105"
                      }`}
                      style={{ backgroundColor: color.hex }}
                      title={color.name}
                    >
                      {selectedColor === color.name && (
                        <span 
                          className="w-1.5 h-1.5 rounded-full" 
                          style={{ backgroundColor: color.hex === '#fafaf9' ? '#000' : '#fff' }}
                        />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Size Select */}
            {product.sizes.length > 0 && (
              <div className="mb-6">
                <span className="block text-xs uppercase tracking-wider text-stone-400 font-semibold mb-2">
                  Select Size
                </span>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`px-4 py-2 text-xs font-semibold tracking-wider transition-all border rounded-none ${
                        selectedSize === size
                          ? "bg-stone-950 text-white border-stone-950"
                          : "bg-white text-stone-700 border-stone-200 hover:border-stone-950"
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity Selector */}
            {product.stock > 0 && (
              <div className="mb-6">
                <span className="block text-xs uppercase tracking-wider text-stone-400 font-semibold mb-2">
                  Quantity
                </span>
                <div className="flex items-center w-28 border border-stone-200 bg-stone-50">
                  <button
                    onClick={decrementQty}
                    className="w-1/3 py-2 text-stone-500 hover:text-stone-900 font-bold"
                  >
                    -
                  </button>
                  <span className="w-1/3 text-center text-xs font-semibold text-stone-800">
                    {quantity}
                  </span>
                  <button
                    onClick={incrementQty}
                    className="w-1/3 py-2 text-stone-500 hover:text-stone-900 font-bold"
                  >
                    +
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="mt-8 border-t border-stone-100 pt-6">
            <div className="flex gap-4">
              <button
                onClick={handleAddToCart}
                disabled={product.stock <= 0}
                className={`flex-1 flex items-center justify-center gap-3 py-4 text-xs font-semibold uppercase tracking-widest transition-all rounded-none ${
                  product.stock > 0
                    ? "bg-stone-950 text-white hover:bg-stone-900"
                    : "bg-stone-200 text-stone-400 cursor-not-allowed"
                }`}
              >
                <ShoppingBag size={14} />
                <span>{product.stock > 0 ? "Add to Shopping Cart" : "Sold Out"}</span>
              </button>

              <button
                onClick={() => onToggleWishlist(product)}
                className="p-4 border border-stone-200 text-stone-600 hover:text-stone-950 transition-colors"
                title="Save to Wishlist"
              >
                <Heart size={16} className={isWishlisted ? "fill-red-500 text-red-500" : ""} />
              </button>
            </div>

            {addedMessage && (
              <p className="text-center text-xs text-emerald-600 font-semibold mt-3 animate-pulse">
                ✓ Item added to shopping cart!
              </p>
            )}

            {/* Shipping & Support assurances */}
            <div className="grid grid-cols-3 gap-2 mt-6 text-[10px] text-stone-400 font-medium text-center">
              <div className="flex flex-col items-center p-2 border border-stone-50">
                <Truck size={14} className="text-stone-500 mb-1" />
                <span>Express Courier</span>
              </div>
              <div className="flex flex-col items-center p-2 border border-stone-50">
                <RefreshCw size={14} className="text-stone-500 mb-1" />
                <span>7-Day Returns</span>
              </div>
              <div className="flex flex-col items-center p-2 border border-stone-50">
                <Shield size={14} className="text-stone-500 mb-1" />
                <span>Verified Quality</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
