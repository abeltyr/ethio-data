/** Renders one or more schema.org objects as a JSON-LD script. Content is server-built only. */
export function JsonLdScript({ data }: { data: Record<string, unknown>[] }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
