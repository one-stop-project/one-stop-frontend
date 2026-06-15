import { useState, useEffect, KeyboardEvent } from 'react';
import { Plus, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { usePopularTagsQuery } from '@/hooks/queries/useSellerQuery';

const MAX_TAGS = 10;

// 태그 입력 + 인기 태그 자동완성(디바운스) + 칩 — 등록/수정 페이지 공용
export function TagInput({
  tags,
  onChange,
}: {
  tags: string[];
  onChange: (tags: string[]) => void;
}) {
  const [input, setInput] = useState('');
  const [open, setOpen] = useState(false);
  const [debounced, setDebounced] = useState('');

  // 자동완성 과호출 방지(입력 디바운스). 백엔드가 태그를 소문자로 저장하므로 소문자로 정규화.
  useEffect(() => {
    const t = setTimeout(() => setDebounced(input.trim().toLowerCase()), 250);
    return () => clearTimeout(t);
  }, [input]);

  const { data: suggestions } = usePopularTagsQuery(debounced, open && debounced.length > 0);
  const filtered = (suggestions ?? []).filter((s) => !tags.includes(s.tag)).slice(0, 8);

  const addTag = (raw: string) => {
    const v = raw.trim().toLowerCase();
    if (!v) return;
    if (tags.includes(v)) {
      setInput('');
      return;
    }
    if (tags.length >= MAX_TAGS) {
      toast.error(`태그는 최대 ${MAX_TAGS}개까지 가능합니다.`);
      return;
    }
    onChange([...tags, v]);
    setInput('');
  };
  const removeTag = (t: string) => onChange(tags.filter((x) => x !== t));

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    // 한글 등 IME 조합 확정 Enter는 무시(미완성 태그 추가 방지)
    if (e.nativeEvent.isComposing) return;
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag(input);
    }
  };

  return (
    <div>
      <div className="relative">
        <div className="flex gap-2">
          <input
            className="input-field flex-1"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            onFocus={() => setOpen(true)}
            onBlur={() => setOpen(false)}
            placeholder="태그 입력 후 Enter"
            maxLength={30}
          />
          <button
            type="button"
            onClick={() => addTag(input)}
            className="btn-secondary flex items-center gap-1 whitespace-nowrap"
          >
            <Plus size={16} />
            추가
          </button>
        </div>

        {open && input.trim().length > 0 && filtered.length > 0 && (
          <ul className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-56 overflow-auto">
            {filtered.map((s) => (
              <li key={s.tag}>
                <button
                  type="button"
                  // onMouseDown: input blur보다 먼저 처리되어 클릭 시 추가가 보존됨
                  onMouseDown={(e) => {
                    e.preventDefault();
                    addTag(s.tag);
                  }}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center justify-between"
                >
                  <span>#{s.tag}</span>
                  <span className="text-xs text-gray-400">{s.usageCount.toLocaleString()}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {tags.map((t) => (
            <span
              key={t}
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 rounded-full text-sm text-gray-700"
            >
              #{t}
              <button
                type="button"
                onClick={() => removeTag(t)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={13} />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
