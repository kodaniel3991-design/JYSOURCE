"use client";

import { useCallback, useEffect, useState } from "react";
import { useCachedState } from "@/lib/hooks/use-cached-state";
import { PageHeader } from "@/components/common/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DateInput } from "@/components/ui/date-input";
import { Label } from "@/components/ui/label";
import { DataGridToolbar } from "@/components/common/data-grid-toolbar";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Plus, Pencil, Trash2, Users, KeyRound, Eye, EyeOff, Mail } from "lucide-react";
import { apiPath } from "@/lib/api-path";

interface UserRow {
  Id: number;
  Username: string;
  UserId: string | null;
  Email: string | null;
  PhoneNo: string | null;
  HireDate: string | null;
  Position: string | null;
  EmployeeNo: string | null;
  FactoryCode: string | null;
  FactoryName: string | null;
  IsActive: boolean;
  CreatedAt: string;
}

interface FactoryOption {
  FactoryCode: string;
  FactoryName: string;
}

interface UserDraft {
  Username: string;
  Password: string;
  FactoryCode: string;
  IsActive: boolean;
  UserId: string;
  Email: string;
  PhoneNo: string;
  HireDate: string;
  Position: string;
  EmployeeNo: string;
}

interface PwDraft {
  newPassword: string;
  confirm: string;
  showNew: boolean;
  showConfirm: boolean;
}

interface MailPwDraft {
  emailPassword: string;
  show: boolean;
}

const EMPTY_DRAFT: UserDraft = {
  Username: "", Password: "", FactoryCode: "", IsActive: true,
  UserId: "", Email: "", PhoneNo: "", HireDate: "", Position: "", EmployeeNo: "",
};
const EMPTY_PW: PwDraft = { newPassword: "", confirm: "", showNew: false, showConfirm: false };
const EMPTY_MAIL_PW: MailPwDraft = { emailPassword: "", show: false };

