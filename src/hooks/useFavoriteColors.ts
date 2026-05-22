import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface FavoriteColor {
  id: string;
  hex_value: string;
  name: string;
  sort_order: number;
}

const FALLBACK_COLORS: FavoriteColor[] = [
  { id: "default-black", hex_value: "#000000", name: "Black", sort_order: 0 },
  { id: "default-red", hex_value: "#ef4444", name: "Red", sort_order: 1 },
  { id: "default-blue", hex_value: "#3b82f6", name: "Blue", sort_order: 2 },
  { id: "default-green", hex_value: "#22c55e", name: "Green", sort_order: 3 },
  { id: "default-purple", hex_value: "#a855f7", name: "Purple", sort_order: 4 },
  { id: "default-orange", hex_value: "#f97316", name: "Orange", sort_order: 5 },
  { id: "default-gold", hex_value: "#ca8a04", name: "Gold", sort_order: 6 },
];

export function useFavoriteColors() {
  const queryClient = useQueryClient();

  const { data: colors = [] } = useQuery({
    queryKey: ["favorite-colors"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("favorite_colors" as any)
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return (data as any[]).map((c) => ({
        id: c.id,
        hex_value: c.hex_value,
        name: c.name,
        sort_order: c.sort_order,
      })) as FavoriteColor[];
    },
  });

  // Return favorites if any exist, otherwise fallback defaults
  const displayColors = colors.length > 0 ? colors : FALLBACK_COLORS;

  const addColor = useMutation({
    mutationFn: async ({ hex_value, name }: { hex_value: string; name: string }) => {
      const { error } = await supabase
        .from("favorite_colors" as any)
        .insert({ hex_value, name, sort_order: colors.length } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Color saved to favorites!");
      queryClient.invalidateQueries({ queryKey: ["favorite-colors"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const removeColor = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("favorite_colors" as any)
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Color removed from favorites");
      queryClient.invalidateQueries({ queryKey: ["favorite-colors"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  return { colors: displayColors, rawColors: colors, addColor, removeColor };
}
