import { notFound } from "next/navigation";

// src/proxy.ts rewrites requests on unconnected hosts here, so they get a 404.
export default function Page() {
  notFound();
}
