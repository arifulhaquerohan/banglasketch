# Chatbot knowledge and recommendations

The website and Django assistant read `shared/services.json` as their common service catalog. Edit service descriptions there. Contact details come from `shared/contact.json`, shared by the website, chat call/WhatsApp actions, and the AI reference context. Deploy the `shared` directory alongside `frontend` and `django_backend`; the backend requires this file. The catalog's display project counts are not sent to the AI.

The chat API retrieves up to three published, non-deleted projects from PostgreSQL on each request. English and Bangla room keywords filter results; style keywords rank title/description matches first. Follow-up messages retain room preferences, and an explicit new room replaces the previous one. This is keyword retrieval, not semantic search. No matching room yields no cards rather than unrelated projects.

Only public titles, slugs, descriptions and categories enter the AI context. Images are returned for cards; client names, testimonials and private settings are excluded. The prompt treats this context as reference data, never instructions. Cards use database URLs rather than model-generated links. No sample portfolio fallback is used.

Cards remain in the current tab's stored conversation, like chat text. They are snapshots: subsequent CMS changes affect new recommendations, while older cards can point to a project that has since been unpublished.

Validation:

```sh
cd django_backend
.venv/bin/python manage.py test tests.test_chatbot --keepdb --noinput
```

Try “Show modern kitchen projects”, “রান্নাঘরের প্রজেক্ট দেখান”, then “Actually show bedrooms”. AI replies require the existing Gemini configuration. Tests mock the provider and verify public-data filtering, ranking, language matching, follow-up context, and API cards.
