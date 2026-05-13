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
import { cn } from "@/lib/utils";

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
      },
    );
  };

  return (
    <div className="w-full max-w-md rounded-lg border border-border bg-card p-8 shadow-sm">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Masuk Kasir</h1>
        <p className="mt-2 text-base text-muted-foreground">
          Masukkan kode toko + PIN 6 digit
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <Label htmlFor="cashier-store-code">Kode toko</Label>
          <Input
            id="cashier-store-code"
            autoFocus
            className="font-mono uppercase tracking-widest text-xl text-center"
            placeholder="JKT01"
            maxLength={10}
            aria-invalid={!!errors.store_code}
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
            <p className="mt-2 text-sm font-semibold text-destructive">
              {errors.store_code.message}
            </p>
          )}
        </div>

        <div>
          <Label className="text-center block">PIN</Label>
          <PinDots value={pin} />
          {errors.pin && (
            <p className="mt-2 text-center text-sm font-semibold text-destructive">
              {errors.pin.message}
            </p>
          )}
        </div>

        <input type="hidden" {...register("pin")} />

        <div className="grid grid-cols-3 gap-3">
          {KEYS.map((k) => (
            <KeyButton key={k} onClick={() => appendDigit(k)}>
              {k}
            </KeyButton>
          ))}
          <KeyButton onClick={clear} variant="outline" aria-label="Bersihkan PIN">
            C
          </KeyButton>
          <KeyButton onClick={() => appendDigit("0")}>0</KeyButton>
          <KeyButton onClick={backspace} variant="outline" aria-label="Hapus satu digit">
            <Delete className="size-7" />
          </KeyButton>
        </div>

        <Button
          type="submit"
          variant="accent"
          size="xl"
          className="w-full"
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
    <div className="mt-3 flex justify-center gap-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <span
          key={i}
          className={cn(
            "size-5 rounded-full transition-all",
            i < value.length ? "bg-foreground scale-100" : "bg-border scale-90",
          )}
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
      className="h-20 text-3xl font-bold"
      {...rest}
    >
      {children}
    </Button>
  );
}
