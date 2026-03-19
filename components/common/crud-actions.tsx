"use client";

import { PrimaryActionButton } from "@/components/common/action-buttons";
import { Plus, Pencil, Trash2 } from "lucide-react";

const iconClass = "mr-1.5 h-4 w-4";

export interface CrudActionsProps {
  /** 등록 버튼 클릭 시 (미제공 시 버튼 비표시) */
  onRegister?: () => void;
  /** 수정 버튼 클릭 시 (미제공 시 버튼 비표시) */
  onEdit?: () => void;
  /** 삭제 버튼 클릭 시 (미제공 시 버튼 비표시) */
  onDelete?: () => void;
  /** 등록 버튼 비활성화 */
  registerDisabled?: boolean;
  /** 수정 버튼 비활성화 */
  editDisabled?: boolean;
  /** 삭제 버튼 비활성화 */
  deleteDisabled?: boolean;
  /** 버튼 size (기본 sm) */
  size?: "sm" | "default" | "lg";
  /** 추가 클래스 (컨테이너용, 예: gap이 필요할 때 flex gap-2 등) */
  className?: string;
}

/**
 * 목록/마스터 화면 공통 액션: 등록, 수정, 삭제 버튼.
 * 콜백을 넘긴 항목만 렌더링되며, 메뉴 트리와 동일한 아이콘(Plus, Pencil, Trash2)을 사용합니다.
 */
export function CrudActions({
  onRegister,
  onEdit,
  onDelete,
  registerDisabled = false,
  editDisabled = false,
  deleteDisabled = false,
  size = "sm",
  className,
}: CrudActionsProps) {
  const hasAny =
    onRegister !== undefined || onEdit !== undefined || onDelete !== undefined;
  if (!hasAny) return null;

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className ?? ""}`}>
      {onRegister !== undefined && (
        <PrimaryActionButton
          size={size}
          onClick={onRegister}
          disabled={registerDisabled}
        >
          <Plus className={iconClass} />
          등록
        </PrimaryActionButton>
      )}
      {onEdit !== undefined && (
        <PrimaryActionButton
          size={size}
          onClick={onEdit}
          disabled={editDisabled}
        >
          <Pencil className={iconClass} />
          수정
        </PrimaryActionButton>
      )}
      {onDelete !== undefined && (
        <PrimaryActionButton
          size={size}
          onClick={onDelete}
          disabled={deleteDisabled}
        >
          <Trash2 className={iconClass} />
          삭제
        </PrimaryActionButton>
      )}
    </div>
  );
}
