import { Link } from "react-router-dom";

const Footer = () => (
  <footer className="border-t border-border bg-card">
    <div className="container py-12">
      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="mb-4 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <span className="font-heading text-sm font-bold text-primary-foreground">L</span>
            </div>
            <span className="font-heading text-lg font-bold">LENDLY</span>
          </div>
          <p className="text-sm text-muted-foreground">
            The trusted peer-to-peer rental marketplace. Borrow anything, from anyone, anytime.
          </p>
        </div>
        <div>
          <h4 className="mb-3 font-heading text-sm font-semibold">Marketplace</h4>
          <div className="flex flex-col gap-2">
            <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">Browse Items</Link>
            <Link to="/list" className="text-sm text-muted-foreground hover:text-foreground">List an Item</Link>
            <Link to="/how-it-works" className="text-sm text-muted-foreground hover:text-foreground">How It Works</Link>
          </div>
        </div>
        <div>
          <h4 className="mb-3 font-heading text-sm font-semibold">Trust & Safety</h4>
          <div className="flex flex-col gap-2">
            <span className="text-sm text-muted-foreground">Verified Users</span>
            <span className="text-sm text-muted-foreground">Escrow Payments</span>
            <span className="text-sm text-muted-foreground">Damage Protection</span>
          </div>
        </div>
        <div>
          <h4 className="mb-3 font-heading text-sm font-semibold">Company</h4>
          <div className="flex flex-col gap-2">
            <span className="text-sm text-muted-foreground">About</span>
            <span className="text-sm text-muted-foreground">Careers</span>
            <span className="text-sm text-muted-foreground">Contact</span>
          </div>
        </div>
      </div>
      <div className="mt-10 border-t border-border pt-6 text-center text-xs text-muted-foreground">
        © 2026 LENDLY. All rights reserved.
      </div>
    </div>
  </footer>
);

export default Footer;
