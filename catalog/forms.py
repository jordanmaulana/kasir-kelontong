from django import forms

from catalog.models import BarcodeCatalog

_INPUT_CLASS = (
    "w-full rounded border border-slate-300 bg-white px-3 py-2 text-sm "
    "shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 "
    "focus:ring-blue-500 disabled:bg-slate-100 disabled:text-slate-500"
)


class BarcodeCatalogForm(forms.ModelForm):
    class Meta:
        model = BarcodeCatalog
        fields = ["barcode", "name"]
        widgets = {
            "barcode": forms.TextInput(attrs={"class": _INPUT_CLASS, "autofocus": True}),
            "name": forms.TextInput(attrs={"class": _INPUT_CLASS}),
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        if self.instance and self.instance.pk:
            self.fields["barcode"].disabled = True
