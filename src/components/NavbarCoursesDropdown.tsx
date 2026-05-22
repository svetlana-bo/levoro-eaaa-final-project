import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ChevronDown, ChevronRight } from "lucide-react";

const TRANSITION_MS = 220;

const NavbarCoursesDropdown = () => {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [hoveredCategoryId, setHoveredCategoryId] = useState<string | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const unmountTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { data: categories = [] } = useQuery({
    queryKey: ["navbar-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const { data: subcategories = [] } = useQuery({
    queryKey: ["navbar-subcategories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subcategories")
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data as any[];
    },
  });

  const clearHoverTimer = () => {
    if (hoverTimer.current) {
      clearTimeout(hoverTimer.current);
      hoverTimer.current = null;
    }
  };

  const openPanel = () => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
    if (unmountTimer.current) {
      clearTimeout(unmountTimer.current);
      unmountTimer.current = null;
    }
    if (!mounted) {
      setMounted(true);
      requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)));
    } else {
      setVisible(true);
    }
  };

  const closePanel = () => {
    clearHoverTimer();
    closeTimer.current = setTimeout(() => {
      setVisible(false);
      unmountTimer.current = setTimeout(() => {
        setMounted(false);
        setHoveredCategoryId(null);
      }, TRANSITION_MS);
    }, 150);
  };

  const handleCategoryHover = (id: string) => {
    if (id === hoveredCategoryId) return;
    clearHoverTimer();
    hoverTimer.current = setTimeout(() => {
      setHoveredCategoryId(id);
    }, 80);
  };

  const subcatsForCategory = (categoryId: string) =>
    subcategories.filter((s: any) => s.category_id === categoryId);

  const activeSubs = hoveredCategoryId ? subcatsForCategory(hoveredCategoryId) : [];
  const activeCategory = categories.find((c: any) => c.id === hoveredCategoryId);
  const expanded = !!(activeCategory && activeSubs.length > 0);

  const handleLinkClick = () => {
    setVisible(false);
    setMounted(false);
    setHoveredCategoryId(null);
  };

  return (
    <div className="relative" onMouseEnter={openPanel} onMouseLeave={closePanel}>
      <Link
        to="/courses"
        className="flex items-center gap-1 transition-colors hover:text-secondary font-medium"
      >
        Explore Courses
        <ChevronDown
          className={`h-3.5 w-3.5 transition-transform duration-200 ${visible ? "rotate-180" : ""}`}
        />
      </Link>

      {mounted && categories.length > 0 && (
        <div
          className={`absolute left-0 top-full mt-2 z-50 overflow-hidden rounded-xl border border-border bg-card shadow-xl transition-[opacity,transform] ease-out ${
            visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2 pointer-events-none"
          }`}
          style={{
            transitionDuration: `${TRANSITION_MS}ms`,
            width: 640,
          }}
        >
          <div className="flex min-h-[320px]">
            {/* Left: Categories */}
            <div className="w-72 shrink-0 p-2 space-y-1">
              <Link
                to="/courses"
                className="block px-3 py-2 text-sm font-semibold text-primary hover:bg-muted rounded-md transition-colors"
                onClick={handleLinkClick}
              >
                All Courses
              </Link>
              {categories.map((cat: any) => {
                const hasSubs = subcatsForCategory(cat.id).length > 0;
                const isHovered = hoveredCategoryId === cat.id;
                return (
                  <Link
                    key={cat.id}
                    to={`/courses?category=${cat.slug}`}
                    className={`flex items-center justify-between px-3 py-2 text-sm rounded-md transition-colors ${
                      isHovered ? "bg-muted text-primary font-medium" : "text-foreground hover:bg-muted/60"
                    }`}
                    onMouseEnter={() => handleCategoryHover(cat.id)}
                    onClick={handleLinkClick}
                  >
                    <span>{cat.name}</span>
                    {hasSubs && <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
                  </Link>
                );
              })}
            </div>

            {/* Right: Subcategories — always mounted, content fades on hover */}
            <div className="flex-1 border-l border-border p-4">
              {expanded ? (
                <div
                  key={activeCategory!.id}
                  className="transition-opacity duration-150 opacity-100"
                >
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                    {activeCategory!.name}
                  </p>
                  <div className="grid grid-cols-1 gap-1">
                    {activeSubs.map((sub: any) => (
                      <Link
                        key={sub.id}
                        to={`/courses?subcategory=${sub.slug}`}
                        className="px-3 py-2 text-sm text-foreground hover:bg-muted hover:text-primary rounded-md transition-colors"
                        onClick={handleLinkClick}
                      >
                        {sub.name}
                      </Link>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex h-full items-center justify-center">
                  <p className="text-xs text-muted-foreground">Hover a category to see topics</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default NavbarCoursesDropdown;
