import re
from decimal import Decimal
from profile.models import Profile

from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token
from rest_framework import serializers

from cashier.models import Cashier
from product.models import Product
from store.models import Store

STORE_CODE_RE = re.compile(r"^[A-Z0-9]{3,10}$")
PIN_RE = re.compile(r"^\d{6}$")
BARCODE_RE = re.compile(r"^[A-Za-z0-9\-]{1,64}$")

User = get_user_model()


class UserSerializer(serializers.Serializer):
    id = serializers.IntegerField(read_only=True)
    email = serializers.EmailField(read_only=True)
    onboarded = serializers.SerializerMethodField()

    def get_onboarded(self, obj):
        try:
            return obj.profile.onboarded
        except Profile.DoesNotExist:
            return False


class RegisterSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate_email(self, value):
        email = value.lower()
        if User.objects.filter(username__iexact=email).exists():
            raise serializers.ValidationError("Email sudah terdaftar")
        return email

    def validate_password(self, value):
        try:
            validate_password(value)
        except DjangoValidationError as exc:
            raise serializers.ValidationError(list(exc.messages)) from exc
        return value


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)


class StoreSerializer(serializers.Serializer):
    id = serializers.CharField(read_only=True)
    name = serializers.CharField(max_length=120)
    address = serializers.CharField(required=False, allow_blank=True, default="", max_length=1000)
    code = serializers.CharField(max_length=10)
    created_on = serializers.DateTimeField(read_only=True)
    updated_on = serializers.DateTimeField(read_only=True)

    def validate_code(self, value):
        code = value.strip().upper()
        if not STORE_CODE_RE.match(code):
            raise serializers.ValidationError("Kode harus 3–10 huruf atau angka")
        tenant = self.context["tenant"]
        qs = Store.objects.filter(tenant=tenant, code=code)
        if self.instance is not None:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError("Kode sudah dipakai")
        return code

    def create(self, validated_data):
        return Store.objects.create(**validated_data)

    def update(self, instance, validated_data):
        for key, value in validated_data.items():
            setattr(instance, key, value)
        instance.save()
        return instance


class CashierSerializer(serializers.Serializer):
    id = serializers.CharField(read_only=True)
    store = serializers.CharField(source="store_id", read_only=True)
    display_name = serializers.CharField(max_length=80)
    pin = serializers.CharField(write_only=True, required=False, allow_blank=False)
    active = serializers.BooleanField(required=False)
    last_login_at = serializers.DateTimeField(read_only=True)
    created_on = serializers.DateTimeField(read_only=True)
    updated_on = serializers.DateTimeField(read_only=True)

    def validate_display_name(self, value):
        name = value.strip()
        if not name:
            raise serializers.ValidationError("Nama wajib diisi")
        return name

    def validate_pin(self, value):
        if not PIN_RE.match(value):
            raise serializers.ValidationError("PIN harus 6 digit angka")
        return value

    def validate(self, attrs):
        pin = attrs.get("pin")
        if pin is None:
            if self.instance is None:
                raise serializers.ValidationError({"pin": "PIN wajib diisi"})
            return attrs
        store = self.context["store"]
        qs = Cashier.objects.filter(store=store, active=True)
        if self.instance is not None:
            qs = qs.exclude(pk=self.instance.pk)
        for row in qs:
            if row.check_pin(pin):
                raise serializers.ValidationError({"pin": "PIN sudah dipakai kasir lain"})
        return attrs

    def create(self, validated_data):
        pin = validated_data.pop("pin")
        cashier = Cashier(
            store=self.context["store"],
            display_name=validated_data["display_name"],
            active=validated_data.get("active", True),
        )
        cashier.set_pin(pin)
        actor = validated_data.get("actor")
        if actor is not None:
            cashier.actor = actor
        cashier.save()
        return cashier

    def update(self, instance, validated_data):
        pin = validated_data.pop("pin", None)
        for key, value in validated_data.items():
            setattr(instance, key, value)
        if pin is not None:
            instance.set_pin(pin)
        instance.save()
        return instance


