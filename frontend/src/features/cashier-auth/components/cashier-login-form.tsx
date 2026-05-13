import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "@tanstack/react-router";
import { Delete } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCashierLogin } from "@/features/cashier-auth/hooks";
import { ApiError } from "@/lib/api";

const schema = z.object({
  store_code: z
    .string()
    .regex(/^[A-Z0-9]{3,10}$/, "Kode toko harus 3–10 huruf/angka"),
  pin: z.string().regex(/^\d{6}$/, "PIN harus 6 digit"),
});

type FormValues = z.infer<typeof schema>;

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];

export function CashierLoginForm() {
  const navigate = useNavigate();
  const login = useCashierLogin();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    setError,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { store_code: "", pin: "" },
  });

  const pin = watch("pin");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (document.activeElement?.id === "cashier-store-code") return;
      if (/^\d$/.test(e.key)) {
        appendDigit(e.key);
      } else if (e.key === "Backspace") {
        backspace();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pin]);

  const appendDigit = (d: string) => {
    if (pin.length >= 6) return;
    setValue("pin", pin + d, { shouldValidate: false });
  };

  const backspace = () => {
    if (pin.length === 0) return;
    setValue("pin", pin.slice(0, -1), { shouldValidate: false });
  };

  const clear = () => setValue("pin", "", { shouldValidate: false });

  const onSubmit = (values: FormValues) => {
    login.mutate(
      { store_code: values.store_code.toUpperCase(), pin: values.pin },
      {
        onSuccess: () => {
          toast.success("Selamat datang");
          navigate({ to: "/cashier/home" });
        },
        onError: (err) => {
          clear();
          if (err instanceof ApiError) {
            setError("pin", { message: err.message });
            toast.error(err.message);
          } else {
            toast.error(err instanceof Error ? err.message : "Login gagal");
          }
        },
      }
    );
  };

  return (
    <div className="mx-auto w-full max-w-sm">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-semibold text-slate-900">Masuk Kasir</h1>
        <p className="mt-1 text-sm text-slate-600">
          Masukkan kode toko + PIN 6 digit
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div>
          <Label htmlFor="cashier-store-code">Kode toko</Label>
          <Input
            id="cashier-store-code"
            autoFocus
            className="mt-1 font-mono uppercase"
            placeholder="cth. JKT01"
            maxLength={10}
            {...register("store_code", {
              onChange: (e) => {
                const upper = e.target.value.toUpperCase();
                if (upper !== e.target.value) {
                  setValue("store_code", upper, { shouldValidate: true });
                }
              },
            })}
          />
          {errors.store_code && (
            <p className="mt-1 text-xs text-red-600">
              {errors.store_code.message}
            </p>
          )}
        </div>

        <div>
          <Label>PIN</Label>
          <PinDots value={pin} />
          {errors.pin && (
            <p className="mt-1 text-center text-xs text-red-600">
              {errors.pin.message}
            </p>
          )}
        </div>

        <input type="hidden" {...register("pin")} />

        <div className="grid grid-cols-3 gap-2">
          {KEYS.map((k) => (
            <KeyButton key={k} onClick={() => appendDigit(k)}>
              {k}
            </KeyButton>
          ))}
          <KeyButton onClick={clear} variant="outline" aria-label="Bersihkan">
            C
          </KeyButton>
          <KeyButton onClick={() => appendDigit("0")}>0</KeyButton>
          <KeyButton
            onClick={backspace}
            variant="outline"
            aria-label="Hapus satu digit"
          >
            <Delete className="h-6 w-6" />
          </KeyButton>
        </div>

        <Button
          type="submit"
          className="h-12 w-full text-base"
          disabled={login.isPending || pin.length !== 6}
        >
          {login.isPending ? "Memeriksa…" : "Masuk"}
        </Button>
      </form>
    </div>
  );
}

function PinDots({ value }: { value: string }) {
  return (
    <div className="mt-2 flex justify-center gap-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <span
          key={i}
          className={
            i < value.length
              ? "h-4 w-4 rounded-full bg-slate-900"
              : "h-4 w-4 rounded-full bg-slate-200"
          }
        />
      ))}
    </div>
  );
}

function KeyButton({
  children,
  onClick,
  variant = "secondary",
  ...rest
}: {
  children: React.ReactNode;
  onClick: () => void;
  variant?: "secondary" | "outline";
  "aria-label"?: string;
}) {
  return (
    <Button
      type="button"
      variant={variant}
      onClick={onClick}
      className="h-16 text-2xl font-medium"
      {...rest}
    >
      {children}
    </Button>
  );
}
