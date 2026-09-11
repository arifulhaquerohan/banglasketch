import cloudinary.uploader
import logging

logger = logging.getLogger(__name__)

def delete_media_from_cloudinary(public_id):
    """
    Deletes an asset from Cloudinary using its public_id.
    """
    try:
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