export default function AdminUsersPage() {
  const [rows, setRows] = useCachedState<UserRow[]>("admin/users/rows", []);
  const [factories, setFactories] = useCachedState<FactoryOption[]>("admin/users/factories", []);
  const [positionOptions, setPositionOptions] = useState<{ value: string; label: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [gridSettingsOpen, setGridSettingsOpen] = useState(false);
  const [gridSettingsTab, setGridSettingsTab] = useState<"export" | "sort" | "columns" | "view">("export");

  // 사용자 등록/수정 시트
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<UserRow | null>(null);
  const [draft, setDraft] = useState<UserDraft>({ ...EMPTY_DRAFT });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPw, setShowPw] = useState(false);

  // 비밀번호 변경 시트
  const [pwSheetOpen, setPwSheetOpen] = useState(false);
  const [pwTarget, setPwTarget] = useState<UserRow | null>(null);
  const [pwDraft, setPwDraft] = useState<PwDraft>({ ...EMPTY_PW });
  const [pwSaving, setPwSaving] = useState(false);
  const [pwError, setPwError] = useState<string | null>(null);

  // 메일 비밀번호 시트
  const [mailPwSheetOpen, setMailPwSheetOpen] = useState(false);
  const [mailPwTarget, setMailPwTarget] = useState<UserRow | null>(null);
  const [mailPwDraft, setMailPwDraft] = useState<MailPwDraft>({ ...EMPTY_MAIL_PW });
  const [mailPwSaving, setMailPwSaving] = useState(false);
  const [mailPwError, setMailPwError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [usersRes, factoriesRes] = await Promise.all([
        fetch(apiPath("/api/admin/users")),
        fetch(apiPath("/api/admin/factories")),
      ]);
      const [ud, fd] = await Promise.all([usersRes.json(), factoriesRes.json()]);
      if (ud.ok) setRows(ud.users);
      if (fd.ok) setFactories(fd.factories);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch(apiPath("/api/common-codes?category=position"))
      .then((r) => r.json())
      .then((data) => {
        if (data.ok && Array.isArray(data.items)) {
          setPositionOptions(data.items.map((c: { Code: string; Name: string }) => ({ value: c.Code, label: c.Name })));
        }
      })
      .catch(() => {});
  }, []);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (rows.length > 0) return; load(); }, []);

  // ── 사용자 등록/수정 ──
  const openCreate = () => {
    setEditTarget(null);
    setDraft({ ...EMPTY_DRAFT, FactoryCode: factories[0]?.FactoryCode ?? "" });
    setError(null);
    setShowPw(false);
    setSheetOpen(true);
  };

  const openEdit = (row: UserRow) => {
    setEditTarget(row);
    setDraft({
      Username:   row.Username,
      Password:   "",
      FactoryCode:row.FactoryCode ?? "",
      IsActive:   row.IsActive,
      UserId:     row.UserId ?? "",
      Email:      row.Email ?? "",
      PhoneNo:    row.PhoneNo ?? "",
      HireDate:   row.HireDate ? row.HireDate.slice(0, 10) : "",
      Position:   row.Position ?? "",
      EmployeeNo: row.EmployeeNo ?? "",
    });
    setError(null);
    setShowPw(false);
    setSheetOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      let res: Response;
      const common = {
        factoryCode: draft.FactoryCode || null,
        isActive:    draft.IsActive,
        userName:    draft.UserId || null,
        email:       draft.Email || null,
        phoneNo:     draft.PhoneNo || null,
        hireDate:    draft.HireDate || null,
        position:    draft.Position || null,
        employeeNo:  draft.EmployeeNo || null,
      };
      if (editTarget) {
        res = await fetch(apiPath(`/api/admin/users/${editTarget.Id}`), {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(common),
        });
      } else {
        res = await fetch(apiPath("/api/admin/users"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: draft.Username, password: draft.Password, ...common }),
        });
      }
      const data = await res.json();
      if (!data.ok) { setError(data.message); return; }
      setSheetOpen(false);
      await load();
    } catch {
      setError("저장 중 오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  };

  // ── 비밀번호 변경 ──
  const openPwChange = (row: UserRow) => {
    setPwTarget(row);
    setPwDraft({ ...EMPTY_PW });
    setPwError(null);
    setPwSheetOpen(true);
  };

  const handlePwSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pwDraft.newPassword !== pwDraft.confirm) {
      setPwError("새 비밀번호와 확인 비밀번호가 일치하지 않습니다.");
      return;
    }
    if (pwDraft.newPassword.length < 4) {
      setPwError("비밀번호는 4자 이상이어야 합니다.");
      return;
    }
    setPwSaving(true);
    setPwError(null);
    try {
      const res = await fetch(apiPath(`/api/admin/users/${pwTarget!.Id}`), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: pwDraft.newPassword }),
      });
      const data = await res.json();
      if (!data.ok) { setPwError(data.message); return; }
      setPwSheetOpen(false);
    } catch {
      setPwError("저장 중 오류가 발생했습니다.");
    } finally {
      setPwSaving(false);
    }
  };

  // ── 메일 비밀번호 변경 ──
  const openMailPwChange = (row: UserRow) => {
    setMailPwTarget(row);
    setMailPwDraft({ ...EMPTY_MAIL_PW });
    setMailPwError(null);
    setMailPwSheetOpen(true);
  };

  const handleMailPwSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setMailPwSaving(true);
    setMailPwError(null);
    try {
      const res = await fetch(apiPath(`/api/admin/users/${mailPwTarget!.Id}`), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailPassword: mailPwDraft.emailPassword }),
      });
      const data = await res.json();
      if (!data.ok) { setMailPwError(data.message); return; }
      setMailPwSheetOpen(false);
    } catch {
      setMailPwError("저장 중 오류가 발생했습니다.");
    } finally {
      setMailPwSaving(false);
    }
  };

  // ── 삭제 ──
  const handleDelete = async (row: UserRow) => {
    if (!confirm(`"${row.Username}" 사용자를 삭제하시겠습니까?`)) return;
    try {
      const res = await fetch(apiPath(`/api/admin/users/${row.Id}`), { method: "DELETE" });
      const data = await res.json();
      if (!data.ok) { alert(data.message); return; }
      await load();
    } catch {
      alert("삭제 중 오류가 발생했습니다.");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="사용자 관리"
        description="시스템 접속 사용자 계정을 관리합니다."
      />

      <div className="flex items-center justify-between">
        <DataGridToolbar
          active={gridSettingsOpen ? gridSettingsTab : undefined}
          onExport={() => { setGridSettingsTab("export"); setGridSettingsOpen(true); }}
        />
        <Button onClick={openCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          사용자 추가
        </Button>
      </div>

      <div className="rounded-lg border bg-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground whitespace-nowrap">아이디</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground whitespace-nowrap">사용자명</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground whitespace-nowrap">사번</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground whitespace-nowrap">직책</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground whitespace-nowrap">전화번호</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground whitespace-nowrap">이메일</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground whitespace-nowrap">입사일자</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground whitespace-nowrap">소속 공장</th>
              <th className="px-4 py-3 text-center font-medium text-muted-foreground w-20 whitespace-nowrap">상태</th>
              <th className="px-4 py-3 w-32 text-right pr-4 font-medium text-muted-foreground text-xs whitespace-nowrap">관리</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={10} className="py-12 text-center text-muted-foreground">
                  불러오는 중...
                </td>
              </tr>
            )}
            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan={10} className="py-12 text-center text-muted-foreground">
                  <Users className="mx-auto mb-2 h-8 w-8 opacity-30" />
                  등록된 사용자가 없습니다.
                </td>
              </tr>
            )}
            {rows.map((row) => (
              <tr key={row.Id} className="border-b last:border-0 hover:bg-muted/30">
                <td className="px-4 py-3 font-medium whitespace-nowrap">{row.Username}</td>
                <td className="px-4 py-3 whitespace-nowrap">{row.UserId ?? <span className="text-xs opacity-40">-</span>}</td>
                <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{row.EmployeeNo ?? <span className="text-xs opacity-40">-</span>}</td>
                <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                  {row.Position
                    ? (positionOptions.find((o) => o.value === row.Position)?.label ?? row.Position)
                    : <span className="text-xs opacity-40">-</span>}
                </td>
                <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{row.PhoneNo ?? <span className="text-xs opacity-40">-</span>}</td>
                <td className="px-4 py-3 text-muted-foreground">{row.Email ?? <span className="text-xs opacity-40">-</span>}</td>
                <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                  {row.HireDate ? new Date(row.HireDate).toLocaleDateString("ko-KR") : <span className="text-xs opacity-40">-</span>}
                </td>
                <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                  {row.FactoryName
                    ? <span>{row.FactoryName} <span className="text-xs opacity-60">({row.FactoryCode})</span></span>
                    : <span className="text-xs opacity-50">미지정</span>}
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                    row.IsActive ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"
                  }`}>
                    {row.IsActive ? "활성" : "비활성"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      title="정보 수정"
                      onClick={() => openEdit(row)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                      title="비밀번호 변경"
                      onClick={() => openPwChange(row)}
                    >
                      <KeyRound className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                      title="메일 비밀번호 설정"
                      onClick={() => openMailPwChange(row)}
                    >
                      <Mail className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive hover:text-destructive"
                      title="삭제"
                      onClick={() => handleDelete(row)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Sheet open={gridSettingsOpen} onOpenChange={setGridSettingsOpen} position="center">
        <SheetContent>
          <SheetHeader>
            <SheetTitle>그리드 설정</SheetTitle>
            <SheetDescription className="text-xs">내보내기 설정</SheetDescription>
          </SheetHeader>
          <div className="mt-4 space-y-5 text-xs">
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="default" onClick={() => setGridSettingsTab("export")}>내보내기</Button>
            </div>
            {gridSettingsTab === "export" && (
              <div className="space-y-3">
                <p className="text-[11px] text-muted-foreground">현재 사용자 목록을 CSV 파일로 다운로드합니다.</p>
                <Button size="sm" disabled={rows.length === 0} onClick={() => {
                  if (rows.length === 0) return;
                  const header = ["아이디", "사용자명", "사번", "직책", "전화번호", "이메일", "입사일자", "소속공장", "상태"];
                  const csvRows = rows.map((r) => [
                    r.Username,
                    r.UserId ?? "",
                    r.EmployeeNo ?? "",
                    r.Position ? (positionOptions.find((o) => o.value === r.Position)?.label ?? r.Position) : "",
                    r.PhoneNo ?? "",
                    r.Email ?? "",
                    r.HireDate ? new Date(r.HireDate).toLocaleDateString("ko-KR") : "",
                    r.FactoryName ? `${r.FactoryName}(${r.FactoryCode})` : "",
                    r.IsActive ? "활성" : "비활성",
                  ]);
                  const csv = [header, ...csvRows].map((row) => row.map((v) => `"${v}"`).join(",")).join("\n");
                  const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url; a.download = "users.csv";
                  document.body.appendChild(a); a.click();
                  document.body.removeChild(a); URL.revokeObjectURL(url);
                }}>CSV 내보내기</Button>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* ── 사용자 등록/수정 시트 ── */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{editTarget ? "사용자 수정" : "사용자 추가"}</SheetTitle>
            {editTarget && (
              <SheetDescription>사용자 정보를 수정합니다.</SheetDescription>
            )}
          </SheetHeader>
          <form onSubmit={handleSave} className="mt-6 space-y-4">

            {/* 계정 정보 */}
            <div className="rounded-md border bg-muted/20 px-4 py-3 space-y-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">계정 정보</p>

              <div className="space-y-1.5">
                <Label>아이디 <span className="text-destructive">*</span></Label>
                <Input
                  value={draft.Username}
                  onChange={(e) => setDraft((d) => ({ ...d, Username: e.target.value }))}
                  placeholder="로그인 아이디"
                  disabled={!!editTarget || saving}
                  maxLength={50}
                  autoComplete="off"
                />
              </div>

              {!editTarget && (
                <div className="space-y-1.5">
                  <Label>비밀번호 <span className="text-destructive">*</span></Label>
                  <div className="relative">
                    <Input
                      type={showPw ? "text" : "password"}
                      value={draft.Password}
                      onChange={(e) => setDraft((d) => ({ ...d, Password: e.target.value }))}
                      placeholder="초기 비밀번호"
                      disabled={saving}
                      maxLength={200}
                      autoComplete="new-password"
                      className="pr-10"
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => setShowPw((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <Label>소속 공장</Label>
                <select
                  value={draft.FactoryCode}
                  onChange={(e) => setDraft((d) => ({ ...d, FactoryCode: e.target.value }))}
                  disabled={saving}
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
                >
                  <option value="">미지정</option>
                  {factories.map((f) => (
                    <option key={f.FactoryCode} value={f.FactoryCode}>
                      {f.FactoryName} ({f.FactoryCode})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="userIsActive"
                  checked={draft.IsActive}
                  onChange={(e) => setDraft((d) => ({ ...d, IsActive: e.target.checked }))}
                  className="h-4 w-4 rounded border-slate-300 accent-primary cursor-pointer"
                  disabled={saving}
                />
                <Label htmlFor="userIsActive" className="cursor-pointer">활성화</Label>
              </div>
            </div>

            {/* 개인 정보 */}
            <div className="rounded-md border bg-muted/20 px-4 py-3 space-y-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">개인 정보</p>

              <div className="space-y-1.5">
                <Label>사용자명</Label>
                <Input
                  value={draft.UserId}
                  onChange={(e) => setDraft((d) => ({ ...d, UserId: e.target.value }))}
                  placeholder="실명"
                  disabled={saving}
                  maxLength={50}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>사번</Label>
                  <Input
                    value={draft.EmployeeNo}
                    onChange={(e) => setDraft((d) => ({ ...d, EmployeeNo: e.target.value }))}
                    placeholder="사번"
                    disabled={saving}
                    maxLength={20}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>직책</Label>
                  <select
                    value={draft.Position}
                    onChange={(e) => setDraft((d) => ({ ...d, Position: e.target.value }))}
                    disabled={saving}
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
                  >
                    <option value="">선택</option>
                    {positionOptions.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>전화번호</Label>
                <Input
                  value={draft.PhoneNo}
                  onChange={(e) => {
                    const digits = e.target.value.replace(/\D/g, "").slice(0, 11);
                    const formatted =
                      digits.length <= 3 ? digits :
                      digits.length <= 7 ? `${digits.slice(0, 3)}-${digits.slice(3)}` :
                      `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
                    setDraft((d) => ({ ...d, PhoneNo: formatted }));
                  }}
                  placeholder="010-0000-0000"
                  disabled={saving}
                  maxLength={13}
                />
              </div>

              <div className="space-y-1.5">
                <Label>이메일</Label>
                <Input
                  type="email"
                  value={draft.Email}
                  onChange={(e) => setDraft((d) => ({ ...d, Email: e.target.value }))}
                  placeholder="user@example.com"
                  disabled={saving}
                  maxLength={100}
                />
              </div>

              <div className="space-y-1.5">
                <Label>입사일자</Label>
                <DateInput
                  value={draft.HireDate}
                  onChange={(e) => setDraft((d) => ({ ...d, HireDate: e.target.value }))}
                  disabled={saving}
                />
              </div>
            </div>

            {error && (
              <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2.5 text-xs text-red-700">
                {error}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" className="flex-1" disabled={saving} onClick={() => setSheetOpen(false)}>
                취소
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={saving || (!editTarget && (!draft.Username.trim() || !draft.Password))}
              >
                {saving ? "저장 중..." : "저장"}
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>

      {/* ── 메일 비밀번호 시트 ── */}
      <Sheet open={mailPwSheetOpen} onOpenChange={setMailPwSheetOpen}>
        <SheetContent className="w-full sm:max-w-sm">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-blue-600" />
              메일 비밀번호 설정
            </SheetTitle>
            {mailPwTarget && (
              <SheetDescription>
                <span className="font-medium text-foreground">{mailPwTarget.Username}</span> 계정의 SMTP 메일 비밀번호를 설정합니다.
              </SheetDescription>
            )}
          </SheetHeader>
          <form onSubmit={handleMailPwSave} className="mt-6 space-y-5">
            <div className="rounded-md border border-blue-100 bg-blue-50/50 px-3 py-2.5 text-xs text-blue-700">
              발주서 이메일 발송 시 사용되는 이메일 계정의 비밀번호입니다.<br />
              비밀번호를 비워두면 이메일 발송이 비활성화됩니다.
            </div>

            <div className="space-y-1.5">
              <Label>메일 비밀번호</Label>
              <div className="relative">
                <Input
                  type={mailPwDraft.show ? "text" : "password"}
                  value={mailPwDraft.emailPassword}
                  onChange={(e) => setMailPwDraft((d) => ({ ...d, emailPassword: e.target.value }))}
                  placeholder="이메일 계정 비밀번호"
                  disabled={mailPwSaving}
                  maxLength={200}
                  autoComplete="new-password"
                  className="pr-10"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setMailPwDraft((d) => ({ ...d, show: !d.show }))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {mailPwDraft.show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {mailPwError && (
              <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2.5 text-xs text-red-700">
                {mailPwError}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" className="flex-1" disabled={mailPwSaving} onClick={() => setMailPwSheetOpen(false)}>
                취소
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-blue-600 hover:bg-blue-700"
                disabled={mailPwSaving}
              >
                {mailPwSaving ? "저장 중..." : "저장"}
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>

      {/* ── 비밀번호 변경 시트 ── */}
      <Sheet open={pwSheetOpen} onOpenChange={setPwSheetOpen}>
        <SheetContent className="w-full sm:max-w-sm">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <KeyRound className="h-4 w-4 text-amber-600" />
              비밀번호 변경
            </SheetTitle>
            {pwTarget && (
              <SheetDescription>
                <span className="font-medium text-foreground">{pwTarget.Username}</span> 계정의 비밀번호를 변경합니다.
              </SheetDescription>
            )}
          </SheetHeader>
          <form onSubmit={handlePwSave} className="mt-6 space-y-5">
            <div className="space-y-1.5">
              <Label>새 비밀번호</Label>
              <div className="relative">
                <Input
                  type={pwDraft.showNew ? "text" : "password"}
                  value={pwDraft.newPassword}
                  onChange={(e) => setPwDraft((d) => ({ ...d, newPassword: e.target.value }))}
                  placeholder="새 비밀번호 입력"
                  disabled={pwSaving}
                  maxLength={200}
                  autoComplete="new-password"
                  className="pr-10"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setPwDraft((d) => ({ ...d, showNew: !d.showNew }))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {pwDraft.showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>비밀번호 확인</Label>
              <div className="relative">
                <Input
                  type={pwDraft.showConfirm ? "text" : "password"}
                  value={pwDraft.confirm}
                  onChange={(e) => setPwDraft((d) => ({ ...d, confirm: e.target.value }))}
                  placeholder="새 비밀번호 재입력"
                  disabled={pwSaving}
                  maxLength={200}
                  autoComplete="new-password"
                  className={`pr-10 ${
                    pwDraft.confirm && pwDraft.newPassword !== pwDraft.confirm
                      ? "border-red-400 focus-visible:ring-red-400"
                      : ""
                  }`}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setPwDraft((d) => ({ ...d, showConfirm: !d.showConfirm }))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {pwDraft.showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {pwDraft.confirm && pwDraft.newPassword !== pwDraft.confirm && (
                <p className="text-xs text-red-500">비밀번호가 일치하지 않습니다.</p>
              )}
            </div>

            {pwError && (
              <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2.5 text-xs text-red-700">
                {pwError}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" className="flex-1" disabled={pwSaving} onClick={() => setPwSheetOpen(false)}>
                취소
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-amber-600 hover:bg-amber-700"
                disabled={pwSaving || !pwDraft.newPassword || pwDraft.newPassword !== pwDraft.confirm}
              >
                {pwSaving ? "변경 중..." : "변경"}
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
