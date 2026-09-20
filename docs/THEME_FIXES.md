# Admin theme and text fixes

## Updated appearance

All admin pages and shared admin components now use named Tailwind colours from `frontend/tailwind.config.js`:

| Purpose | Colour |
| --- | --- |
| Workspace background | #F3F5F2 |
| Cards and forms | #FFFFFF |
| Main text / sidebar | #202A24 |
| Secondary text | #56645B |
| Muted labels / placeholders | #617065 |
| Primary buttons | #465D45 |
| Button hover | #344B33 |
| Borders | #D7DED4 |

Admin headings use the body typeface for legibility. Small labels are larger, keyboard focus is more visible, and mobile inputs use 16px text. Change the shared tokens to adjust the whole admin theme consistently.

## Text and layout repairs

- Blog Markdown previously rendered light text on a light article background. Paragraphs, headings, lists, bold text, links and code now have appropriate dark colours.
- Added the missing global font aliases, including Bengali fallback fonts, and removed the duplicate gold colour variable.
- Login screens scroll on short devices; fixed positioning no longer clips the bottom of the form.
- Project titles and testimonial names wrap instead of being truncated.
- Responsive utility grids can shrink below their old fixed minimum widths.
- Editor toolbar wraps on narrow screens. Heading insertion no longer appends an unwanted Markdown marker. Removed the misleading underline action: its syntax actually renders bold in Markdown.
- Admin navigation marks the current page and exposes the mobile drawer state to assistive technology; login fields have associated labels.
- Maintenance overlays no longer cover admin pages. Existing admin session detection now works with HttpOnly cookies by checking the session endpoint.

## Verification and limits

Checked desktop admin at 1440px and mobile admin/login/home at 375px using Chromium. No horizontal document overflow appeared on the checked mobile pages. The article renderer was checked with English and Bengali fixture text; paragraph colour was rgb(56, 62, 56). Admin sessions and content were mocked locally for visual verification; this did not change authentication code or real account data.

Previews: [desktop admin](previews/admin-desktop.png), [mobile admin](previews/admin-mobile.png). These contain test content and the Next.js development indicator.

These are local source changes. Existing deployment ZIPs and the live website have not been updated. This pass does not claim every CMS record or every device has been visually checked.
