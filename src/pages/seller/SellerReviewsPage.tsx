import { useState } from 'react';
import { Star, Image as ImageIcon } from 'lucide-react';
import {
  useSellerReviewsQuery,
  useSellerReviewSummaryQuery,
  useSellerMyStatusQuery,
} from '@/hooks/queries/useSellerQuery';
import { PageSpinner } from '@/components/common/Spinner';
import { EmptyState } from '@/components/common/EmptyState';
import { SellerReviewResponse } from '@/domains/seller/sellerApi';
import { formatDateTime } from '@/utils/format';

export default function SellerReviewsPage() {
  const [page, setPage] = useState(0);
  // 승인 전(대기/반려/정지) 판매자는 리뷰 조회 권한이 없어 403이 난다 — 승인된 경우에만 호출한다.
  const { data: myStatus } = useSellerMyStatusQuery();
  const approved = myStatus?.sellerStatus === 'APPROVED';
  const { data: summary } = useSellerReviewSummaryQuery(approved);
  const { data, isLoading } = useSellerReviewsQuery(page, 20, approved);

  if (myStatus && !approved) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">리뷰 관리</h1>
        <EmptyState
          title="아직 이용할 수 없습니다"
          description="판매자 승인이 완료되면 리뷰를 확인할 수 있습니다."
        />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">리뷰 관리</h1>

      {/* 평점 요약 */}
      {summary && summary.reviewCount > 0 && (
        <section className="card p-6 mb-6 flex flex-col sm:flex-row gap-8">
          <div className="flex flex-col items-center justify-center sm:w-40 shrink-0">
            <p className="text-4xl font-bold text-gray-900">
              {summary.averageRating.toFixed(1)}
            </p>
            <StarRating rating={Math.round(summary.averageRating)} />
            <p className="text-sm text-gray-500 mt-1">
              리뷰 {summary.reviewCount.toLocaleString()}개
            </p>
          </div>
          <div className="flex-1 space-y-1.5">
            {([5, 4, 3, 2, 1] as const).map((star) => {
              const count = summary[`rating${star}Count` as const];
              const ratio = summary.reviewCount > 0 ? (count / summary.reviewCount) * 100 : 0;
              return (
                <div key={star} className="flex items-center gap-3 text-sm">
                  <span className="w-8 text-gray-500 shrink-0">{star}점</span>
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-400" style={{ width: `${ratio}%` }} />
                  </div>
                  <span className="w-10 text-right text-gray-500 shrink-0">
                    {count.toLocaleString()}
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {isLoading ? (
        <PageSpinner />
      ) : !data || data.content.length === 0 ? (
        <EmptyState title="아직 등록된 리뷰가 없습니다" description="구매자가 리뷰를 남기면 여기에 표시됩니다." />
      ) : (
        <div className="space-y-4">
          {data.content.map((r) => (
            <ReviewCard key={r.reviewId} review={r} />
          ))}
        </div>
      )}

      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="btn-secondary text-sm"
          >
            이전
          </button>
          <span className="text-sm text-gray-600">
            {page + 1} / {data.totalPages}
          </span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={!data.hasNext}
            className="btn-secondary text-sm"
          >
            다음
          </button>
        </div>
      )}
    </div>
  );
}

function ReviewCard({ review }: { review: SellerReviewResponse }) {
  return (
    <div className="card p-6">
      <div className="flex items-center gap-3 mb-3">
        {review.thumbnailUrl ? (
          <img
            src={review.thumbnailUrl}
            alt={review.productName}
            onError={(e) => (e.currentTarget.style.visibility = 'hidden')}
            className="w-12 h-12 rounded object-cover shrink-0 bg-gray-100"
          />
        ) : (
          <div className="w-12 h-12 bg-gray-100 rounded shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">{review.productName}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <StarRating rating={review.rating} size={14} />
            <span className="text-xs text-gray-400">{review.buyerName}</span>
          </div>
        </div>
        <span className="text-xs text-gray-400 shrink-0">{formatDateTime(review.createdAt)}</span>
      </div>

      <p className="text-sm text-gray-700 whitespace-pre-wrap break-words">{review.content}</p>

      {review.imageCount > 0 && (
        <p className="flex items-center gap-1 text-xs text-gray-400 mt-2">
          <ImageIcon size={13} />
          사진 {review.imageCount}장
        </p>
      )}
    </div>
  );
}

function StarRating({ rating, size = 16 }: { rating: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          size={size}
          className={n <= rating ? 'text-amber-400' : 'text-gray-200'}
          fill={n <= rating ? 'currentColor' : 'none'}
        />
      ))}
    </div>
  );
}
