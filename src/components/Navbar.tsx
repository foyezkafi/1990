import { Heart, Search, X } from "lucide-react";
import { Product } from "../types";

interface NavbarProps {
  wishlist: Product[];
  currentView: "shop";
  onNavigate: (view: "shop") => void;
  onSearch: (query: string) => void;
  searchQuery: string;
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
}

export default function Navbar({
  wishlist,
  currentView,
  onNavigate,
  onSearch,
  searchQuery,
  selectedCategory,
  onSelectCategory,
}: NavbarProps) {
  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-stone-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* Logo */}
          <div 
            className="shrink-0 flex items-center cursor-pointer gap-2.5"
            onClick={() => { onSelectCategory("All"); onSearch(""); onNavigate("shop"); }}
          >
            <img 
              src="/src/assets/images/this1990_logo_1784210637465.jpg"
              alt="This'1990 Logo" 
              className="w-8 h-8 object-cover rounded-sm border border-stone-100"
              referrerPolicy="no-referrer" 
            />
            <span className="font-sans font-black text-base sm:text-lg tracking-wider text-stone-900 uppercase">
              This'1990
            </span>
          </div>

          {/* Search Bar - Middle Section */}
          <div className="grow max-w-45 sm:max-w-xs md:max-w-md mx-3 sm:mx-6">
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-stone-400">
                <Search size={15} />
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearch(e.target.value)}
                placeholder="Search premium products..."
                className="w-full bg-stone-50 pl-9 pr-9 py-2 text-xs font-light placeholder:text-stone-400 focus:outline-none focus:ring-1 focus:ring-stone-950 transition-all rounded-none"
              />
              {searchQuery && (
                <button
                  onClick={() => onSearch("")}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-stone-400 hover:text-stone-900 transition-colors cursor-pointer"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Actions - Wishlist Trigger */}
          <div className="flex items-center space-x-6">
            <button
              onClick={() => onNavigate("shop")} 
              className="text-stone-600 hover:text-stone-950 transition-colors relative"
              title="Wishlist"
            >
              <Heart size={20} className={wishlist.length > 0 ? "fill-red-500 text-red-500" : ""} />
              {wishlist.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white font-semibold rounded-full text-[10px] w-4.5 h-4.5 flex items-center justify-center">
                  {wishlist.length}
                </span>
              )}
            </button>
          </div>

        </div>
      </div>
    </header>
  );
}
