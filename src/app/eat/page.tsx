"use client";

import { ResourceDesk } from "@/components/resource-desk";

export default function EatPage() {
  return (
    <ResourceDesk
      title="Eat"
      hint="Every restaurant in the database. Change the name, photo, YouTube clip, or remove a place from the app."
      path="/admin/restaurants"
      columns={[
        { key: "image", label: "" },
        { key: "name", label: "Name" },
        { key: "city", label: "City" },
        { key: "kind", label: "Kind" },
        { key: "cuisine", label: "Cuisine" },
        { key: "video", label: "Video" },
      ]}
      fields={[
        { key: "name", label: "Name" },
        { key: "city", label: "City" },
        { key: "kind", label: "Kind" },
        { key: "cuisine", label: "Cuisine" },
        { key: "phone", label: "Phone" },
        { key: "hours", label: "Hours" },
        { key: "image", label: "Image URL" },
        { key: "video", label: "YouTube video ID" },
        { key: "web", label: "Website" },
      ]}
    />
  );
}
