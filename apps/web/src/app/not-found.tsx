import Link from "next/link";

export default function NotFound() {
  return (
    <section className="sp-x py-24 sm:py-32">
      <p className="eyebrow text-primary">404 · not in the bulletin</p>
      <h1 className="mt-4 font-display text-4xl tracking-tight sm:text-5xl">
        This page doesn&rsquo;t exist.
      </h1>
      <p className="mt-4 max-w-md text-muted-foreground leading-relaxed">
        The page you&rsquo;re looking for isn&rsquo;t part of the data
        warehouse. Head back to the overview to find the dataset you need.
      </p>
      <Link
        href="/"
        className="eyebrow animate mt-8 inline-block text-primary hover:underline"
      >
        &larr; Back to overview
      </Link>
    </section>
  );
}
