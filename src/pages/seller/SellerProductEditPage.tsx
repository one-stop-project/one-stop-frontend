import { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { X, ImagePlus, Star, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  useSellerProductDetailQuery,
  useUpdateProductMutation,
  useAddProductImageMutation,
  useDeleteProductImageMutation,
  useSetThumbnailMutation,
} from '@/hooks/queries/useSellerQuery';
import { useCategoriesQuery } from '@/hooks/queries/useProductQuery';
import { PageSpinner } from '@/components/common/Spinner';
import { EmptyState } from '@/components/common/EmptyState';
import { TagInput } from '@/components/product/TagInput';
import { CategoryPicker, MAX_CATEGORIES } from '@/components/product/CategoryPicker';
import { parseId } from '@/utils/parseId';

const MAX_NEW_IMAGES = 10;

export default function SellerProductEditPage() {
  const { id } = useParams<{ id: string }>();
  const productId = parseId(id);
  const navigate = useNavigate();

  const { data: product, isLoading, isError } = useSellerProductDetailQuery(productId);
  const { data: categories } = useCategoriesQuery();
  const updateMutation = useUpdateProductMutation();
  const addImageMutation = useAddProductImageMutation();
  const deleteImageMutation = useDeleteProductImageMutation();
  const setThumbnailMutation = useSetThumbnailMutation();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  // 카테고리 수정: 상세 응답은 카테고리 '이름'만 줘서 현재 id를 알 수 없다.
  // 그래서 새로 선택할 때만 교체하고, 비워두면 기존 카테고리를 그대로 둔다.
  const [categoryIds, setCategoryIds] = useState<number[]>([]);
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

  const toggleCategory = (catId: number) =>
    setCategoryIds((prev) =>
      prev.includes(catId)
        ? prev.filter((c) => c !== catId)
        : prev.length < MAX_CATEGORIES
          ? [...prev, catId]
          : prev
    );

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

  // 백엔드가 imageId를 주므로 기존 이미지를 개별 식별해 삭제/대표변경할 수 있다.
  const existingImages = product.images ?? [];

  const handleDeleteImage = (imageId: number) => {
    if (!productId) return;
    // 상품엔 이미지가 최소 1장 필요 — 마지막 1장 삭제는 막는다.
    if (existingImages.length <= 1) {
      toast.error('이미지는 최소 1장이 필요합니다.');
      return;
    }
    if (!window.confirm('이 이미지를 삭제할까요?')) return;
    deleteImageMutation.mutate({ productId, imageId });
  };

  const handleSetThumbnail = (imageId: number) => {
    if (!productId) return;
    setThumbnailMutation.mutate({ productId, imageId });
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
      {
        productId,
        data: {
          name: name.trim(),
          description: description.trim(),
          tags,
          // 새로 선택했을 때만 카테고리 교체(1~3개). 비워두면 보내지 않아 기존 유지.
          categoryIds: categoryIds.length > 0 ? categoryIds : undefined,
        },
      },
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

        {/* 카테고리 */}
        <section className="card p-6 space-y-3">
          <h2 className="text-lg font-semibold">카테고리</h2>
          <p className="text-xs text-gray-500">
            현재 카테고리: {product.categoryNames.length > 0 ? product.categoryNames.join(', ') : '없음'}
          </p>
          <p className="text-xs text-gray-400">
            새로 선택하면 카테고리가 교체됩니다(1~3개). 그대로 두려면 아무것도 선택하지 마세요.
          </p>
          <CategoryPicker
            categories={categories}
            selectedIds={categoryIds}
            onToggle={toggleCategory}
          />
        </section>

        {/* 태그 */}
        <section className="card p-6 space-y-3">
          <h2 className="text-lg font-semibold">
            태그 <span className="text-xs text-gray-400">(최대 10개)</span>
          </h2>
          <TagInput tags={tags} onChange={setTags} />
        </section>

        {/* 이미지 */}
        <section className="card p-6 space-y-4">
          <h2 className="text-lg font-semibold">상품 이미지</h2>

          {/* 기존 이미지 — 백엔드가 imageId를 주므로 개별 삭제·대표 변경 가능 */}
          {existingImages.length > 0 ? (
            <div>
              <p className="text-xs text-gray-500 mb-2">
                현재 이미지 <span className="text-gray-400">(별표 = 대표 이미지)</span>
              </p>
              <div className="flex flex-wrap gap-3">
                {existingImages.map((img) => (
                  <div key={img.imageId} className="relative w-24 h-24">
                    <img
                      src={img.imageUrl}
                      alt="상품 이미지"
                      className={`w-24 h-24 object-cover rounded-lg border ${
                        img.thumbnail
                          ? 'border-primary-500 ring-2 ring-primary-200'
                          : 'border-gray-200'
                      }`}
                    />
                    {img.thumbnail && (
                      <span className="absolute top-1 left-1 px-1.5 py-0.5 bg-primary-600 text-white text-[10px] rounded">
                        대표
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDeleteImage(img.imageId)}
                      disabled={deleteImageMutation.isPending}
                      title="이미지 삭제"
                      className="absolute top-1 right-1 w-6 h-6 flex items-center justify-center bg-black/50 text-white rounded-full hover:bg-black/70 disabled:opacity-50"
                    >
                      <Trash2 size={12} />
                    </button>
                    {!img.thumbnail && (
                      <button
                        type="button"
                        onClick={() => handleSetThumbnail(img.imageId)}
                        disabled={setThumbnailMutation.isPending}
                        className="absolute bottom-1 left-1 right-1 flex items-center justify-center gap-0.5 py-0.5 bg-white/85 text-gray-700 text-[10px] rounded hover:bg-white disabled:opacity-50"
                      >
                        <Star size={10} /> 대표로
                      </button>
                    )}
                  </div>
                ))}
              </div>
              {existingImages.length <= 1 && (
                <p className="text-xs text-gray-400 mt-2">
                  이미지는 최소 1장이 필요해 마지막 1장은 삭제할 수 없습니다.
                </p>
              )}
            </div>
          ) : (
            // 구버전 응답(이미지 id 없음) 대비 — 보기 전용 표시
            product.imageUrls.length > 0 && (
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
            )
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
