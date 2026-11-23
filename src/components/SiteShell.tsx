import type { ReactNode } from "react";
import Header, { Logo, type NavId } from "./Header";
import { CartProvider } from "./CartContext";
import { AuthProvider } from "./AuthContext";

/** Account + cart providers, the sticky header and the footer — shared by the studio and the Shop. */
export default function SiteShell({ active, children }: { active: NavId; children: ReactNode }) {
  return (
    <AuthProvider>
      <CartProvider>
        <div className="flex min-h-screen flex-col">
          <Header active={active} />
          <main className="flex-1">{children}</main>
          <footer className="border-t border-line py-[26px] text-center text-[13px] text-cocoa-soft">
            <div className="mb-2 flex justify-center opacity-90">
              <Logo size="sm" />
            </div>
            © {new Date().getFullYear()} Oreo Nails · Hand-painted press-on nails
          </footer>
        </div>
      </CartProvider>
    </AuthProvider>
  );
}
