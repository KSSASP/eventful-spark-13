import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Calendar, LogOut, User, LayoutDashboard, Menu, X } from "lucide-react";
import { useState } from "react";

const Navbar = () => {
  const { user, profile, roles, signOut } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isAdmin = roles.includes("admin");
  const isOrganizer = roles.includes("organizer");

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <nav className="sticky top-0 z-50 border-b bg-card/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 font-display text-xl font-bold text-foreground">
          <Calendar className="h-6 w-6 text-primary" />
          EventHub
        </Link>

        {/* Desktop nav */}
        <div className="hidden items-center gap-6 md:flex">
          <Link to="/events" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
            Events
          </Link>
          {user ? (
            <>
              <Link to="/dashboard" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
                Dashboard
              </Link>
              {(isAdmin || isOrganizer) && (
                <Link to="/organizer" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
                  Organizer
                </Link>
              )}
              {isAdmin && (
                <Link to="/admin" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
                  Admin
                </Link>
              )}
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground">{profile?.full_name || user.email}</span>
                <Button variant="ghost" size="icon" onClick={handleSignOut}>
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="ghost" onClick={() => navigate("/auth")}>
                Sign In
              </Button>
              <Button onClick={() => navigate("/auth?mode=signup")}>
                Sign Up
              </Button>
            </div>
          )}
        </div>

        {/* Mobile toggle */}
        <button className="md:hidden" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t bg-card p-4 md:hidden animate-fade-in">
          <div className="flex flex-col gap-3">
            <Link to="/events" className="text-sm font-medium" onClick={() => setMobileOpen(false)}>Events</Link>
            {user ? (
              <>
                <Link to="/dashboard" className="text-sm font-medium" onClick={() => setMobileOpen(false)}>Dashboard</Link>
                {(isAdmin || isOrganizer) && (
                  <Link to="/organizer" className="text-sm font-medium" onClick={() => setMobileOpen(false)}>Organizer</Link>
                )}
                {isAdmin && (
                  <Link to="/admin" className="text-sm font-medium" onClick={() => setMobileOpen(false)}>Admin</Link>
                )}
                <Button variant="ghost" onClick={handleSignOut} className="justify-start">Sign Out</Button>
              </>
            ) : (
              <>
                <Button variant="ghost" onClick={() => { navigate("/auth"); setMobileOpen(false); }}>Sign In</Button>
                <Button onClick={() => { navigate("/auth?mode=signup"); setMobileOpen(false); }}>Sign Up</Button>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
