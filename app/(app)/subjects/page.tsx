"use client";

import { CatalogPage } from "@/components/catalog/CatalogPage";
import { subjectsApi } from "@/lib/services";

export default function SubjectsPage() {
  return (
    <CatalogPage
      title="Subjects"
      description="Manage the subject catalog."
      singular="Subject"
      service={subjectsApi}
    />
  );
}
