import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "student" | "instructor" | "admin" | "webadmin";

export const useRole = () => {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const [role, setRole] = useState<AppRole>("student");
  const [roleLoading, setRoleLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setRole("student");
      setRoleLoading(false);
      return;
    }

    const fetchRole = async () => {
      setRoleLoading(true);
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .maybeSingle();

      if (!error && data?.role) {
        setRole(data.role as AppRole);
      } else {
        setRole("student");
      }
      setRoleLoading(false);
    };

    fetchRole();
  }, [userId]);

  return { role, roleLoading };
};
