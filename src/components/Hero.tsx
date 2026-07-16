import { ArrowRight } from "lucide-react";

interface HeroProps {
  onShopNow: () => void;
}

export default function Hero({ onShopNow }: HeroProps) {
  return (
    <div className="relative overflow-hidden bg-stone-900 text-white min-h-125 sm:min-h-155 flex items-center">
      {/* Background Image with elegant vignette overlay */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&q=80&w=1600"
          alt="Premium Collection Background"
          className="w-full h-full object-cover object-center opacity-65 scale-105 motion-safe:animate-[pulse_10s_ease-in-out_infinite]"
        />
        <div className="absolute inset-0 bg-linear-to-r from-stone-950/90 via-stone-900/60 to-transparent"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 w-full">
        <div className="max-w-2xl">
          {/* Tagline */}
          <span className="inline-block text-xs uppercase tracking-widest text-stone-300 font-semibold mb-3 border-b-2 border-stone-400 pb-1">
            New Season Arrival • 2026
          </span>

          {/* Heading */}
          <h1 className="font-sans text-4xl sm:text-6xl font-light tracking-tight text-white leading-none mb-6">
            The Art of <br />
            <span className="font-semibold text-stone-100">Minimal Tailoring</span>
          </h1>

          {/* Description */}
          <p className="text-sm sm:text-base text-stone-300 font-light leading-relaxed mb-10 max-w-lg">
            A thoughtful curated collection combining traditional craftsmanship with industrial streetwear lines. Designed for timeless versatility, sustainable weight, and eye-catching structures.
          </p>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={onShopNow}
              className="group flex items-center justify-center gap-3 bg-white text-stone-950 px-8 py-4 text-xs font-semibold uppercase tracking-widest hover:bg-stone-100 transition-all rounded-none shadow-lg hover:shadow-xl hover:-translate-y-0.5"
            >
              <span>Explore Collection</span>
              <ArrowRight size={14} className="group-hover:translate-x-1.5 transition-transform" />
            </button>
            <button
              onClick={onShopNow}
              className="flex items-center justify-center border border-white/40 hover:border-white text-white bg-transparent px-8 py-4 text-xs font-semibold uppercase tracking-widest transition-all hover:bg-white/5"
            >
              View Lookbook
            </button>
          </div>
        </div>
      </div>

      {/* Trust Badges Bar / Ticker */}
      <div className="absolute bottom-0 inset-x-0 z-20 bg-stone-950/80 backdrop-blur-md border-t border-white/5 py-3 hidden sm:block">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between text-stone-400 text-[10px] uppercase tracking-widest font-semibold">
          <div>✓ Free Nationwide Express Courier</div>
          <div className="text-white/20">•</div>
          <div>✓ 100% Cotton & Italian Wool blends</div>
          <div className="text-white/20">•</div>
          <div>✓ Seamless manual Mobile Banking (bKash/Nagad/Rocket)</div>
          <div className="text-white/20">•</div>
          <div>✓ Hassle-Free Exchange Guarantee</div>
        </div>
      </div>
    </div>
  );
}
