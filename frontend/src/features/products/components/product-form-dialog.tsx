import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { lookupBarcode } from "@/features/products/api";
import { useCreateProduct, useUpdateProduct } from "@/features/products/hooks";
import type { Product } from "@/features/products/types";
import { useStores } from "@/features/stores/hooks";
import { ApiError } from "@/lib/api";

const BARCODE_RE = /^[A-Za-z0-9-]{1,64}$/;

// react-hook-form's `valueAsNumber` turns an empty input into NaN, which zod's
// `.optional()` rejects. Normalize empty → undefined so optional number fields
// can genuinely be left blank.
const optionalNumber = (v: string) => (v.trim() === "" ? undefined : Number(v));

const schema = z
  .object({
    barcode: z
      .string()
      .max(64)
      .regex(
        /^$|^[A-Za-z0-9-]{1,64}$/,
        "Barcode 1–64 karakter, huruf/angka/tanda hubung",
      )
      .optional(),
    name: z.string().min(1, "Nama wajib diisi").max(200),
    sell_price: z
      .number("Harga harus angka")
      .int("Harga harus bilangan bulat")
      .min(0, "Harga tidak boleh negatif"),
    is_weighted: z.boolean(),
    unit_label: z.string().trim().max(8).optional(),
    has_bundle: z.boolean(),
    bundle_label: z.string().max(32).optional(),
    bundle_qty: z.number().int().optional(),
    bundle_price: z.number().int().optional(),
    initial_store_id: z.string().optional(),
    initial_qty: z.number().positive("Jumlah harus lebih dari 0").optional(),
  })
  .superRefine((data, ctx) => {
    if (data.is_weighted && data.has_bundle) {
      ctx.addIssue({
        code: "custom",
        path: ["has_bundle"],
        message: "Produk timbang tidak bisa memiliki bundel",
      });
    }
    if (data.is_weighted && !(data.unit_label ?? "").trim()) {
      ctx.addIssue({
        code: "custom",
        path: ["unit_label"],
        message: "Isi satuan (mis. kg, g, L)",
      });
    }
    const hasInitialStore = !!(
      data.initial_store_id && data.initial_store_id.trim()
    );
    const hasInitialQty =
      data.initial_qty != null && !Number.isNaN(data.initial_qty);
    // Initial stock is fully optional: an empty qty simply records no opening stock,
    // even when a store is selected (single-store forms auto-select one). Only flag
    // the inverse — a qty entered with no store to apply it to.
    if (hasInitialQty && !hasInitialStore) {
      ctx.addIssue({
        code: "custom",
        path: ["initial_store_id"],
        message: "Pilih toko untuk stok awal",
      });
    }
    if (
      hasInitialQty &&
      !data.is_weighted &&
      data.initial_qty != null &&
      !Number.isInteger(data.initial_qty)
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["initial_qty"],
        message: "Jumlah harus bilangan bulat",
      });
    }
    if (!data.has_bundle) return;
    const label = (data.bundle_label ?? "").trim();
    if (!label) {
      ctx.addIssue({
        code: "custom",
        path: ["bundle_label"],
        message: "Nama bundel wajib diisi",
      });
    }
    if (
      data.bundle_qty == null ||
      Number.isNaN(data.bundle_qty) ||
      data.bundle_qty < 2
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["bundle_qty"],
        message: "Minimal 2 pcs per bundel",
      });
    }
    if (
      data.bundle_price == null ||
      Number.isNaN(data.bundle_price) ||
      data.bundle_price < 0
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["bundle_price"],
        message: "Harga bundel tidak boleh negatif",
      });
    }
  });

type FormValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: Product;
}

const EMPTY_DEFAULTS: FormValues = {
  barcode: "",
  name: "",
  sell_price: undefined as unknown as number,
  is_weighted: false,
  unit_label: "pcs",
  has_bundle: false,
  bundle_label: "",
  bundle_qty: undefined,
  bundle_price: undefined,
  initial_store_id: "",
  initial_qty: undefined,
};

