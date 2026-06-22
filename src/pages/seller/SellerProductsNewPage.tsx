import { useState, useMemo, useEffect, FormEvent, ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, ImagePlus, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useCreateProductMutation } from '@/hooks/queries/useSellerQuery';
import { useCategoriesQuery } from '@/hooks/queries/useProductQuery';
import { ProductItemCreateRequest } from '@/domains/seller/sellerApi';
import { TagInput } from '@/components/product/TagInput';
import { CategoryPicker, MAX_CATEGORIES } from '@/components/product/CategoryPicker';

// 옵션 한 줄(상품 아이템) — 옵션 종류 수만큼 값(values)을 가진다(색상=빨강, 사이즈=M …)
interface ItemForm {
  values: string[];
  price: string;
  stock: string;
}

const MAX_IMAGES = 10;
const MAX_ITEMS = 5;
const MAX_OPTIONS = 5; // 옵션 종류(축) 최대 5개 — 백엔드 optionValue1~5

export default function SellerProductsNewPage() {
  const navigate = useNavigate();
  const { data: categories } = useCategoriesQuery();
  const createMutation = useCreateProductMutation();

  const [form, setForm] = useState({ name: '', description: '' });
  const [categoryIds, setCategoryIds] = useState<number[]>([]);
  const [images, setImages] = useState<File[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  // 옵션 종류 이름들(예: ['색상','사이즈']). 비어 있으면 옵션 없는 단일 상품.
  const [optionNames, setOptionNames] = useState<string[]>([]);
  const [items, setItems] = useState<ItemForm[]>([{ values: [], price: '', stock: '' }]);

  // 미리보기 URL은 images 변경 시에만 생성하고, 교체/언마운트 시 해제(메모리 누수 방지)
  const previews = useMemo(() => images.map((f) => URL.createObjectURL(f)), [images]);
  useEffect(() => () => previews.forEach((url) => URL.revokeObjectURL(url)), [previews]);

  const toggleCategory = (id: number) =>
    setCategoryIds((prev) =>
      prev.includes(id)
        ? prev.filter((c) => c !== id)
        : prev.length < MAX_CATEGORIES
          ? [...prev, id]
          : prev
    );

  const onImagesChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    setImages((prev) => [...prev, ...files].slice(0, MAX_IMAGES));
    e.target.value = ''; // 같은 파일 재선택 허용
  };
  const removeImage = (idx: number) => setImages(images.filter((_, i) => i !== idx));

  // ── 옵션 종류(축) 관리 — 추가/삭제 시 모든 아이템의 값 칸 수를 함께 맞춘다 ──
  const addOption = () => {
    if (optionNames.length >= MAX_OPTIONS) return;
    setOptionNames([...optionNames, '']);
    setItems(items.map((it) => ({ ...it, values: [...it.values, ''] })));
  };
  const removeOption = (axisIdx: number) => {
    setOptionNames(optionNames.filter((_, i) => i !== axisIdx));
    setItems(items.map((it) => ({ ...it, values: it.values.filter((_, i) => i !== axisIdx) })));
  };
  const updateOption = (axisIdx: number, value: string) =>
    setOptionNames(optionNames.map((n, i) => (i === axisIdx ? value : n)));

  // ── 옵션 한 줄(아이템) 관리 ──
  const addItem = () => {
    if (items.length >= MAX_ITEMS) return;
    setItems([...items, { values: optionNames.map(() => ''), price: '', stock: '' }]);
  };
  const removeItem = (idx: number) => setItems(items.filter((_, i) => i !== idx));
  const updateItemField = (idx: number, field: 'price' | 'stock', value: string) =>
    setItems(items.map((item, i) => (i === idx ? { ...item, [field]: value } : item)));
  const updateItemValue = (idx: number, axisIdx: number, value: string) =>
    setItems(
      items.map((item, i) =>
        i === idx
          ? { ...item, values: item.values.map((v, a) => (a === axisIdx ? value : v)) }
          : item
      )
    );

  // values[0..4] → optionValue1~5 슬롯으로 매핑(빈 값은 보내지 않음)
  const toItemPayload = (it: ItemForm): ProductItemCreateRequest => ({
    optionValue1: it.values[0]?.trim() || undefined,
    optionValue2: it.values[1]?.trim() || undefined,
    optionValue3: it.values[2]?.trim() || undefined,
    optionValue4: it.values[3]?.trim() || undefined,
    optionValue5: it.values[4]?.trim() || undefined,
    price: Number(it.price),
    stock: Number(it.stock),
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (categoryIds.length < 1) {
      toast.error('카테고리를 1개 이상 선택해주세요.');
      return;
    }
    if (images.length < 1) {
      toast.error('상품 이미지를 1장 이상 등록해주세요.');
      return;
    }
    if (items.length > MAX_ITEMS) {
      toast.error(`옵션은 최대 ${MAX_ITEMS}개까지 등록할 수 있습니다.`);
      return;
    }

    const hasOptions = optionNames.length > 0;

    // 옵션 종류를 정의했다면 이름이 비거나 중복되면 안 된다.
    if (hasOptions) {
      const names = optionNames.map((n) => n.trim());
      if (names.some((n) => n === '')) {
        toast.error('옵션 종류 이름을 입력해주세요.');
        return;
      }
      if (new Set(names).size !== names.length) {
        toast.error('옵션 종류 이름이 서로 중복됩니다.');
        return;
      }
    }

    // 옵션(아이템) 검증 — 빈 가격은 Number("")=0 이 되어 백엔드 @Min(100) 위반으로 등록 실패한다.
    for (let i = 0; i < items.length; i++) {
      const price = Number(items[i].price);
      const stock = Number(items[i].stock);
      if (!items[i].price.trim() || Number.isNaN(price) || price < 100) {
        toast.error(`${i + 1}번 옵션의 가격을 100원 이상 입력해주세요.`);
        return;
      }
      if (!items[i].stock.trim() || Number.isNaN(stock) || stock < 0) {
        toast.error(`${i + 1}번 옵션의 재고를 0개 이상 입력해주세요.`);
        return;
      }
      if (hasOptions && items[i].values.some((v) => v.trim() === '')) {
        toast.error(`${i + 1}번 옵션의 옵션값을 모두 입력해주세요.`);
        return;
      }
    }

    // 옵션 조합이 서로 겹치면 같은 상품 내 옵션 구분이 안 된다.
    if (hasOptions) {
      const combos = items.map((it) => it.values.map((v) => v.trim()).join(' / '));
      if (new Set(combos).size !== combos.length) {
        toast.error('옵션값 조합이 서로 중복됩니다. 다른 값으로 입력해주세요.');
        return;
      }
    } else if (items.length > 1) {
      // 옵션 종류 없이 옵션을 2개 이상 두면 서로 구분할 수 없다.
      toast.error('옵션을 여러 개 두려면 옵션 종류(예: 색상)를 먼저 추가해주세요.');
      return;
    }

    createMutation.mutate(
      {
        data: {
          name: form.name,
          description: form.description,
          categoryIds,
          tags: tags.length > 0 ? tags : undefined,
          optionNames: hasOptions ? optionNames.map((n) => n.trim()) : undefined,
          items: items.map(toItemPayload),
        },
        images,
      },
      {
        onSuccess: () => navigate('/seller/products'),
      }
    );
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">상품 등록</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 기본 정보 */}
        <section className="card p-6 space-y-4">
          <h2 className="text-lg font-semibold">기본 정보</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              상품명 <span className="text-primary-600">*</span>
            </label>
            <input
              className="input-field"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              maxLength={200}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              카테고리 <span className="text-primary-600">*</span>
              <span className="text-xs text-gray-400 ml-1">(1~3개 선택)</span>
            </label>
            <CategoryPicker
              categories={categories}
              selectedIds={categoryIds}
              onToggle={toggleCategory}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              상품 설명 <span className="text-primary-600">*</span>
            </label>
            <textarea
              className="input-field"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={5}
              required
            />
          </div>
        </section>

        {/* 태그 */}
        <section className="card p-6 space-y-3">
          <h2 className="text-lg font-semibold">
            태그 <span className="text-xs text-gray-400">(선택 · 최대 10개)</span>
          </h2>
          <TagInput tags={tags} onChange={setTags} />
        </section>

        {/* 상품 이미지 */}
        <section className="card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">
              상품 이미지 <span className="text-primary-600">*</span>
            </h2>
            <span className="text-xs text-gray-400">
              {images.length}/{MAX_IMAGES} (첫 장이 대표 이미지)
            </span>
          </div>

          <div className="flex flex-wrap gap-3">
            {images.map((_, idx) => (
              <div key={idx} className="relative w-24 h-24">
                <img
                  src={previews[idx]}
                  alt={`상품 이미지 ${idx + 1}`}
                  className="w-24 h-24 object-cover rounded-lg border border-gray-200"
                />
                <button
                  type="button"
                  onClick={() => removeImage(idx)}
                  className="absolute -top-2 -right-2 bg-gray-900 text-white rounded-full p-0.5"
                  title="삭제"
                >
                  <X size={14} />
                </button>
              </div>
            ))}

            {images.length < MAX_IMAGES && (
              <label className="w-24 h-24 flex flex-col items-center justify-center gap-1 border-2 border-dashed border-gray-300 rounded-lg text-gray-400 cursor-pointer hover:border-primary-400 hover:text-primary-500">
                <ImagePlus size={20} />
                <span className="text-xs">추가</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={onImagesChange}
                  className="hidden"
                />
              </label>
            )}
          </div>
        </section>

        {/* 옵션 (상품 아이템) */}
        <section className="card p-6">
          <h2 className="text-lg font-semibold mb-4">옵션 및 재고</h2>

          {/* 옵션 종류 정의 — 색상/사이즈 등. 없으면 옵션 없는 단일 상품 */}
          <div className="mb-5">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">
                옵션 종류
                <span className="text-xs text-gray-400 ml-1">
                  (예: 색상, 사이즈 · 단일 상품이면 비워두세요)
                </span>
              </label>
              <button
                type="button"
                onClick={addOption}
                disabled={optionNames.length >= MAX_OPTIONS}
                className="text-sm text-primary-600 flex items-center gap-1 hover:text-primary-700 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Plus size={16} />
                옵션 종류 추가
              </button>
            </div>

            {optionNames.length > 0 && (
              <div className="space-y-2">
                {optionNames.map((name, axisIdx) => (
                  <div key={axisIdx} className="flex gap-2 items-center">
                    <input
                      className="input-field flex-1"
                      value={name}
                      onChange={(e) => updateOption(axisIdx, e.target.value)}
                      placeholder={`옵션 종류 ${axisIdx + 1} (예: ${axisIdx === 0 ? '색상' : '사이즈'})`}
                      maxLength={20}
                    />
                    <button
                      type="button"
                      onClick={() => removeOption(axisIdx)}
                      className="p-2.5 text-red-500 hover:bg-red-50 rounded-lg"
                      title="옵션 종류 삭제"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 옵션 한 줄(옵션값 + 가격 + 재고) */}
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-gray-700">
              {optionNames.length > 0 ? '옵션값 · 가격 · 재고' : '가격 · 재고'}
            </p>
            <button
              type="button"
              onClick={addItem}
              disabled={items.length >= MAX_ITEMS}
              className="text-sm text-primary-600 flex items-center gap-1 hover:text-primary-700 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Plus size={16} />
              옵션 추가
            </button>
          </div>

          <div className="space-y-3">
            {items.map((item, idx) => (
              <div key={idx} className="flex gap-2 items-end flex-wrap">
                {optionNames.map((axisName, axisIdx) => (
                  <div key={axisIdx} className="flex-1 min-w-[120px]">
                    <label className="block text-xs text-gray-500 mb-1">
                      {axisName.trim() || `옵션값 ${axisIdx + 1}`}
                    </label>
                    <input
                      className="input-field"
                      value={item.values[axisIdx] ?? ''}
                      onChange={(e) => updateItemValue(idx, axisIdx, e.target.value)}
                      placeholder={axisName.trim() || '옵션값'}
                    />
                  </div>
                ))}
                <div className="w-28">
                  <label className="block text-xs text-gray-500 mb-1">가격</label>
                  <input
                    type="number"
                    className="input-field"
                    value={item.price}
                    onChange={(e) => updateItemField(idx, 'price', e.target.value)}
                    min={100}
                    required
                  />
                </div>
                <div className="w-24">
                  <label className="block text-xs text-gray-500 mb-1">재고</label>
                  <input
                    type="number"
                    className="input-field"
                    value={item.stock}
                    onChange={(e) => updateItemField(idx, 'stock', e.target.value)}
                    min={0}
                    required
                  />
                </div>
                {items.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeItem(idx)}
                    className="p-2.5 text-red-500 hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => navigate('/seller/products')}
            className="btn-secondary flex-1"
          >
            취소
          </button>
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="btn-primary flex-1"
          >
            {createMutation.isPending ? '등록 중...' : '상품 등록'}
          </button>
        </div>
      </form>
    </div>
  );
}
