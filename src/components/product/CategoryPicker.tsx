import { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import type { Category } from '@/domains/product/productApi';

export const MAX_CATEGORIES = 3;

// 카테고리 트리(대>중>소) 선택기 — 상품 등록·수정 화면에서 공용으로 사용
export function CategoryPicker({
  categories,
  selectedIds,
  onToggle,
}: {
  categories: Category[] | undefined;
  selectedIds: number[];
  onToggle: (id: number) => void;
}) {
  return (
    <div className="flex flex-col gap-0.5 max-h-72 overflow-y-auto border border-gray-100 rounded-lg p-2">
      {categories?.map((c) => (
        <CategoryPickRow
          key={c.id}
          cat={c}
          depth={0}
          selectedIds={selectedIds}
          onToggle={onToggle}
        />
      ))}
    </div>
  );
}

// 카테고리 트리(대>중>소)를 토글(드릴다운)로 렌더 — 상위를 누르면 하위가 펼쳐지고, 이름 클릭 시 선택 토글
function CategoryPickRow({
  cat,
  depth,
  selectedIds,
  onToggle,
}: {
  cat: Category;
  depth: number;
  selectedIds: number[];
  onToggle: (id: number) => void;
}) {
  const selected = selectedIds.includes(cat.id);
  const hasChildren = (cat.children?.length ?? 0) > 0;
  // 선택된 하위가 있으면 기본으로 펼친다
  const [open, setOpen] = useState(() => containsSelected(cat, selectedIds));

  return (
    <>
      <div style={{ paddingLeft: `${depth * 16}px` }} className="flex items-center gap-1">
        {hasChildren ? (
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="p-1.5 text-gray-400 shrink-0"
            aria-label={open ? '접기' : '펼치기'}
          >
            <ChevronRight
              size={14}
              className={`transition-transform ${open ? 'rotate-90' : ''}`}
            />
          </button>
        ) : (
          <span className="w-[26px] shrink-0" />
        )}
        <button
          type="button"
          onClick={() => onToggle(cat.id)}
          className={`px-3 py-1.5 my-0.5 text-sm rounded-lg border transition-colors ${
            selected
              ? 'bg-primary-600 text-white border-primary-600'
              : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
          }`}
        >
          {cat.name}
        </button>
      </div>
      {open &&
        cat.children?.map((child) => (
          <CategoryPickRow
            key={child.id}
            cat={child}
            depth={depth + 1}
            selectedIds={selectedIds}
            onToggle={onToggle}
          />
        ))}
    </>
  );
}

// 선택된 id가 이 노드 자신 또는 하위 트리에 포함되는지
function containsSelected(cat: Category, selectedIds: number[]): boolean {
  if (selectedIds.includes(cat.id)) return true;
  return (cat.children ?? []).some((c) => containsSelected(c, selectedIds));
}
