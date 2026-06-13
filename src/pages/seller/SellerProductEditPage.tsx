import { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, X, ImagePlus } from 'lucide-react';
import toast from 'react-hot-toast';
import { useProductDetailQuery } from '@/hooks/queries/useProductQuery';
import {
  useUpdateProductMutation,
  useAddProductImageMutation,
} from '@/hooks/queries/useSellerQuery';
import { PageSpinner } from '@/components/common/Spinner';
import { EmptyState } from '@/components/common/EmptyState';
import { parseId } from '@/utils/parseId';

const MAX_TAGS = 10;
const MAX_NEW_IMAGES = 10;

export default function SellerProductEditPage() {
  const { id } = useParams<{ id: string }>();
  const productId = parseId(id);
  const navigate = useNavigate();

  const { data: product, isLoading, isError } = useProductDetailQuery(productId);
  const updateMutation = useUpdateProductMutation();
  const addImageMutation = useAddProductImageMutation();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [newImages, setNewImages] = useState<File[]>([]);
  const [initialized, setInitialized] = useState(false);

  // 상세 로드 시 1회 prefill
  useEffect(() => {
    if (product && !initialized) {
      setName(product.name);
      setDescription(product.description);
      setTags(product.tags ?? []);
      setInitialized(true);
    }
  }, [product, initialized]);

  if (productId === null || isError) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <EmptyState title="상품을 찾을 수 없습니다" />
      </div>
    );
  }
  if (isLoading || !product) return <PageSpinner />;

  const addTag = () => {
    const t = tagInput.trim();
    if (!t) return;
    if (tags.length >= MAX_TAGS) {
      toast.error(`태그는 최대 ${MAX_TAGS}개까지 가능합니다.`);
      return;
    }
    if (!tags.includes(t)) setTags([...tags, t]);
    setTagInput('');
  };
  const removeTag = (t: string) => setTags(tags.filter((x) => x !== t));

  const onPickImages = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    setNewImages((prev) => [...prev, ...files].slice(0, MAX_NEW_IMAGES));
    e.target.value = '';
  };
  const removeNewImage = (idx: number) => setNewImages(newImages.filter((_, i) => i !== idx));

  const uploadImages = () => {
    if (!productId || newImages.length === 0) return;
    addImageMutation.mutate(
      { productId, images: newImages },
      { onSuccess: () => setNewImages([]) }
    );
  };

  const handleSave = (e: FormEvent) => {
    e.preventDefault();
    if (!productId) return;
    if (!name.trim()) {
      toast.error('상품명을 입력해주세요.');
      return;
    }
    if (!description.trim()) {
      toast.error('상품 설명을 입력해주세요.');
      return;
    }
    updateMutation.mutate(
      { productId, data: { name: name.trim(), description: description.trim(), tags } },
      { onSuccess: () => navigate('/seller/products') }
    );
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">상품 수정</h1>

      <form onSubmit={handleSave} className="space-y-6">
        {/* 기본 정보 */}
        <section className="card p-6 space-y-4">
          <h2 className="text-lg font-semibold">기본 정보</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">상품명</label>
            <input
              className="input-field"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={200}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">상품 설명</label>
            <textarea
              className="input-field"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
            />
          </div>
        </section>

        {/* 태그 */}
        <section className="card p-6 space-y-3">
          <h2 className="text-lg font-semibold">
            태그 <span className="text-xs text-gray-400">(최대 {MAX_TAGS}개)</span>
          </h2>
          <div className="flex gap-2">
            <input
              className="input-field flex-1"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addTag();
                }
              }}
              placeholder="태그 입력 후 Enter"
              maxLength={30}
            />
            <button type="button" onClick={addTag} className="btn-secondary flex items-center gap-1">
              <Plus size={16} />
              추가
            </button>
          </div>
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {tags.map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 rounded-full text-sm text-gray-700"
                >
                  #{t}
                  <button type="button" onClick={() => removeTag(t)} className="text-gray-400 hover:text-gray-600">
                    <X size={13} />
                  </button>
                </span>
              ))}
            </div>
          )}
        </section>

        {/* 이미지 */}
        <section className="card p-6 space-y-4">
          <h2 className="text-lg font-semibold">상품 이미지</h2>

          {/* 기존 이미지 (보기 전용 — 삭제/대표변경은 백엔드 미지원) */}
          {product.imageUrls.length > 0 && (
            <div>
              <p className="text-xs text-gray-500 mb-2">현재 이미지</p>
              <div className="flex flex-wrap gap-3">
                {product.imageUrls.map((url, idx) => (
                  <img
                    key={idx}
                    src={url}
                    alt={`상품 이미지 ${idx + 1}`}
                    className="w-20 h-20 object-cover rounded-lg border border-gray-200"
                  />
                ))}
              </div>
            </div>
          )}

          {/* 이미지 추가 */}
          <div>
            <p className="text-xs text-gray-500 mb-2">이미지 추가</p>
            <div className="flex flex-wrap items-center gap-2">
              {newImages.map((img, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-gray-50 border border-gray-200 rounded text-xs text-gray-600 max-w-[160px]"
                >
                  <span className="truncate">{img.name}</span>
                  <button type="button" onClick={() => removeNewImage(idx)} className="text-gray-400 hover:text-gray-600 shrink-0">
                    <X size={12} />
                  </button>
                </span>
              ))}
              {newImages.length < MAX_NEW_IMAGES && (
                <label className="inline-flex items-center gap-1 px-3 py-1.5 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-500 cursor-pointer hover:border-primary-400">
                  <ImagePlus size={16} />
                  파일 선택
                  <input type="file" accept="image/*" multiple onChange={onPickImages} className="hidden" />
                </label>
              )}
            </div>
            {newImages.length > 0 && (
              <button
                type="button"
                onClick={uploadImages}
                disabled={addImageMutation.isPending}
                className="btn-secondary text-sm mt-3"
              >
                {addImageMutation.isPending ? '업로드 중...' : `이미지 ${newImages.length}장 추가`}
              </button>
            )}
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
          <button type="submit" disabled={updateMutation.isPending} className="btn-primary flex-1">
            {updateMutation.isPending ? '저장 중...' : '저장'}
          </button>
        </div>
      </form>
    </div>
  );
}