class ProductSerializer(serializers.Serializer):
    id = serializers.CharField(read_only=True)
    barcode = serializers.CharField(
        required=False, allow_blank=True, allow_null=True, max_length=64
    )
    name = serializers.CharField(max_length=200)
    sell_price = serializers.IntegerField(min_value=0)
    bundle_qty = serializers.IntegerField(required=False, allow_null=True, min_value=2)
    bundle_price = serializers.IntegerField(required=False, allow_null=True, min_value=0)
    bundle_label = serializers.CharField(
        required=False, allow_null=True, allow_blank=True, max_length=32
    )
    is_weighted = serializers.BooleanField(required=False, default=False)
    unit_label = serializers.CharField(required=False, max_length=8, default="pcs")
    initial_store_id = serializers.CharField(
        write_only=True, required=False, allow_null=True, allow_blank=True
    )
    initial_qty = serializers.DecimalField(
        max_digits=12,
        decimal_places=2,
        write_only=True,
        required=False,
        allow_null=True,
        min_value=Decimal("0.01"),
    )
    created_on = serializers.DateTimeField(read_only=True)
    updated_on = serializers.DateTimeField(read_only=True)

    def validate_name(self, value):
        name = value.strip()
        if not name:
            raise serializers.ValidationError("Nama wajib diisi")
        return name

    def validate_barcode(self, value):
        if value is None:
            return None
        code = value.strip()
        if code == "":
            return None
        if not BARCODE_RE.match(code):
            raise serializers.ValidationError("Barcode 1–64 karakter, huruf/angka/tanda hubung")
        tenant = self.context["tenant"]
        qs = Product.objects.filter(tenant=tenant, barcode=code, archived_at__isnull=True)
        if self.instance is not None:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError("Barcode sudah dipakai produk lain")
        return code

    def validate_bundle_label(self, value):
        if value is None:
            return None
        label = value.strip()
        return label or None

    def validate_unit_label(self, value):
        label = (value or "").strip()
        return label or "pcs"

    def validate(self, attrs):
        initial_keys = ("initial_store_id", "initial_qty")
        if self.instance is not None:
            for key in initial_keys:
                attrs.pop(key, None)
        else:
            store_id = attrs.get("initial_store_id")
            qty = attrs.get("initial_qty")
            store_provided = bool(store_id and str(store_id).strip())
            qty_provided = qty is not None
            if store_provided != qty_provided:
                missing = "initial_qty" if store_provided else "initial_store_id"
                raise serializers.ValidationError(
                    {missing: "Isi toko dan jumlah stok awal keduanya, atau kosongkan"}
                )
            if store_provided:
                tenant = self.context["tenant"]
                store = Store.objects.filter(
                    id=str(store_id).strip(),
                    tenant=tenant,
                ).first()
                if store is None:
                    raise serializers.ValidationError({"initial_store_id": "Toko tidak ditemukan"})
                is_weighted = attrs.get("is_weighted", False)
                if not is_weighted and qty != qty.to_integral_value():
                    raise serializers.ValidationError(
                        {"initial_qty": "Produk satuan hanya bisa diterima dalam jumlah utuh"}
                    )
                attrs["_initial_store"] = store
                attrs["initial_store_id"] = store.id
            else:
                attrs.pop("initial_store_id", None)
                attrs.pop("initial_qty", None)

        bundle_keys = ("bundle_qty", "bundle_price", "bundle_label")
        is_partial = bool(getattr(self, "partial", False))
        current = {
            "bundle_qty": getattr(self.instance, "bundle_qty", None) if self.instance else None,
            "bundle_price": getattr(self.instance, "bundle_price", None) if self.instance else None,
            "bundle_label": getattr(self.instance, "bundle_label", None) if self.instance else None,
            "is_weighted": getattr(self.instance, "is_weighted", False) if self.instance else False,
        }
        merged = {k: attrs.get(k, current[k]) for k in bundle_keys}
        is_weighted = attrs.get("is_weighted", current["is_weighted"])
        provided = [k for k, v in merged.items() if v not in (None, "")]
        if is_weighted and provided:
            raise serializers.ValidationError(
                {"bundle": "Produk timbang tidak boleh memiliki bundel"}
            )
        if is_partial and not any(k in attrs for k in bundle_keys):
            return attrs
        if 0 < len(provided) < 3:
            raise serializers.ValidationError(
                {"bundle": "Bundel harus diisi lengkap: jumlah, harga, dan label"}
            )
        return attrs

    def create(self, validated_data):
        validated_data.pop("_initial_store", None)
        validated_data.pop("initial_store_id", None)
        validated_data.pop("initial_qty", None)
        return Product.objects.create(**validated_data)

    def update(self, instance, validated_data):
        validated_data.pop("_initial_store", None)
        validated_data.pop("initial_store_id", None)
        validated_data.pop("initial_qty", None)
        for key, value in validated_data.items():
            setattr(instance, key, value)
        instance.save()
        return instance


class CashierLoginSerializer(serializers.Serializer):
    store_code = serializers.CharField(max_length=10)
    pin = serializers.CharField(max_length=6)

    def validate_store_code(self, value):
        code = value.strip().upper()
        if not STORE_CODE_RE.match(code):
            raise serializers.ValidationError("Kode toko tidak valid")
        return code

    def validate_pin(self, value):
        if not PIN_RE.match(value):
            raise serializers.ValidationError("PIN harus 6 digit angka")
        return value


