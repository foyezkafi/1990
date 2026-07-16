import { Heart, ShoppingBag } from "lucide-react";
import { Product } from "../types";

interface ProductCardProps {
  key?: string;
  product: Product;
  onOrderNow: (product: Product) => void;
  onToggleWishlist: (product: Product) => void;
  isWishlisted: boolean;
}

export default function ProductCard({
  product,
  onOrderNow,
  onToggleWishlist,
  isWishlisted,
}: ProductCardProps) {
  const discountPercent = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  return (
    <div className="group relative flex flex-col bg-white border border-stone-200 rounded-none overflow-hidden transition-all duration-300 hover:shadow-xl">
      {/* Product Image Stage */}
      <div 
        className="relative aspect-3/4 bg-stone-50 overflow-hidden cursor-pointer" 
        onClick={() => onOrderNow(product)}
      >
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
          referrerPolicy="no-referrer"
        />

        {/* Floating Badges */}
        {discountPercent > 0 && (
          <div className="absolute top-3 left-3 bg-red-600 text-white text-[10px] font-bold uppercase tracking-widest px-2.5 py-1">
            -{discountPercent}% OFF
          </div>
        )}

        {product.stock <= 0 ? (
          <div className="absolute inset-0 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center">
            <span className="text-white text-xs font-semibold tracking-wider uppercase px-4 py-2 border border-white">
              Sold Out
            </span>
          </div>
        ) : product.stock <= 5 ? (
          <div className="absolute top-3 right-3 bg-amber-500 text-stone-950 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-sm">
            Only {product.stock} left
          </div>
        ) : null}

        {/* Wishlist toggle overlay button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleWishlist(product);
          }}
          className="absolute top-3 right-3 p-2 bg-white/95 text-stone-950 rounded-full hover:bg-stone-950 hover:text-white transition-all shadow-md z-10"
          title="Add to Wishlist"
        >
          <Heart size={14} className={isWishlisted ? "fill-red-500 text-red-500" : ""} />
        </button>
      </div>

      {/* Info Details Section */}
      <div className="p-4 sm:p-5 flex flex-col grow bg-white">
        <div className="flex justify-between items-center text-[11px] text-stone-400 uppercase tracking-widest font-semibold mb-1">
          <span>{product.category}</span>
          {product.code && (
            <span className="font-mono text-[10px] font-bold text-stone-600 bg-stone-100 px-1.5 py-0.5 rounded-none">
              Code: {product.code}
            </span>
          )}
        </div>

        <h3 
          className="font-sans text-sm font-medium text-stone-900 line-clamp-1 hover:text-stone-600 cursor-pointer mb-2"
          onClick={() => onOrderNow(product)}
        >
          {product.name}
        </h3>

        {/* Pricing tag */}
        <div className="mt-auto flex items-baseline justify-between pt-2 border-t border-stone-100">
          <div className="flex items-baseline gap-2">
            <span className="font-sans font-semibold text-base text-stone-950">
              ৳{product.price.toLocaleString()}
            </span>
            {product.originalPrice && (
              <span className="text-xs text-stone-400 line-through">
                ৳{product.originalPrice.toLocaleString()}
              </span>
            )}
          </div>
        </div>

        {/* Prominent Direct Buy/Order Button */}
        <button
          onClick={() => onOrderNow(product)}
          className="w-full mt-3 bg-stone-950 text-white text-xs font-bold py-2.5 uppercase tracking-widest hover:bg-stone-800 transition-colors flex items-center justify-center gap-1.5"
        >
          <ShoppingBag size={13} />
          <span>Order Now</span>
        </button>
      </div>
    </div>
  );
}
