import base64
import re
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response

def encode_cursor(id_val):
    if id_val is None:
        return None
    encoded = base64.urlsafe_b64encode(str(id_val).encode("utf-8")).decode("ascii")
    return encoded.rstrip("=")

def decode_cursor(cursor_str):
    if not cursor_str:
        return None
    try:
        padding = '=' * (-len(cursor_str) % 4)
        decoded = base64.urlsafe_b64decode(cursor_str + padding).decode("utf-8")
        val = int(decoded)
        return val if 0 < val <= 9007199254740991 else None
    except Exception:
        return None

def parse_pagination(query_params, default_limit=24, max_limit=100):
    def read_int(val, fallback, max_val):
        if val is None:
            return fallback
        if not isinstance(val, str) or not re.fullmatch(r"[1-9][0-9]*", val) or int(val) < 1 or int(val) > max_val:
            raise ValueError("Invalid pagination")
        return int(val)

    if hasattr(query_params, "getlist") and any(len(query_params.getlist(key)) > 1 for key in ("page", "limit", "cursor")):
        raise ValueError("Invalid pagination")

    page = read_int(query_params.get("page"), 1, 100000)
    limit = read_int(query_params.get("limit"), default_limit, max_limit)

    cursor = None
    if "cursor" in query_params:
        cursor_val = query_params.get("cursor")
        cursor = decode_cursor(cursor_val)
        if cursor is None or cursor < 1:
            raise ValueError("Invalid pagination")

    return page, limit, cursor

class EnvelopePagination(PageNumberPagination):
    page_size = 24
    page_size_query_param = 'limit'
    page_query_param = 'page'
    max_page_size = 100

    def get_paginated_response(self, data):
        has_more = self.page.has_next()
        page_num = self.page.number
        limit = self.get_page_size(self.request) or self.page_size
        next_cursor = None
        if has_more and data and isinstance(data, list) and len(data) > 0:
            last_item = data[-1]
            last_id = None
            if isinstance(last_item, dict) and 'id' in last_item:
                last_id = last_item['id']
            elif hasattr(last_item, 'id'):
                last_id = last_item.id
            if last_id is not None:
                next_cursor = encode_cursor(last_id)

        return Response({
            'success': True,
            'data': data,
            'pagination': {
                'page': page_num,
                'limit': limit,
                'hasMore': has_more,
                'nextCursor': next_cursor
            }
        })
