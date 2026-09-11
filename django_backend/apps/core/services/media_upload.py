"""Validated, metadata-scrubbed uploads for public website images only."""
from io import BytesIO
import re
import uuid
import warnings

import cloudinary.uploader
from django.conf import settings
from PIL import Image, ImageOps, UnidentifiedImageError
from rest_framework.exceptions import ValidationError

MAX_BYTES = 10 * 1024 * 1024
MAX_PIXELS = 40_000_000
FORMATS = {"JPEG", "PNG", "WEBP", "AVIF"}


def _sanitized_copy(file_obj):
    """Decode and re-encode an image without EXIF/GPS or embedded metadata."""
    file_obj.seek(0)
    with Image.open(file_obj) as source:
        source.load()
        image_format = source.format
        clean = ImageOps.exif_transpose(source)
        if image_format == "JPEG" and clean.mode not in ("RGB", "L"):
            clean = clean.convert("RGB")

        output = BytesIO()
        save_options = {
            "JPEG": {"quality": 90, "optimize": True},
            "PNG": {"optimize": True},
            "WEBP": {"quality": 90, "method": 6},
            "AVIF": {"quality": 90},
        }[image_format]
        clean.save(output, format=image_format, **save_options)
        output.seek(0)
        extension = "jpg" if image_format == "JPEG" else image_format.lower()
        output.name = f"sanitized.{extension}"
        return output


def upload_image(file_obj, folder):
    if not isinstance(folder, str):
        raise ValidationError("Invalid upload folder")
    folder = folder.removeprefix("banglasketch/")
    if not re.fullmatch(r"[a-zA-Z0-9_-]{1,40}", folder):
        raise ValidationError("Invalid upload folder")
    if not file_obj or not 0 < file_obj.size <= MAX_BYTES:
        raise ValidationError("Select an image no larger than 10 MB")
    try:
        with warnings.catch_warnings():
            warnings.simplefilter("error", Image.DecompressionBombWarning)
            with Image.open(file_obj) as img:
                if img.format not in FORMATS or img.width * img.height > MAX_PIXELS:
                    raise ValidationError("Use JPG, PNG, WebP or AVIF up to 40 megapixels")
                if getattr(img, "n_frames", 1) != 1:
                    raise ValidationError("Animated images are not supported")
                img.verify()
            file_obj.seek(0)
            with Image.open(file_obj) as img:
                img.load()
    except (UnidentifiedImageError, OSError, ValueError, Image.DecompressionBombError, Image.DecompressionBombWarning):
        raise ValidationError("The file is not a valid supported image")
    finally:
        file_obj.seek(0)
    if not all(getattr(settings, key, "") for key in (
        "CLOUDINARY_CLOUD_NAME", "CLOUDINARY_API_KEY", "CLOUDINARY_API_SECRET"
    )):
        raise ValidationError("Media storage is not configured")
    sanitized = _sanitized_copy(file_obj)
    return cloudinary.uploader.upload(
        sanitized,
        folder=f"banglasketch/{folder}",
        public_id=uuid.uuid4().hex,
        resource_type="image",
        type="upload",
        access_mode="public",
        allowed_formats=["jpg", "jpeg", "png", "webp", "avif"],
        overwrite=False,
        transformation={"crop": "limit", "width": 4096, "height": 4096},
        timeout=45,
    )
