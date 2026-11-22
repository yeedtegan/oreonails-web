import Header from "@/components/Header";
import NailStudio from "@/components/NailStudio";
import { CartProvider } from "@/components/CartContext";
import { AuthProvider } from "@/components/AuthContext";

export default function Home() {
  return (
    <AuthProvider>
    <CartProvider>
    <div className="relative flex min-h-screen flex-col">
      {/* decorative blossoms, top-left */}
      <div
        aria-hidden
        className="pointer-events-none absolute top-0 left-0 z-0 hidden select-none text-[64px] leading-none opacity-80 lg:block"
      >
        <span className="absolute -top-3 -left-3">🌸</span>
        <span className="absolute top-10 left-9 text-[44px]">🌸</span>
        <span className="absolute top-1 left-20 text-[34px]">🌸</span>
      </div>
      <Header />
      <main className="flex-1 pt-2">
        <NailStudio />
      </main>
    </div>
    </CartProvider>
    </AuthProvider>
  );
}
