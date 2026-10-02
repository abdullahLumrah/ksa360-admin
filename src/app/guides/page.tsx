"use client";

import { ResourceDesk } from "@/components/resource-desk";

export default function GuidesPage() {
  return (
    <ResourceDesk
      title="Guides"
      hint="Posts served by the Guides API. Search a category topic, edit the title or cover, or take a post down."
      path="/admin/posts"
      columns={[
        { key: "image", label: "" },
        { key: "title", label: "Title" },
        { key: "date", label: "Date" },
        { key: "source", label: "Source" },
      ]}
      fields={[
        { key: "title", label: "Title" },
        { key: "excerpt", label: "Excerpt", multiline: true },
        { key: "image", label: "Image URL" },
      ]}
    />
  );
}
