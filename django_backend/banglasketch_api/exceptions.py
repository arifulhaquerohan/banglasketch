from rest_framework.views import exception_handler
from rest_framework.response import Response

def custom_exception_handler(exc, context):
    response = exception_handler(exc, context)
    if response is not None:
        error_msg = "An error occurred"
        if isinstance(response.data, dict):
            if 'error' in response.data:
                error_msg = str(response.data['error'])
            elif 'detail' in response.data:
                error_msg = str(response.data['detail'])
            else:
                first_key = next(iter(response.data))
                val = response.data[first_key]
                if isinstance(val, list) and len(val) > 0:
                    error_msg = f"{first_key}: {val[0]}"
                else:
                    error_msg = f"{first_key}: {val}"
        elif isinstance(response.data, list) and len(response.data) > 0:
            error_msg = str(response.data[0])

        return Response({'success': False, 'error': error_msg}, status=response.status_code)

    return Response({'success': False, 'error': str(exc) or "Internal server error"}, status=500)
