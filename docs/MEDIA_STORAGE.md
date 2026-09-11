# Public image storage

Admin images use: browser → Next.js `/api/admin/upload` → Django `/api/admin/upload` → Cloudinary. The post stores the resulting Cloudinary URL in PostgreSQL; image bytes are not stored in the application repository or database.

Only editors, admins and owners can upload. Cloudinary credentials remain in Django's environment. Django verifies decoded JPG, PNG, WebP and AVIF files, with a 10 MiB size limit, 40 megapixel limit and no animations. It decodes, corrects EXIF orientation, and re-encodes every accepted file before upload, removing EXIF/GPS and other hidden metadata. Cloudinary receives an image-only upload, a server-generated identifier, an application folder and `overwrite=False`. Incoming dimensions are limited to 4096 × 4096. Browser signatures are retired (HTTP 410). Each successful upload is recorded as `media_upload` in the admin audit log with its storage ID, folder, format and byte size.

This flow is for public portfolio content. A draft post is hidden from website listings, but its uploaded Cloudinary URL remains publicly readable to anyone who already has that hard-to-guess URL. Do not use it for confidential client documents. Confidential plans, contracts, invoices and identity documents need a separate private bucket with authenticated, expiring download links.

Removing or replacing an image in a form does not delete the Cloudinary asset. This preserves references from other records and content revisions. Automatic orphan cleanup is not implemented; review references and backups before deleting assets in Cloudinary. Existing assets were not modified by this change.

Keep `.env` out of Git. Rotate previously exposed credentials in the provider dashboard and update Django's environment. Provider credential rotation, unsigned-preset removal and account backup configuration are account operations and have not been performed by this implementation.

Uploads pass through the application server, so configure the reverse proxy to allow an 11 MiB multipart body and at least a 60-second upload response timeout. Install updated Python dependencies before restarting Django.

Validation uses mocked Cloudinary calls; it does not upload or delete live assets.