export function ProductFormDialog({ open, onOpenChange, product }: Props) {
  const isEdit = !!product;
  const create = useCreateProduct();
  const update = useUpdateProduct();
  const mutation = isEdit ? update : create;
  const storesQuery = useStores();
  const stores = storesQuery.data ?? [];
  const onlyStore = stores.length === 1 ? stores[0] : null;

  const {
    register,
    handleSubmit,
    reset,
    setError,
    setFocus,
    setValue,
    watch,
    getValues,
    formState: { errors, dirtyFields },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: EMPTY_DEFAULTS,
  });

  const hasBundle = watch("has_bundle");
  const isWeighted = watch("is_weighted");
  const initialStoreId = watch("initial_store_id");
  const barcodeValue = watch("barcode");
  const nameDirty = !!dirtyFields.name;

  useEffect(() => {
    if (!open) return;
    const productHasBundle =
      !!product && product.bundle_qty != null && product.bundle_price != null;
    reset({
      barcode: product?.barcode ?? "",
      name: product?.name ?? "",
      sell_price: product?.sell_price ?? (undefined as unknown as number),
      is_weighted: product?.is_weighted ?? false,
      unit_label: product?.unit_label ?? "pcs",
      has_bundle: productHasBundle,
      bundle_label: product?.bundle_label ?? "",
      bundle_qty: product?.bundle_qty ?? undefined,
      bundle_price: product?.bundle_price ?? undefined,
      initial_store_id: "",
      initial_qty: undefined,
    });
  }, [open, product, reset]);

  useEffect(() => {
    if (!open || isEdit) return;
    if (onlyStore && !initialStoreId) {
      setValue("initial_store_id", onlyStore.id);
    }
  }, [open, isEdit, onlyStore, initialStoreId, setValue]);

  useEffect(() => {
    if (!open || isEdit) return;
    if (nameDirty) return;
    const barcode = (barcodeValue ?? "").trim();
    if (!BARCODE_RE.test(barcode)) return;

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        const hit = await lookupBarcode(barcode, controller.signal);
        if (!hit) return;
        if (getValues("name").trim()) return;
        setValue("name", hit.name, { shouldDirty: false });
      } catch {
        // silent — autofill is best-effort
      }
    }, 300);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [open, isEdit, nameDirty, barcodeValue, getValues, setValue]);

  const onSubmit = (values: FormValues) => {
    const baseBody = {
      barcode: values.barcode?.trim() ? values.barcode.trim() : null,
      name: values.name.trim(),
      sell_price: values.sell_price,
      is_weighted: values.is_weighted,
      unit_label: values.is_weighted
        ? (values.unit_label ?? "").trim() || "kg"
        : "pcs",
      bundle_qty:
        values.is_weighted || !values.has_bundle
          ? null
          : (values.bundle_qty ?? null),
      bundle_price:
        values.is_weighted || !values.has_bundle
          ? null
          : (values.bundle_price ?? null),
      bundle_label:
        values.is_weighted || !values.has_bundle
          ? null
          : (values.bundle_label ?? "").trim() || null,
    };
    const storeId = values.initial_store_id?.trim() ?? "";
    const qty = values.initial_qty;
    const includeInitialStock =
      !isEdit && storeId !== "" && qty != null && !Number.isNaN(qty);
    const body = includeInitialStock
      ? {
          ...baseBody,
          initial_store_id: storeId,
          initial_qty: qty,
        }
      : baseBody;
    const onSuccess = () => {
      if (isEdit) {
        toast.success("Produk diperbarui");
        onOpenChange(false);
        return;
      }
      toast.success(
        includeInitialStock
          ? "Produk berhasil dibuat & stok awal dicatat"
          : "Produk berhasil dibuat",
      );
      reset(EMPTY_DEFAULTS);
      requestAnimationFrame(() => setFocus("barcode"));
    };
    const onError = (err: unknown) => {
      if (err instanceof ApiError) {
        const data = err.data as Record<string, unknown> | null;
        if (data && typeof data === "object") {
          const keys = [
            "barcode",
            "name",
            "sell_price",
            "bundle_qty",
            "bundle_price",
            "bundle_label",
            "is_weighted",
            "unit_label",
            "initial_store_id",
            "initial_qty",
          ] as const;
          for (const key of keys) {
            const messages = data[key];
            if (Array.isArray(messages) && messages.length > 0) {
              setError(key, { message: String(messages[0]) });
            }
          }
        }
        toast.error(err.message);
      } else {
        toast.error(err instanceof Error ? err.message : "Permintaan gagal");
      }
    };
    if (isEdit && product) {
      update.mutate({ id: product.id, body: baseBody }, { onSuccess, onError });
    } else {
      create.mutate(body, { onSuccess, onError });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Ubah Produk" : "Produk Baru"}</DialogTitle>
          <DialogDescription>
            Scan barcode atau isi manual. Barcode opsional untuk barang curah.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <Label htmlFor="product-barcode">Barcode (opsional)</Label>
            <Input
              id="product-barcode"
              autoFocus
              className="font-mono"
              placeholder="Scan atau ketik manual"
              maxLength={64}
              autoComplete="off"
              aria-invalid={!!errors.barcode}
              {...register("barcode")}
            />
            {errors.barcode && (
              <p className="mt-2 text-sm font-semibold text-destructive">
                {errors.barcode.message}
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="product-name">Nama produk</Label>
            <Input
              id="product-name"
              placeholder="Contoh: Indomie Goreng"
              aria-invalid={!!errors.name}
              {...register("name")}
            />
            {errors.name && (
              <p className="mt-2 text-sm font-semibold text-destructive">
                {errors.name.message}
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="product-price">Harga jual satuan (Rp)</Label>
            <Input
              id="product-price"
              type="number"
              inputMode="numeric"
              min={0}
              step={1}
              className="text-right font-mono text-lg"
              aria-invalid={!!errors.sell_price}
              {...register("sell_price", { valueAsNumber: true })}
            />
            {errors.sell_price && (
              <p className="mt-2 text-sm font-semibold text-destructive">
                {errors.sell_price.message}
              </p>
            )}
          </div>

          <div className="rounded-md border border-border bg-muted/40 p-4 space-y-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                className="size-5 accent-current"
                {...register("is_weighted")}
              />
              <span className="text-sm font-semibold">
                Produk timbang (jual per kg/g/L, jumlah boleh desimal)
              </span>
            </label>

            {isWeighted && (
              <div>
                <Label htmlFor="unit-label">Satuan</Label>
                <Input
                  id="unit-label"
                  placeholder="kg"
                  maxLength={8}
                  aria-invalid={!!errors.unit_label}
                  {...register("unit_label")}
                />
                {errors.unit_label && (
                  <p className="mt-2 text-sm font-semibold text-destructive">
                    {errors.unit_label.message}
                  </p>
                )}
                <p className="mt-1 text-xs text-muted-foreground">
                  Harga di atas adalah harga per{" "}
                  {watch("unit_label") || "satuan"}.
                </p>
              </div>
            )}
          </div>

          <div
            className={`rounded-md border border-border bg-muted/40 p-4 space-y-4 ${isWeighted ? "opacity-50" : ""}`}
          >
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                className="size-5 accent-current"
                disabled={isWeighted}
                {...register("has_bundle")}
              />
              <span className="text-sm font-semibold">
                Jual juga dalam bundel/renteng/pak
              </span>
            </label>

            {hasBundle && !isWeighted && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="bundle-label">Nama bundel</Label>
                  <Input
                    id="bundle-label"
                    placeholder="Contoh: Renteng, Pak, Kardus"
                    maxLength={32}
                    aria-invalid={!!errors.bundle_label}
                    {...register("bundle_label")}
                  />
                  {errors.bundle_label && (
                    <p className="mt-2 text-sm font-semibold text-destructive">
                      {errors.bundle_label.message}
                    </p>
                  )}
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="bundle-qty">Isi per bundel (pcs)</Label>
                    <Input
                      id="bundle-qty"
                      type="number"
                      inputMode="numeric"
                      min={2}
                      step={1}
                      placeholder="20"
                      className="text-right font-mono text-lg"
                      aria-invalid={!!errors.bundle_qty}
                      {...register("bundle_qty", {
                        setValueAs: optionalNumber,
                      })}
                    />
                    {errors.bundle_qty && (
                      <p className="mt-2 text-sm font-semibold text-destructive">
                        {errors.bundle_qty.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="bundle-price">Harga bundel (Rp)</Label>
                    <Input
                      id="bundle-price"
                      type="number"
                      inputMode="numeric"
                      min={0}
                      step={1}
                      placeholder="0"
                      className="text-right font-mono text-lg"
                      aria-invalid={!!errors.bundle_price}
                      {...register("bundle_price", {
                        setValueAs: optionalNumber,
                      })}
                    />
                    {errors.bundle_price && (
                      <p className="mt-2 text-sm font-semibold text-destructive">
                        {errors.bundle_price.message}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {!isEdit && stores.length > 0 && (
            <div className="rounded-md border border-border bg-muted/40 p-4 space-y-4">
              <div>
                <p className="text-sm font-semibold">Stok awal (opsional)</p>
                <p className="text-xs text-muted-foreground">
                  Catat penerimaan stok pertama bersamaan dengan pembuatan
                  produk.
                </p>
              </div>

              {stores.length === 1 ? (
                <p className="text-sm">
                  Toko: <span className="font-semibold">{onlyStore?.name}</span>
                </p>
              ) : (
                <div>
                  <Label htmlFor="initial-store">Toko</Label>
                  <select
                    id="initial-store"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    aria-invalid={!!errors.initial_store_id}
                    {...register("initial_store_id")}
                  >
                    <option value="">— Pilih toko —</option>
                    {stores.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                  {errors.initial_store_id && (
                    <p className="mt-2 text-sm font-semibold text-destructive">
                      {errors.initial_store_id.message}
                    </p>
                  )}
                </div>
              )}

              <div>
                <Label htmlFor="initial-qty">
                  Jumlah ({isWeighted ? watch("unit_label") || "satuan" : "pcs"}
                  )
                </Label>
                <Input
                  id="initial-qty"
                  type="number"
                  inputMode={isWeighted ? "decimal" : "numeric"}
                  min={isWeighted ? 0.01 : 1}
                  step={isWeighted ? 0.01 : 1}
                  placeholder="0"
                  className="text-right font-mono text-lg"
                  aria-invalid={!!errors.initial_qty}
                  {...register("initial_qty", { setValueAs: optionalNumber })}
                />
                {errors.initial_qty && (
                  <p className="mt-2 text-sm font-semibold text-destructive">
                    {errors.initial_qty.message}
                  </p>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={mutation.isPending}
            >
              Batal
            </Button>
            <Button
              type="submit"
              variant="accent"
              disabled={mutation.isPending}
            >
              {mutation.isPending
                ? "Menyimpan…"
                : isEdit
                  ? "Simpan Perubahan"
                  : "Buat Produk"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
