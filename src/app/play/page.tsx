"use client";

import { ResourceDesk } from "@/components/resource-desk";

export default function PlayPage() {
  return (
    <ResourceDesk
      title="Play"
      hint="Activities from the Play API. Update copy, thumbnail, or the attached video without touching the app build."
      path="/admin/activities"
      columns={[
        { key: "image", label: "" },
        { key: "name", label: "Name" },
        { key: "city", label: "City" },
        { key: "kind", label: "Kind" },
        { key: "video", label: "Video" },
      ]}
      fields={[
        { key: "name", label: "Name" },
        { key: "city", label: "City" },
        { key: "kind", label: "Kind" },
        { key: "about", label: "About", multiline: true },
        { key: "image", label: "Image URL" },
        { key: "video", label: "YouTube video ID" },
        { key: "phone", label: "Phone" },
        { key: "hours", label: "Hours" },
        { key: "web", label: "Website" },
      ]}
    />
  );
}
