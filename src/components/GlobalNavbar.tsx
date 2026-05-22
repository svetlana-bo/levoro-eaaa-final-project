import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect, useRef } from "react";
import { Menu, X, User, LogOut, Search } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import NavbarCoursesDropdown from "@/components/NavbarCoursesDropdown";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminEditableImage } from "@/components/AdminEditableImage";

interface GlobalNavbarProps {
  hideOnScroll?: boolean;
}

const GlobalNavbar = ({ hideOnScroll = true }: GlobalNavbarProps) => {
  const { user, signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [visible, setVisible] = useState(true);
  const ticking = useRef(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const accountCloseTimer = useRef<number | undefined>(undefined);
  const lastScrollY = useRef(0);
  const navigate = useNavigate();
  const searchRef = useRef<HTMLDivElement>(null);

  const handleAccountEnter = () => {
    if (accountCloseTimer.current) {
      window.clearTimeout(accountCloseTimer.current);
      accountCloseTimer.current = undefined;
    }
    setAccountOpen(true);
  };
  const handleAccountLeave = () => {
    accountCloseTimer.current = window.setTimeout(() => setAccountOpen(false), 150);
  };

  const navLinks = [
    { label: "Teach on Levoro", to: "/teach" },
    { label: "For Businesses", to: "/business" },
  ];

  const closeMobile = () => setMobileOpen(false);

  const handleLogout = async () => {
    await signOut();
    closeMobile();
    navigate("/");
  };

  // Search autocomplete
  const { data: searchResults = [] } = useQuery({
    queryKey: ["navbar-search", searchQuery],
    queryFn: async () => {
      if (searchQuery.trim().length < 2) return [];
      const { data, error } = await supabase
        .from("courses")
        .select("id, title, thumbnail_url")
        .eq("status", "published")
        .ilike("title", `%${searchQuery}%`)
        .limit(5);
      if (error) throw error;
      return data;
    },
    enabled: searchQuery.trim().length >= 2,
  });

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/courses?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
      setSearchFocused(false);
    }
  };

  const handleSearchResultClick = (courseId: string) => {
    navigate(`/courses/${courseId}`);
    setSearchQuery("");
    setSearchFocused(false);
  };

  // Close search dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchFocused(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (!hideOnScroll) return;
    const handleScroll = () => {
      if (ticking.current) return;
      ticking.current = true;
      requestAnimationFrame(() => {
        const currentY = window.scrollY;
        const delta = currentY - lastScrollY.current;
        if (currentY < 10) {
          setVisible(true);
        } else if (Math.abs(delta) > 5) {
          if (delta > 0 && currentY > 80) {
            setVisible(false);
          } else if (delta < 0) {
            setVisible(true);
          }
        }
        lastScrollY.current = currentY;
        ticking.current = false;
      });
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [hideOnScroll]);

  return (
    <header
      className={`sticky top-0 z-50 h-20 border-b border-border/50 bg-card backdrop-blur-none transition-transform duration-300 ${
        hideOnScroll && !visible ? "-translate-y-full" : "translate-y-0"
      }`}
      style={{ "--navbar-height": "80px" } as React.CSSProperties}
    >
      <nav className="flex h-full w-full items-center justify-between gap-4 px-6">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <AdminEditableImage
            imageKey="navbar-logo"
            alt="Levoro Academy Logo"
            className="h-12 w-auto object-contain"
            fallback={
              <span className="flex items-center gap-2">
                <span className="text-xl font-extrabold tracking-tight text-primary">
                  Levoro Academy
                </span>
                <span className="h-2 w-2 rounded-full bg-secondary" />
              </span>
            }
          />
        </Link>

        {/* Desktop Nav */}
        <div className="hidden lg:flex items-center gap-6 text-sm font-medium text-muted-foreground flex-1 justify-center">
          <NavbarCoursesDropdown />

          {/* Search Bar */}
          <div ref={searchRef} className="relative w-full max-w-xs">
            <form onSubmit={handleSearchSubmit}>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="What do you want to learn today?"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setSearchFocused(true)}
                  className="pl-9 pr-3 h-9 text-sm bg-muted/50 border-border/60"
                />
              </div>
            </form>
            {searchFocused && searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-lg z-50 overflow-hidden">
                {searchResults.map((course: any) => (
                  <button
                    key={course.id}
                    onClick={() => handleSearchResultClick(course.id)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-muted transition-colors"
                  >
                    {course.thumbnail_url ? (
                      <img src={course.thumbnail_url} alt="" className="h-8 w-12 rounded object-cover shrink-0" />
                    ) : (
                      <div className="h-8 w-12 rounded bg-muted-foreground/10 shrink-0" />
                    )}
                    <span className="text-sm font-medium text-foreground truncate">{course.title}</span>
                  </button>
                ))}
                <button
                  onClick={handleSearchSubmit as any}
                  className="w-full px-4 py-2 text-xs font-medium text-primary hover:bg-muted transition-colors border-t border-border"
                >
                  See all results for "{searchQuery}"
                </button>
              </div>
            )}
          </div>

          {navLinks.map((link) => (
            <Link key={link.to} to={link.to} className="transition-colors hover:text-secondary whitespace-nowrap">
              {link.label}
            </Link>
          ))}
        </div>

        {/* Desktop Auth */}
        <div className="hidden lg:flex items-center gap-3 shrink-0">
          {user ? (
            <div onMouseEnter={handleAccountEnter} onMouseLeave={handleAccountLeave}>
              <DropdownMenu open={accountOpen} onOpenChange={setAccountOpen}>
                <DropdownMenuTrigger className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                  {user.user_metadata?.first_name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || "U"}
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-52 p-2 rounded-xl border-border bg-card shadow-xl"
                  onMouseEnter={handleAccountEnter}
                  onMouseLeave={handleAccountLeave}
                >
                  <DropdownMenuItem onClick={() => navigate("/dashboard")} className="cursor-pointer rounded-md px-3 py-2 text-sm text-foreground focus:bg-muted focus:text-primary">
                    <User className="mr-2 h-4 w-4" />
                    Dashboard
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer rounded-md px-3 py-2 text-sm text-destructive focus:bg-destructive/10 focus:text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/login">Log in</Link>
              </Button>
              <Button variant="hero" size="sm" asChild>
                <Link to="/signup">Join for Free</Link>
              </Button>
            </>
          )}
        </div>

        {/* Mobile Toggle */}
        <button
          className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-border/60 lg:hidden"
          onClick={() => setMobileOpen((prev) => !prev)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="absolute inset-x-0 top-full z-50 border-b border-border/50 bg-card shadow-lg lg:hidden">
          <div className="space-y-3 px-5 py-4">
            <Link
              to="/courses"
              className="block text-sm font-medium text-muted-foreground transition-colors hover:text-secondary"
              onClick={closeMobile}
            >
              Explore Courses
            </Link>
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="block text-sm font-medium text-muted-foreground transition-colors hover:text-secondary"
                onClick={closeMobile}
              >
                {link.label}
              </Link>
            ))}
            <div className="flex gap-2 border-t border-border/50 pt-3">
              {user ? (
                <>
                  <Button variant="hero" size="sm" asChild className="flex-1" onClick={closeMobile}>
                    <Link to="/dashboard">Dashboard</Link>
                  </Button>
                  <Button variant="ghost" size="sm" className="flex-1" onClick={handleLogout}>
                    Log out
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="ghost" size="sm" asChild className="flex-1" onClick={closeMobile}>
                    <Link to="/login">Log in</Link>
                  </Button>
                  <Button variant="hero" size="sm" asChild className="flex-1" onClick={closeMobile}>
                    <Link to="/signup">Join for Free</Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default GlobalNavbar;
