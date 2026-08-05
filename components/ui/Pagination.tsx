interface PaginationProps {
  page: number;
  totalPages: number;
  totalCount: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ page, totalPages, totalCount, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
  const visible = pages.filter(
    (p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1,
  );

  const items: (number | "...")[] = [];
  let prev = 0;
  for (const p of visible) {
    if (p - prev > 1) items.push("...");
    items.push(p);
    prev = p;
  }

  return (
    <nav
      className="flex items-center justify-between gap-4 border-t border-gray-200 px-5 py-3"
      aria-label="Pagination"
    >
      <p className="text-sm text-gray-500">
        {totalCount} {totalCount === 1 ? "result" : "results"}
      </p>
      <div className="flex items-center gap-1">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="rounded-md px-2.5 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-300"
        >
          Previous
        </button>
        {items.map((item, i) =>
          item === "..." ? (
            <span key={`gap-${i}`} className="px-1 text-sm text-gray-400">
              …
            </span>
          ) : (
            <button
              key={item}
              type="button"
              onClick={() => onPageChange(item)}
              aria-current={item === page ? "page" : undefined}
              className={`rounded-md px-2.5 py-1.5 text-sm font-medium ${
                item === page
                  ? "bg-indigo-600 text-white"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {item}
            </button>
          ),
        )}
        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="rounded-md px-2.5 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-300"
        >
          Next
        </button>
      </div>
    </nav>
  );
}
