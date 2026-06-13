import { useState } from 'react';
import { Plus, Pencil, Trash2, Check, X } from 'lucide-react';
import { useCategoriesQuery } from '@/hooks/queries/useProductQuery';
import {
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
} from '@/hooks/queries/useCategoryQuery';
import { Category } from '@/domains/product/productApi';
import { PageSpinner } from '@/components/common/Spinner';
import { EmptyState } from '@/components/common/EmptyState';

export default function AdminCategoriesPage() {
  const { data: categories, isLoading } = useCategoriesQuery();
  const createMutation = useCreateCategoryMutation();
  const [rootName, setRootName] = useState('');

  if (isLoading) return <PageSpinner />;

  const addRoot = () => {
    const name = rootName.trim();
    if (!name) return;
    createMutation.mutate({ name, parentId: null }, { onSuccess: () => setRootName('') });
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">카테고리 관리</h1>

      {/* 대분류 추가 */}
      <div className="card p-4 mb-6 flex gap-2">
        <input
          className="input-field flex-1"
          value={rootName}
          onChange={(e) => setRootName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addRoot();
            }
          }}
          placeholder="새 대분류 카테고리 이름 (최대 50자)"
          maxLength={50}
        />
        <button
          type="button"
          onClick={addRoot}
          disabled={createMutation.isPending}
          className="btn-primary flex items-center gap-1 whitespace-nowrap"
        >
          <Plus size={16} />
          추가
        </button>
      </div>

      {!categories || categories.length === 0 ? (
        <EmptyState title="카테고리가 없습니다" />
      ) : (
        <div className="space-y-2">
          {categories.map((cat) => (
            <CategoryNode key={cat.id} category={cat} depth={0} />
          ))}
        </div>
      )}
    </div>
  );
}

function CategoryNode({ category, depth }: { category: Category; depth: number }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(category.name);
  const [addingChild, setAddingChild] = useState(false);
  const [childName, setChildName] = useState('');

  const updateMutation = useUpdateCategoryMutation();
  const deleteMutation = useDeleteCategoryMutation();
  const createMutation = useCreateCategoryMutation();

  const saveName = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    updateMutation.mutate(
      { categoryId: category.id, data: { name: trimmed } },
      { onSuccess: () => setEditing(false) }
    );
  };

  const addChild = () => {
    const trimmed = childName.trim();
    if (!trimmed) return;
    createMutation.mutate(
      { name: trimmed, parentId: category.id },
      {
        onSuccess: () => {
          setChildName('');
          setAddingChild(false);
        },
      }
    );
  };

  const handleDelete = () => {
    if (!confirm(`'${category.name}' 카테고리를 삭제하시겠습니까?`)) return;
    deleteMutation.mutate(category.id);
  };

  return (
    <div>
      <div
        className="card p-3 flex items-center gap-2"
        style={{ marginLeft: depth * 20 }}
      >
        {editing ? (
          <>
            <input
              className="input-field flex-1"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={50}
            />
            <button type="button" onClick={saveName} className="p-1.5 text-green-600 hover:bg-green-50 rounded" title="저장">
              <Check size={16} />
            </button>
            <button
              type="button"
              onClick={() => {
                setName(category.name);
                setEditing(false);
              }}
              className="p-1.5 text-gray-500 hover:bg-gray-50 rounded"
              title="취소"
            >
              <X size={16} />
            </button>
          </>
        ) : (
          <>
            <span className="flex-1 text-sm font-medium">{category.name}</span>
            <button type="button" onClick={() => setAddingChild((v) => !v)} className="p-1.5 text-primary-600 hover:bg-primary-50 rounded" title="하위 추가">
              <Plus size={16} />
            </button>
            <button type="button" onClick={() => setEditing(true)} className="p-1.5 text-gray-500 hover:bg-gray-100 rounded" title="이름 수정">
              <Pencil size={15} />
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="p-1.5 text-red-500 hover:bg-red-50 rounded"
              title="삭제"
            >
              <Trash2 size={15} />
            </button>
          </>
        )}
      </div>

      {addingChild && (
        <div className="flex gap-2 mt-2" style={{ marginLeft: (depth + 1) * 20 }}>
          <input
            className="input-field flex-1"
            value={childName}
            onChange={(e) => setChildName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addChild();
              }
            }}
            placeholder={`'${category.name}' 하위 카테고리 이름`}
            maxLength={50}
          />
          <button type="button" onClick={addChild} disabled={createMutation.isPending} className="btn-primary text-sm whitespace-nowrap">
            추가
          </button>
        </div>
      )}

      {category.children && category.children.length > 0 && (
        <div className="space-y-2 mt-2">
          {category.children.map((child) => (
            <CategoryNode key={child.id} category={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}
