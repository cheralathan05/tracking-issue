import { Link } from "@tanstack/react-router";
import { Shield, Phone, Mail, MapPin } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-secondary/40">
      <div className="container mx-auto grid grid-cols-1 gap-10 px-4 py-14 md:grid-cols-4">
        <div className="space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-primary">
              <Shield className="h-5 w-5 text-primary-foreground" />
            </div>
            <div className="leading-tight">
              <div className="text-sm font-semibold">Civic Bridge Flow</div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                Citizen Portal
              </div>
            </div>
          </div>
          <p className="text-sm text-muted-foreground max-w-xs">
            A transparent, secure, citizen-first grievance redressal platform powering smart
            governance.
          </p>
        </div>

        <div>
          <h4 className="mb-3 text-sm font-semibold">Platform</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>
              <Link to="/services" className="hover:text-foreground">
                Services
              </Link>
            </li>
            <li>
              <Link to="/track" className="hover:text-foreground">
                Track Complaint
              </Link>
            </li>
            <li>
              <Link to="/about" className="hover:text-foreground">
                About
              </Link>
            </li>
            <li>
              <Link to="/contact" className="hover:text-foreground">
                Help Center
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="mb-3 text-sm font-semibold">Legal</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>
              <a className="hover:text-foreground" href="#">
                Privacy Policy
              </a>
            </li>
            <li>
              <a className="hover:text-foreground" href="#">
                Terms of Service
              </a>
            </li>
            <li>
              <a className="hover:text-foreground" href="#">
                Accessibility
              </a>
            </li>
            <li>
              <a className="hover:text-foreground" href="#">
                Right to Information
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="mb-3 text-sm font-semibold">Contact</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              <span>1800-XXX-XXXX</span>
            </li>
            <li className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              <span>support@civicbridgeflow.gov.in</span>
            </li>
            <li className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              <span>New Delhi, India</span>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border">
        <div className="container mx-auto flex flex-col items-center justify-between gap-2 px-4 py-5 text-xs text-muted-foreground md:flex-row">
          <p>© 2026 Civic Bridge Flow. A Government of India initiative.</p>
          <p>Version 1.0 · Updated 14 May 2026</p>
        </div>
      </div>
    </footer>
  );
}
