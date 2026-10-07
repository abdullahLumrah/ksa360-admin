"use client";

import { ResourceDesk } from "@/components/resource-desk";

export default function GuidesPage() {
  return (
    <ResourceDesk
      title="Guides"
      hint="Published posts on the Guides API. User requests stay in Guide queue until you approve them."
      path="/admin/posts"
      allowCreate
      createLabel="Add post"
      createDefaults={{ status: "published", source: "admin" }}
      columns={[
        { key: "image", label: "" },
        { key: "title", label: "Title" },
        { key: "date", label: "Date" },
        { key: "status", label: "Status" },
        { key: "source", label: "Source" },
      ]}
      fields={[
        { key: "title", label: "Title" },
        { key: "excerpt", label: "Description", multiline: true },
        { key: "image", label: "Image URL" },
      ]}
    />
  );
}
