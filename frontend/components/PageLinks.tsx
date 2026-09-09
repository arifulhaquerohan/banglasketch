import Link from "next/link";
export function PageLinks({ path, page, hasMore, category = "", search = "" }: { path: string; page: number; hasMore: boolean; category?: string; search?: string }) {
  const href = (value: number) => `${path}?${new URLSearchParams({ page: String(value), category, search })}`;
  return <nav aria-label="Pagination" className="flex items-center justify-center gap-6 my-8">
    {page > 1 && <Link className="btn btn-primary" href={href(page - 1)}>Previous</Link>}
    <span>Page {page}</span>
    {hasMore && <Link className="btn btn-primary" href={href(page + 1)}>Next</Link>}
  </nav>;
}
