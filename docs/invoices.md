# Admin invoices

Open `/admin/invoices` using an admin or owner account.

- The invoice includes the transparent `frontend/public/brand-logo.png`, studio contact details, BDT totals, and optional authorized/client signature sections.
- Draw a signature or upload a PNG/JPG/WebP image. The application normalizes signature images to PNG; the backend validates them and removes metadata. Leave the image empty to keep a line for signing by hand.
- **Save to Cloudinary** generates an A4 PDF on the backend and stores it as an authenticated raw Cloudinary asset. The database keeps editable fields and immutable PDF revisions. Re-saving unchanged content does not upload another file.
- **Save & print** archives the PDF successfully before opening the print dialog. **Open saved PDF** retrieves the archived document through the authenticated admin proxy.
- Earlier browser drafts remain available to migrate individually. They are removed from local storage only after a successful cloud save.
- Concurrent changes are rejected rather than overwriting another administrator's edit. Reload the saved invoice before continuing.

## Deployment

Install `django_backend/requirements.txt` and run `python manage.py migrate` before starting the backend. WeasyPrint requires the Pango system library; the local development machine already has it. Keep `frontend/app/fonts/manrope.ttf`, `frontend/app/fonts/noto-sans-bengali.ttf`, and `frontend/public/brand-logo.png` available beside the backend in the repository layout, since the PDF renderer embeds these local assets. No remote font requests are made while rendering.

The existing `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET` settings are used on the server only. PDFs are stored under `banglasketch/invoices/<invoice UUID>/`. Retrieval uses a short-lived signed provider request, then streams the PDF through the admin API with `Cache-Control: private, no-store`; public asset URLs are not exposed.

## Verification

Run the isolated invoice tests without the configured remote database:

```sh
cd django_backend
DATABASE_URL='' DJANGO_SETTINGS_MODULE=config.settings.development .venv/bin/python manage.py test tests.test_invoices --noinput
```

The tests cover amount calculations, signature validation, permissions, revisions, concurrent updates, deduplication, provider failures, and multi-page PDF generation.
