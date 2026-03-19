"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, LogIn, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const STORAGE_KEY = "jys_remember";

interface Factory {
  FactoryCode: string;
  FactoryName: string;
}

export default function LoginPage() {
  const router = useRouter();
  const [factories, setFactories] = useState<Factory[]>([]);
  const [selectedFactory, setSelectedFactory] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [factoriesLoaded, setFactoriesLoaded] = useState(false);
  const [factoryLoadError, setFactoryLoadError] = useState(false);

  // 공장 목록 로드
  useEffect(() => {
    fetch("/api/factories")
      .then((r) => r.json())
      .then((data) => {
        if (data.ok && data.factories.length > 0) {
          setFactories(data.factories);
          setSelectedFactory(data.factories[0].FactoryCode);
        }
      })
      .catch(() => setFactoryLoadError(true))
      .finally(() => setFactoriesLoaded(true));
  }, []);

  // 저장된 로그인 정보 불러오기
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) return;
      const { u, p } = JSON.parse(atob(saved));
      if (u) setUsername(u);
      if (p) setPassword(p);
      setRemember(true);
    } catch {
      // 잘못된 데이터는 무시
    }
  }, []);

  const isAdmin = username.trim().toLowerCase() === (process.env.NEXT_PUBLIC_ADMIN_USERNAME ?? "admin");
  const showFactory = factoriesLoaded;
  // admin이면 "관리자" 고정 옵션, 일반 사용자는 실제 공장 목록
  const factoryOptions = isAdmin
    ? [{ FactoryCode: "", FactoryName: "관리자" }]
    : factories;
  const needsFactory = !isAdmin && factories.length > 0;

  // admin ↔ 일반 전환 시 selectedFactory 동기화
  useEffect(() => {
    if (isAdmin) {
      setSelectedFactory("");
    } else if (factories.length > 0) {
      setSelectedFactory(factories[0].FactoryCode);
    }
  }, [isAdmin]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) return;
    if (needsFactory && !selectedFactory) return;

    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username.trim(),
          password,
          factory: needsFactory ? selectedFactory : undefined,
        }),
      });

      let data: { ok: boolean; message?: string; isAdmin?: boolean };
      try {
        data = await res.json();
      } catch {
        setError("서버 응답을 처리할 수 없습니다. 잠시 후 다시 시도해 주세요.");
        return;
      }

      if (!data.ok) {
        if (res.status === 401) {
          setError("아이디 또는 비밀번호가 올바르지 않습니다.");
        } else if (res.status === 400) {
          setError(data.message ?? "입력 정보를 확인해 주세요.");
        } else if (res.status >= 500) {
          setError("서버 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.");
        } else {
          setError(data.message ?? "로그인에 실패했습니다.");
        }
        return;
      }

      if (remember) {
        localStorage.setItem(STORAGE_KEY, btoa(JSON.stringify({ u: username.trim(), p: password })));
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }

      if (data.isAdmin) {
        router.push("/admin/users");
      } else {
        router.push("/dashboard");
      }
      router.refresh();
    } catch {
      setError("서버에 연결할 수 없습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* 왼쪽 브랜딩 패널 */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between bg-[hsl(222_47%_18%)] p-12 text-white">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10">
            <Package className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-semibold tracking-tight">
            Procurement Hub
          </span>
        </div>

        <div className="space-y-4">
          <h1 className="text-4xl font-bold leading-tight">
            구매 업무의 모든 것,<br />
            한 곳에서 관리하세요.
          </h1>
          <p className="text-base text-white/60 leading-relaxed">
            품목관리 · 구매처 관리 · 구매오더 · 단가 관리까지<br />
            B2B 구매 프로세스를 통합 관리합니다.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-4 text-center">
          {[
            { label: "품목 관리", value: "마스터 DB" },
            { label: "구매오더", value: "실시간 현황" },
            { label: "단가 관리", value: "이력 추적" },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-xl bg-white/8 border border-white/10 p-4 space-y-1"
            >
              <p className="text-xs text-white/50">{item.label}</p>
              <p className="text-sm font-semibold">{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 오른쪽 로그인 폼 */}
      <div className="flex w-full lg:w-1/2 items-center justify-center bg-[hsl(210_20%_98%)] px-6 py-12">
        <div className="w-full max-w-sm space-y-8">
          {/* 모바일용 로고 */}
          <div className="flex items-center gap-2 lg:hidden">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[hsl(222_47%_18%)]">
              <Package className="h-4 w-4 text-white" />
            </div>
            <span className="text-base font-semibold">Procurement Hub</span>
          </div>

          <div className="space-y-1.5">
            <h2 className="text-2xl font-bold text-[hsl(222_47%_11%)]">로그인</h2>
            <p className="text-sm text-muted-foreground">
              계정 정보를 입력하여 시스템에 접속하세요.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* 공장 선택 — 아이디 위에, admin일 때 숨김 */}
            {showFactory && (
              <div className="space-y-1.5">
                <Label htmlFor="factory" className="text-sm font-medium text-slate-700">
                  공장
                </Label>
                {factoryLoadError ? (
                  <p className="text-xs text-amber-600">
                    공장 목록을 불러오지 못했습니다. 서버 연결을 확인해 주세요.
                  </p>
                ) : (
                  <select
                    id="factory"
                    value={selectedFactory}
                    onChange={(e) => setSelectedFactory(e.target.value)}
                    disabled={loading || isAdmin}
                    className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(222_47%_18%)] focus:border-transparent disabled:opacity-50"
                  >
                    {factoryOptions.map((f) => (
                      <option key={f.FactoryCode} value={f.FactoryCode}>
                        {f.FactoryName}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}

            {/* 아이디 */}
            <div className="space-y-1.5">
              <Label htmlFor="username" className="text-sm font-medium text-slate-700">
                아이디
              </Label>
              <Input
                id="username"
                type="text"
                autoComplete="username"
                placeholder="아이디를 입력하세요"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={loading}
                className="h-10 bg-white border-slate-300 focus-visible:ring-[hsl(222_47%_18%)]"
              />
            </div>

            {/* 비밀번호 */}
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-sm font-medium text-slate-700">
                비밀번호
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPw ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="비밀번호를 입력하세요"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  className="h-10 bg-white border-slate-300 pr-10 focus-visible:ring-[hsl(222_47%_18%)]"
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

            {/* 로그인 정보 기억하기 */}
            <label className="flex cursor-pointer items-center gap-2 select-none">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 accent-[hsl(222_47%_18%)] cursor-pointer"
              />
              <span className="text-sm text-slate-600">로그인 정보 기억하기</span>
            </label>

            {error && (
              <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2.5 text-xs text-red-700">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={loading || !username.trim() || !password}
              className="h-10 w-full bg-[hsl(222_47%_18%)] hover:bg-[hsl(222_47%_24%)] text-white text-sm font-medium"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg>
                  로그인 중...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <LogIn className="h-4 w-4" />
                  로그인
                </span>
              )}
            </Button>
          </form>

          <p className="text-center text-xs text-muted-foreground">
            © 2026 JY Source. Procurement Hub.
          </p>
        </div>
      </div>
    </div>
  );
}
