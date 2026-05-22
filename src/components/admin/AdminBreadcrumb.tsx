import { Link } from "react-router-dom";
import { ReactNode } from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export function AdminBreadcrumb({ trail }: { trail: { label: ReactNode; to?: string }[] }) {
  return (
    <Breadcrumb className="mb-3">
      <BreadcrumbList>
        {trail.map((t, i) => {
          const last = i === trail.length - 1;
          return (
            <span key={i} className="flex items-center gap-2">
              <BreadcrumbItem>
                {last || !t.to ? (
                  <BreadcrumbPage>{t.label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link to={t.to} className="text-muted-foreground hover:text-foreground">
                      {t.label}
                    </Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {!last && <BreadcrumbSeparator />}
            </span>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