class CashierSessionSerializer(serializers.Serializer):
    token = serializers.CharField(read_only=True)
    expires_at = serializers.DateTimeField(read_only=True)
    cashier = serializers.SerializerMethodField()
    store = serializers.SerializerMethodField()

    def get_cashier(self, obj):
        c = obj.cashier
        return {
            "id": c.id,
            "display_name": c.display_name,
            "last_login_at": c.last_login_at,
        }

    def get_store(self, obj):
        s = obj.store
        return {"id": s.id, "code": s.code, "name": s.name}


class StockListItemSerializer(serializers.Serializer):
    product_id = serializers.CharField()
    name = serializers.CharField()
    barcode = serializers.CharField(allow_null=True)
    sell_price = serializers.IntegerField()
    qty = serializers.DecimalField(max_digits=12, decimal_places=2, coerce_to_string=False)
    last_movement_at = serializers.DateTimeField(allow_null=True)
    bundle_qty = serializers.IntegerField(allow_null=True)
    bundle_price = serializers.IntegerField(allow_null=True)
    bundle_label = serializers.CharField(allow_null=True)
    is_weighted = serializers.BooleanField()
    unit_label = serializers.CharField()


class StockMovementSerializer(serializers.Serializer):
    id = serializers.CharField(read_only=True)
    product_id = serializers.CharField(source="product.id", read_only=True)
    product_name = serializers.CharField(source="product.name", read_only=True)
    barcode = serializers.CharField(source="product.barcode", read_only=True, allow_null=True)
    delta = serializers.DecimalField(
        max_digits=12, decimal_places=2, read_only=True, coerce_to_string=False
    )
    reason = serializers.CharField(read_only=True)
    note = serializers.CharField(read_only=True, allow_blank=True)
    ref_type = serializers.CharField(read_only=True, allow_blank=True)
    ref_id = serializers.CharField(read_only=True, allow_blank=True)
    actor_email = serializers.SerializerMethodField()
    created_on = serializers.DateTimeField(read_only=True)

    def get_actor_email(self, obj):
        return obj.actor.email if obj.actor_id else None


class ReceivingItemSerializer(serializers.Serializer):
    product_id = serializers.CharField()
    qty = serializers.DecimalField(max_digits=12, decimal_places=2, min_value=Decimal("0.01"))
    note = serializers.CharField(required=False, allow_blank=True, default="")


class ReceivingSerializer(serializers.Serializer):
    items = ReceivingItemSerializer(many=True)

    def validate_items(self, value):
        if not value:
            raise serializers.ValidationError("Minimal 1 item")
        store = self.context["store"]
        product_ids = [item["product_id"] for item in value]
        seen = set()
        for pid in product_ids:
            if pid in seen:
                raise serializers.ValidationError(f"Produk {pid} duplikat dalam satu penerimaan")
            seen.add(pid)
        products = {
            p.id: p
            for p in Product.objects.filter(
                id__in=product_ids, tenant=store.tenant, archived_at__isnull=True
            )
        }
        missing = set(product_ids) - set(products.keys())
        if missing:
            raise serializers.ValidationError(
                f"Produk tidak ditemukan: {', '.join(sorted(missing))}"
            )
        for item in value:
            product = products[item["product_id"]]
            qty = item["qty"]
            if not product.is_weighted and qty != qty.to_integral_value():
                raise serializers.ValidationError(
                    f"Produk {product.name} hanya bisa diterima dalam satuan utuh"
                )
        return value


class AdjustmentSerializer(serializers.Serializer):
    product_id = serializers.CharField()
    delta = serializers.DecimalField(max_digits=12, decimal_places=2, required=False)
    target_qty = serializers.DecimalField(
        max_digits=12, decimal_places=2, required=False, min_value=Decimal("0")
    )
    note = serializers.CharField()

    def validate_note(self, value):
        note = value.strip()
        if not note:
            raise serializers.ValidationError("Catatan wajib diisi")
        return note

    def validate(self, attrs):
        has_delta = "delta" in attrs
        has_target = "target_qty" in attrs
        if has_delta == has_target:
            raise serializers.ValidationError("Isi salah satu: delta atau target_qty")
        if has_delta and attrs["delta"] == 0:
            raise serializers.ValidationError({"delta": "Delta tidak boleh 0"})
        store = self.context["store"]
        product = Product.objects.filter(
            id=attrs["product_id"], tenant=store.tenant, archived_at__isnull=True
        ).first()
        if not product:
            raise serializers.ValidationError({"product_id": "Produk tidak ditemukan"})
        if not product.is_weighted:
            value = attrs["delta"] if has_delta else attrs["target_qty"]
            if value != value.to_integral_value():
                key = "delta" if has_delta else "target_qty"
                raise serializers.ValidationError(
                    {key: f"Produk {product.name} hanya menerima jumlah bilangan bulat"}
                )
        return attrs


