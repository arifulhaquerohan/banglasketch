from decimal import Decimal
import base64
import binascii
from io import BytesIO
from PIL import Image, UnidentifiedImageError
from rest_framework import serializers


class InvoiceItemSerializer(serializers.Serializer):
    description = serializers.CharField(max_length=600)
    quantity = serializers.DecimalField(max_digits=10, decimal_places=2, min_value=Decimal("0.01"), max_value=1000000)
    rate = serializers.DecimalField(max_digits=12, decimal_places=2, min_value=0, max_value=100000000)


class InvoiceSerializer(serializers.Serializer):
    id = serializers.UUIDField()
    revision = serializers.IntegerField(default=0, min_value=0)
    number = serializers.RegexField(r"^[A-Za-z0-9][A-Za-z0-9 /_-]{0,79}$")
    issued = serializers.DateField()
    due = serializers.DateField()
    company = serializers.CharField(max_length=160)
    address = serializers.CharField(max_length=500, allow_blank=True)
    phone = serializers.CharField(max_length=80, allow_blank=True)
    email = serializers.EmailField(allow_blank=True)
    client = serializers.CharField(max_length=160)
    clientCompany = serializers.CharField(max_length=160, allow_blank=True)
    clientAddress = serializers.CharField(max_length=500, allow_blank=True)
    clientPhone = serializers.CharField(max_length=80, allow_blank=True)
    clientEmail = serializers.EmailField(allow_blank=True)
    project = serializers.CharField(max_length=200, allow_blank=True)
    location = serializers.CharField(max_length=400, allow_blank=True)
    notes = serializers.CharField(max_length=1800, allow_blank=True)
    payment = serializers.CharField(max_length=1200, allow_blank=True)
    terms = serializers.CharField(max_length=1800, allow_blank=True)
    discount = serializers.DecimalField(max_digits=5, decimal_places=2, min_value=0, max_value=100)
    tax = serializers.DecimalField(max_digits=5, decimal_places=2, min_value=0, max_value=100)
    paid = serializers.DecimalField(max_digits=15, decimal_places=2, min_value=0, max_value=1000000000000)
    items = InvoiceItemSerializer(many=True, allow_empty=False, max_length=100)
    signature = serializers.CharField(max_length=280000, allow_blank=True, default="")
    signatory = serializers.CharField(max_length=120, allow_blank=True, default="")
    signatoryTitle = serializers.CharField(max_length=120, allow_blank=True, default="Authorized signatory")
    signatureEnabled = serializers.BooleanField(default=True)
    clientSignature = serializers.BooleanField(default=False)

    def validate_signature(self, value):
        if not value:
            return ""
        if not value.startswith("data:image/png;base64,"):
            raise serializers.ValidationError("Upload a PNG signature or draw your signature.")
        try:
            data = base64.b64decode(value.split(",", 1)[1], validate=True)
            with Image.open(BytesIO(data)) as image:
                if image.format != "PNG" or image.width > 1600 or image.height > 800 or image.width * image.height > 1000000:
                    raise ValueError("Invalid signature dimensions")
                image.load()
                output = BytesIO()
                image.convert("RGBA").save(output, format="PNG")
            return "data:image/png;base64," + base64.b64encode(output.getvalue()).decode()
        except (ValueError, binascii.Error, UnidentifiedImageError, OSError, Image.DecompressionBombError):
            raise serializers.ValidationError("Signature must be a valid PNG up to 1600 × 800 pixels.")

    def validate(self, data):
        if data["due"] < data["issued"]:
            raise serializers.ValidationError("Due date cannot be before the issue date.")
        return data
