from django.db.models import Q, F
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from banglasketch_api.pagination import EnvelopePagination
from apps.authentication.auth import IsAdminUserAuthenticated, require_role
from .models import BlogPost
from .serializers import BlogPostSerializer

class PublicBlogPostListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        now = timezone.now()
        qs = BlogPost.objects.filter(
            published=True,
            deleted_at__isnull=True,
        ).filter(
            Q(scheduled_publish_date__isnull=True) | Q(scheduled_publish_date__lte=now)
        )

        category = request.query_params.get("category")
        if category and category.lower() != "all":
            qs = qs.filter(category__iexact=category)

        featured = request.query_params.get("featured")
        if featured == "true":
            qs = qs.filter(featured=True)

        search = request.query_params.get("search")
        if search:
            qs = qs.filter(
                Q(title__icontains=search)
                | Q(excerpt__icontains=search)
                | Q(content__icontains=search)
            )

        cursor = request.query_params.get("cursor")
        if cursor and cursor.isdigit():
            qs = qs.filter(id__lt=int(cursor))

        qs = qs.order_by("-published_date", "-id")

        paginator = EnvelopePagination()
        page = paginator.paginate_queryset(qs, request)
        if page is not None:
            serializer = BlogPostSerializer(page, many=True)
            return paginator.get_paginated_response(serializer.data)

        serializer = BlogPostSerializer(qs, many=True)
        return Response({"success": True, "data": serializer.data})


class PublicBlogPostDetailView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, slug):
        now = timezone.now()
        post = BlogPost.objects.filter(
            slug=slug,
            published=True,
            deleted_at__isnull=True,
        ).filter(
            Q(scheduled_publish_date__isnull=True) | Q(scheduled_publish_date__lte=now)
        ).first()

        if not post:
            return Response({"success": False, "error": "Not found"}, status=404)

        BlogPost.objects.filter(pk=post.pk).update(views_count=F("views_count") + 1)
        post.refresh_from_db(fields=["views_count"])

        serializer = BlogPostSerializer(post)
        return Response({"success": True, "data": serializer.data})


class AdminBlogPostListCreateView(APIView):
    permission_classes = [IsAdminUserAuthenticated, require_role("editor")]

    def get(self, request):
        trash = request.query_params.get("trash", "").lower() in ["true", "1"]
        if trash:
            qs = BlogPost.objects.filter(deleted_at__isnull=False).order_by("-deleted_at")
        else:
            qs = BlogPost.objects.filter(deleted_at__isnull=True).order_by("-id")
        paginator = EnvelopePagination()
        page = paginator.paginate_queryset(qs, request)
        if page is not None:
            serializer = BlogPostSerializer(page, many=True)
            return paginator.get_paginated_response(serializer.data)

        serializer = BlogPostSerializer(qs, many=True)
        return Response({"success": True, "data": serializer.data})

    def post(self, request):
        serializer = BlogPostSerializer(data=request.data)
        if serializer.is_valid():
            post = serializer.save()
            return Response({"success": True, "data": BlogPostSerializer(post).data}, status=201)
        return Response({"success": False, "error": serializer.errors}, status=400)


class AdminBlogPostDetailUpdateDeleteView(APIView):
    permission_classes = [IsAdminUserAuthenticated, require_role("editor")]

    def get(self, request, pk):
        post = BlogPost.objects.filter(pk=pk, deleted_at__isnull=True).first()
        if not post:
            return Response({"success": False, "error": "Not found"}, status=404)
        return Response({"success": True, "data": BlogPostSerializer(post).data})

    def put(self, request, pk):
        post = BlogPost.objects.filter(pk=pk, deleted_at__isnull=True).first()
        if not post:
            return Response({"success": False, "error": "Not found"}, status=404)

        serializer = BlogPostSerializer(post, data=request.data, partial=True)
        if serializer.is_valid():
            updated = serializer.save()
            return Response({"success": True, "data": BlogPostSerializer(updated).data})
        return Response({"success": False, "error": serializer.errors}, status=400)

    def delete(self, request, pk):
        post = BlogPost.objects.filter(pk=pk, deleted_at__isnull=True).first()
        if not post:
            return Response({"success": False, "error": "Not found"}, status=404)

        post.deleted_at = timezone.now()
        post.save(update_fields=["deleted_at"])
        return Response({"success": True, "message": "Blog post deleted successfully"})
