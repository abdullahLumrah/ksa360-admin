"use client";

import { ResourceDesk } from "@/components/resource-desk";

export default function CarePage() {
  return (
    <ResourceDesk
      title="Care"
      hint="Hospitals, clinics, and health centres from GET /healthcare/nearby. Add GPS coordinates so the app sorts by the user's live location."
      path="/admin/healthcare"
      allowCreate
      createLabel="Add hospital"
      searchHint="Search name, city, kind, or phone"
      createDefaults={{
        name: "",
        city: "",
        kind: "hospital",
        lat: "",
        lng: "",
        phone: "",
        hours: "",
        web: "",
        amenity: "hospital",
        emergency: false,
        services: "",
      }}
      columns={[
        { key: "name", label: "Name" },
        { key: "city", label: "City" },
        { key: "kind", label: "Kind" },
        { key: "emergency", label: "ER" },
        { key: "phone", label: "Phone" },
        { key: "source", label: "Source" },
      ]}
      fields={[
        { key: "name", label: "Name" },
        { key: "city", label: "City" },
        { key: "kind", label: "Kind (hospital, clinic, health_centre)" },
        { key: "lat", label: "Latitude" },
        { key: "lng", label: "Longitude" },
        { key: "phone", label: "Phone" },
        { key: "hours", label: "Hours" },
        { key: "web", label: "Website" },
        { key: "amenity", label: "Amenity" },
        { key: "services", label: "Services (comma separated)" },
        { key: "emergency", label: "Emergency / ER", type: "checkbox" },
      ]}
    />
  );
}
