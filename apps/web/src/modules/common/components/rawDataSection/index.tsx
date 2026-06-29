import type { ReactNode } from "react";
import {
  DataDisclosure,
  type GlossColumn,
} from "@/modules/common/components/dataDisclosure";
import { DataTable } from "@/modules/common/components/dataTable";
import { SectionHeader } from "@/modules/common/components/sectionHeader";

export type RawDataSectionProps<T> = {
  eyebrow?: string;
  amharic?: string;
  title: string;
  note?: ReactNode;
  description: string;
  columns: GlossColumn<T>[];
  rows: T[];
  source: string;
  total: number;
};

/** "The figures above are derived from this." A titled section whose raw table sits behind a
 *  disclosure — the table renders on the server; only the open/close shell is client. */
export function RawDataSection<T extends Record<string, unknown>>({
  eyebrow = "Underlying data",
  amharic,
  title,
  note,
  description,
  columns,
  rows,
  source,
  total,
}: RawDataSectionProps<T>) {
  const glossary = columns
    .filter((c) => c.help)
    .map((c) => ({ label: c.label, help: c.help as string }));

  return (
    <section className="sp-x py-14">
      <SectionHeader
        eyebrow={eyebrow}
        amharic={amharic}
        title={title}
        note={note}
        as="h2"
      />
      <div className="mt-8">
        <DataDisclosure
          title="Open the raw table"
          description={description}
          glossary={glossary}
          total={total}
        >
          <DataTable
            columns={columns}
            rows={rows}
            source={source}
            total={total}
          />
        </DataDisclosure>
      </div>
    </section>
  );
}
