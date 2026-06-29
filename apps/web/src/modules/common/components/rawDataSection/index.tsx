import type { ReactNode } from "react";
import { type Column, DataTable } from "@/modules/common/components/dataTable";
import { SectionHeader } from "@/modules/common/components/sectionHeader";

export type RawDataSectionProps<T> = {
  eyebrow?: string;
  amharic?: string;
  title: string;
  note?: ReactNode;
  columns: Column<T>[];
  rows: T[];
  source: string;
  total: number;
};

export function RawDataSection<T extends Record<string, unknown>>({
  eyebrow = "Raw records",
  amharic,
  title,
  note,
  columns,
  rows,
  source,
  total,
}: RawDataSectionProps<T>) {
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
        <DataTable
          columns={columns}
          rows={rows}
          source={source}
          total={total}
        />
      </div>
    </section>
  );
}
