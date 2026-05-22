import { useEffect } from "react";
import { Navigate, useParams } from "react-router-dom";
import { setViewAsCompanyId } from "@/lib/viewAsContext";

export default function AdminViewAsRedirect() {
  const { id } = useParams<{ id: string }>();
  useEffect(() => {
    if (id) setViewAsCompanyId(id);
  }, [id]);
  if (!id) return <Navigate to="/admin/companies" replace />;
  return <Navigate to="/organisation/dashboard" replace />;
}