class SaleLineInputSerializer(serializers.Serializer):
    product_id = serializers.CharField()
    qty = serializers.DecimalField(max_digits=12, decimal_places=2, min_value=Decimal("0.01"))
    is_bundle = serializers.BooleanField(required=False, default=False)


class SaleCreateSerializer(serializers.Serializer):
    lines = SaleLineInputSerializer(many=True)
    tendered = serializers.IntegerField(min_value=0)

    def validate_lines(self, value):
        if not value:
            raise serializers.ValidationError("Minimal 1 item")
        seen = set()
        for line in value:
            key = (line["product_id"], bool(line.get("is_bundle", False)))
            if key in seen:
                raise serializers.ValidationError("Baris duplikat dalam satu transaksi")
            seen.add(key)
        return value


class SaleLineSerializer(serializers.Serializer):
    id = serializers.CharField(read_only=True)
    product_id = serializers.CharField(source="product.id", read_only=True)
    product_name = serializers.CharField(source="product.name", read_only=True)
    barcode = serializers.CharField(source="product.barcode", read_only=True, allow_null=True)
    qty = serializers.DecimalField(
        max_digits=12, decimal_places=2, read_only=True, coerce_to_string=False
    )
    unit_price = serializers.IntegerField(read_only=True)
    line_total = serializers.IntegerField(read_only=True)
    is_bundle = serializers.BooleanField(read_only=True)
    bundle_qty = serializers.IntegerField(read_only=True, allow_null=True)
    bundle_label = serializers.CharField(
        source="product.bundle_label", read_only=True, allow_null=True
    )
    is_weighted = serializers.BooleanField(source="product.is_weighted", read_only=True)
    unit_label = serializers.CharField(source="product.unit_label", read_only=True)


class SaleDetailSerializer(serializers.Serializer):
    id = serializers.CharField(read_only=True)
    store_id = serializers.CharField(source="store.id", read_only=True)
    cashier_id = serializers.CharField(source="cashier.id", read_only=True)
    cashier_name = serializers.CharField(source="cashier.display_name", read_only=True)
    subtotal = serializers.IntegerField(read_only=True)
    tendered = serializers.IntegerField(read_only=True)
    change = serializers.IntegerField(read_only=True)
    created_on = serializers.DateTimeField(read_only=True)
    lines = SaleLineSerializer(many=True, read_only=True)


class SaleListSerializer(serializers.Serializer):
    id = serializers.CharField(read_only=True)
    subtotal = serializers.IntegerField(read_only=True)
    tendered = serializers.IntegerField(read_only=True)
    change = serializers.IntegerField(read_only=True)
    created_on = serializers.DateTimeField(read_only=True)
    line_count = serializers.SerializerMethodField()

    def get_line_count(self, obj):
        return obj.lines.count()


class SaleReportRowSerializer(serializers.Serializer):
    id = serializers.CharField(read_only=True)
    created_on = serializers.DateTimeField(read_only=True)
    cashier_name = serializers.CharField(source="cashier.display_name", read_only=True)
    subtotal = serializers.IntegerField(read_only=True)
    tendered = serializers.IntegerField(read_only=True)
    change = serializers.IntegerField(read_only=True)
    line_count = serializers.SerializerMethodField()

    def get_line_count(self, obj):
        return len(obj.lines.all())


class TopProductRowSerializer(serializers.Serializer):
    product_id = serializers.CharField()
    name = serializers.CharField()
    barcode = serializers.CharField(allow_null=True)
    qty_sold = serializers.DecimalField(max_digits=14, decimal_places=2, coerce_to_string=False)
    revenue = serializers.IntegerField()


class GoogleAuthSerializer(serializers.Serializer):
    credential = serializers.CharField()

    def validate(self, attrs):
        if not settings.GOOGLE_OAUTH_CLIENT_ID:
            raise serializers.ValidationError("Google OAuth belum dikonfigurasi")
        try:
            claims = id_token.verify_oauth2_token(
                attrs["credential"],
                google_requests.Request(),
                settings.GOOGLE_OAUTH_CLIENT_ID,
            )
        except ValueError as exc:
            raise serializers.ValidationError(f"Kredensial Google tidak valid: {exc}") from exc
        if not claims.get("email_verified"):
            raise serializers.ValidationError("Email belum terverifikasi")
        attrs["claims"] = claims
        return attrs
