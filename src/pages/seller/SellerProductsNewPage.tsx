import { useState, useMemo, useEffect, FormEvent, ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, ImagePlus, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useCreateProductMutation } from '@/hooks/queries/useSellerQuery';
import { useCategoriesQuery } from '@/hooks/queries/useProductQuery';
import { TagInput } from '@/components/product/TagInput';
import { CategoryPicker, MAX_CATEGORIES } from '@/components/product/CategoryPicker';

interface ItemForm {
  optionValue: string;
  price: string;
  stock: string;
}

const MAX_IMAGES = 10;
const MAX_ITEMS = 5;

export default function SellerProductsNewPage() {
  const navigate = useNavigate();
  const { data: categories } = useCategoriesQuery();
  const createMutation = useCreateProductMutation();

  const [form, setForm] = useState({ name: '', description: '' });
  const [categoryIds, setCategoryIds] = useState<number[]>([]);
  const [images, setImages] = useState<File[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [items, setItems] = useState<ItemForm[]>([{ optionValue: '', price: '', stock: '' }]);

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

  const addItem = () => {
    if (items.length >= MAX_ITEMS) return;
    setItems([...items, { optionValue: '', price: '', stock: '' }]);
  };
  const removeItem = (idx: number) => setItems(items.filter((_, i) => i !== idx));
  const updateItem = (idx: number, field: keyof ItemForm, value: string) =>
    setItems(items.map((item, i) => (i === idx ? { ...item, [field]: value } : item)));

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
    }
    // 옵션이 2개 이상이면 옵션값이 비거나 중복되면 안 된다(같은 상품 내 옵션 구분 불가).
    if (items.length > 1) {
      const optionValues = items.map((i) => i.optionValue.trim());
      if (optionValues.some((v) => v === '')) {
        toast.error('옵션이 2개 이상이면 각 옵션의 옵션값을 입력해주세요.');
        return;
      }
      if (new Set(optionValues).size !== optionValues.length) {
        toast.error('옵션값이 서로 중복됩니다. 다른 값으로 입력해주세요.');
        return;
      }
    }
    createMutation.mutate(
      {
        data: {
          name: form.name,
          description: form.description,
          categoryIds,
          tags: tags.length > 0 ? tags : undefined,
          items: items.map((i) => ({
            optionValue1: i.optionValue || undefined,
            price: Number(i.price),
            stock: Number(i.stock),
          })),
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
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">옵션 및 재고</h2>
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
              <div key={idx} className="flex gap-2 items-end">
                <div className="flex-1">
                  <label className="block text-xs text-gray-500 mb-1">옵션값</label>
                  <input
                    className="input-field"
                    value={item.optionValue}
                    onChange={(e) => updateItem(idx, 'optionValue', e.target.value)}
                    placeholder="예: 빨강 / M (선택)"
                  />
                </div>
                <div className="w-28">
                  <label className="block text-xs text-gray-500 mb-1">가격</label>
                  <input
                    type="number"
                    className="input-field"
                    value={item.price}
                    onChange={(e) => updateItem(idx, 'price', e.target.value)}
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
                    onChange={(e) => updateItem(idx, 'stock', e.target.value)}
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
