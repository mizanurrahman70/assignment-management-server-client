"use client";

import { CatalogPage } from "@/components/catalog/CatalogPage";
import { classesApi } from "@/lib/services";

export default function ClassesPage() {
  return (
    <CatalogPage
      title="Classes"
      description="Manage the class and course catalog."
      singular="Class"
      service={classesApi}
    />
  );
}
