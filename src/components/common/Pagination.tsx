// 목록 페이지 공용 페이저.
// 응답마다 first/last 필드 유무가 달라(커스텀 DTO는 없음), 0-based 현재 page와 totalPages만으로 판단한다.
export function Pagination({
  page,
  totalPages,
  onChange,
}: {
  page: number;          // 현재 페이지(0-based)
  totalPages: number;
  onChange: (next: number) => void;
}) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-2 mt-8">
      <button
        onClick={() => onChange(Math.max(0, page - 1))}
        disabled={page <= 0}
        className="btn-secondary text-sm disabled:opacity-50"
      >
        이전
      </button>
      <span className="text-sm text-gray-600">
        {page + 1} / {totalPages}
      </span>
      <button
        onClick={() => onChange(page + 1)}
        disabled={page >= totalPages - 1}
        className="btn-secondary text-sm disabled:opacity-50"
      >
        다음
      </button>
    </div>
  );
}
