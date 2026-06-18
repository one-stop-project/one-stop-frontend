import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Star, Pencil, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  useReviewableQuery,
  useMyReviewsQuery,
  useCreateReviewMutation,
  useUpdateReviewMutation,
  useDeleteReviewMutation,
} from '@/hooks/queries/useReviewQuery';
import { Review, ReviewableOrderItem } from '@/domains/review/reviewApi';
import { PageSpinner } from '@/components/common/Spinner';
import { EmptyState } from '@/components/common/EmptyState';
import { formatDate } from '@/utils/format';

export default function ReviewsPage() {
  const { data: reviewable, isLoading: loadingReviewable } = useReviewableQuery();
  const { data: myReviews, isLoading: loadingMine } = useMyReviewsQuery();

  if (loadingReviewable || loadingMine) return <PageSpinner />;

  const mine = myReviews?.content ?? [];

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">리뷰 관리</h1>

      {/* 작성 가능한 리뷰 */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3">작성 가능한 리뷰</h2>
        {!reviewable || reviewable.length === 0 ? (
          <EmptyState title="작성할 수 있는 리뷰가 없습니다" description="배송 완료된 상품에 리뷰를 남길 수 있어요." />
        ) : (
          <div className="space-y-3">
            {reviewable.map((item) => (
              <ReviewableItem key={item.orderItemId} item={item} />
            ))}
          </div>
        )}
      </section>

      {/* 내가 쓴 리뷰 */}
      <section>
        <h2 className="text-lg font-semibold mb-3">내가 쓴 리뷰</h2>
        {mine.length === 0 ? (
          <EmptyState title="작성한 리뷰가 없습니다" />
        ) : (
          <div className="space-y-3">
            {mine.map((review) => (
              <MyReviewItem key={review.reviewId} review={review} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

// 별점 입력
function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button" onClick={() => onChange(n)} aria-label={`${n}점`}>
          <Star
            size={22}
            className={n <= value ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}
          />
        </button>
      ))}
    </div>
  );
}

function validateReview(rating: number, content: string): boolean {
  if (rating < 1 || rating > 5) {
    toast.error('별점을 선택해주세요.');
    return false;
  }
  if (content.trim().length < 10 || content.trim().length > 1000) {
    toast.error('리뷰 내용은 10자 이상 1000자 이하여야 합니다.');
    return false;
  }
  return true;
}

function ReviewableItem({ item }: { item: ReviewableOrderItem }) {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [content, setContent] = useState('');
  const createMutation = useCreateReviewMutation();

  const submit = () => {
    if (!validateReview(rating, content)) return;
    createMutation.mutate(
      { orderItemId: item.orderItemId, rating, content: content.trim() },
      {
        onSuccess: () => {
          setOpen(false);
          setRating(0);
          setContent('');
        },
      }
    );
  };

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between">
        <div className="min-w-0">
          <Link to={`/products/${item.productId}`} className="text-sm font-medium hover:underline">
            {item.productName}
          </Link>
          <p className="text-xs text-gray-500">
            {item.optionName} · 배송완료 {formatDate(item.deliveredAt)}
          </p>
        </div>
        {!open && (
          <button type="button" onClick={() => setOpen(true)} className="btn-primary text-sm shrink-0">
            리뷰 쓰기
          </button>
        )}
      </div>

      {open && (
        <div className="mt-3 border-t border-gray-100 pt-3 space-y-2">
          <StarRating value={rating} onChange={setRating} />
          <textarea
            className="input-field"
            rows={3}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="상품은 어떠셨나요? (10~1000자)"
            maxLength={1000}
          />
          <div className="flex gap-2">
            <button type="button" onClick={() => setOpen(false)} className="btn-secondary text-sm flex-1">
              취소
            </button>
            <button
              type="button"
              onClick={submit}
              disabled={createMutation.isPending}
              className="btn-primary text-sm flex-1"
            >
              {createMutation.isPending ? '등록 중...' : '등록'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function MyReviewItem({ review }: { review: Review }) {
  const [editing, setEditing] = useState(false);
  const [rating, setRating] = useState(review.rating);
  const [content, setContent] = useState(review.content);
  const updateMutation = useUpdateReviewMutation();
  const deleteMutation = useDeleteReviewMutation();

  const submit = () => {
    if (!validateReview(rating, content)) return;
    updateMutation.mutate(
      {
        reviewId: review.reviewId,
        // retainedImageUrls는 @NotNull — 이미지 편집 UI는 없으므로 기존 이미지 전부 유지
        data: { rating, content: content.trim(), retainedImageUrls: review.images ?? [] },
      },
      { onSuccess: () => setEditing(false) }
    );
  };

  const handleDelete = () => {
    if (!confirm('이 리뷰를 삭제하시겠습니까?')) return;
    deleteMutation.mutate(review.reviewId);
  };

  return (
    <div className="card p-4">
      {editing ? (
        <div className="space-y-2">
          <StarRating value={rating} onChange={setRating} />
          <textarea
            className="input-field"
            rows={3}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            maxLength={1000}
          />
          <div className="flex gap-2">
            <button type="button" onClick={() => setEditing(false)} className="btn-secondary text-sm flex-1">
              취소
            </button>
            <button
              type="button"
              onClick={submit}
              disabled={updateMutation.isPending}
              className="btn-primary text-sm flex-1"
            >
              {updateMutation.isPending ? '저장 중...' : '저장'}
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((n) => (
                  <Star
                    key={n}
                    size={15}
                    className={n <= review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}
                  />
                ))}
              </div>
              <Link to={`/products/${review.productId}`} className="text-xs text-gray-500 hover:underline">
                상품 보기
              </Link>
            </div>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setEditing(true)} className="text-gray-400 hover:text-gray-600" title="수정">
                <Pencil size={15} />
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
                className="text-red-400 hover:text-red-600"
                title="삭제"
              >
                <Trash2 size={15} />
              </button>
            </div>
          </div>
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{review.content}</p>
          <p className="text-xs text-gray-400 mt-1">{formatDate(review.createdAt)}</p>
        </>
      )}
    </div>
  );
}
