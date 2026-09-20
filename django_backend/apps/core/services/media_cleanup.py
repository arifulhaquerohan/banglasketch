import logging
from django.conf import settings

logger = logging.getLogger(__name__)

def delete_media_from_cloudinary(public_id):
    """
    Deletes an asset from Cloudinary using its public_id.
    """
    try:
        import cloudinary
        import cloudinary.uploader
        if all(getattr(settings, key, "") for key in ("CLOUDINARY_CLOUD_NAME", "CLOUDINARY_API_KEY", "CLOUDINARY_API_SECRET")):
            cloudinary.config(
                cloud_name=settings.CLOUDINARY_CLOUD_NAME,
                api_key=settings.CLOUDINARY_API_KEY,
                api_secret=settings.CLOUDINARY_API_SECRET,
                secure=True,
            )
        result = cloudinary.uploader.destroy(public_id)
        logger.info(f"Cloudinary deletion result for {public_id}: {result}")
        if result.get("result") == "ok":
            return True
        else:
            logger.error(f"Failed to delete {public_id} from Cloudinary: {result}")
            return False
    except Exception as e:
        logger.error(f"Error deleting {public_id} from Cloudinary: {e}")
        return False
