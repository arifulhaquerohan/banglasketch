from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from apps.authentication.auth import IsAdminUserAuthenticated, require_role
from .models import Video, Testimonial
from .serializers import VideoSerializer, TestimonialSerializer

# Public Video & Testimonial Views
class PublicVideoListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        qs = Video.objects.filter(published=True, deleted_at__isnull=True)
        if request.query_params.get("featured") == "true":
            qs = qs.filter(featured=True)
        qs = qs.order_by("display_order", "-id")
        serializer = VideoSerializer(qs, many=True)
        return Response({"success": True, "data": serializer.data})


class PublicTestimonialListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        qs = Testimonial.objects.filter(deleted_at__isnull=True)
        if request.query_params.get("featured") == "true":
            qs = qs.filter(featured=True)
        qs = qs.order_by("-id")
        serializer = TestimonialSerializer(qs, many=True)
        return Response({"success": True, "data": serializer.data})


# Admin Video Views
class AdminVideoListCreateView(APIView):
    permission_classes = [IsAdminUserAuthenticated, require_role("editor")]

    def get(self, request):
        trash = request.query_params.get("trash", "").lower() in ["true", "1"]
        if trash:
            qs = Video.objects.filter(deleted_at__isnull=False).order_by("-deleted_at")
        else:
            qs = Video.objects.filter(deleted_at__isnull=True).order_by("display_order", "-id")
        serializer = VideoSerializer(qs, many=True)
        return Response({"success": True, "data": serializer.data})

    def post(self, request):
        serializer = VideoSerializer(data=request.data)
        if serializer.is_valid():
            video = serializer.save()
            return Response({"success": True, "data": VideoSerializer(video).data}, status=201)
        return Response({"success": False, "error": serializer.errors}, status=400)


class AdminVideoDetailUpdateDeleteView(APIView):
    permission_classes = [IsAdminUserAuthenticated, require_role("editor")]

    def get(self, request, pk):
        video = Video.objects.filter(pk=pk, deleted_at__isnull=True).first()
        if not video:
            return Response({"success": False, "error": "Not found"}, status=404)
        return Response({"success": True, "data": VideoSerializer(video).data})

    def put(self, request, pk):
        video = Video.objects.filter(pk=pk, deleted_at__isnull=True).first()
        if not video:
            return Response({"success": False, "error": "Not found"}, status=404)

        serializer = VideoSerializer(video, data=request.data, partial=True)
        if serializer.is_valid():
            updated = serializer.save()
            return Response({"success": True, "data": VideoSerializer(updated).data})
        return Response({"success": False, "error": serializer.errors}, status=400)

    def delete(self, request, pk):
        video = Video.objects.filter(pk=pk, deleted_at__isnull=True).first()
        if not video:
            return Response({"success": False, "error": "Not found"}, status=404)

        video.deleted_at = timezone.now()
        video.save(update_fields=["deleted_at"])
        return Response({"success": True, "message": "Video deleted successfully"})


# Admin Testimonial Views
class AdminTestimonialListCreateView(APIView):
    permission_classes = [IsAdminUserAuthenticated, require_role("editor")]

    def get(self, request):
        trash = request.query_params.get("trash", "").lower() in ["true", "1"]
        if trash:
            qs = Testimonial.objects.filter(deleted_at__isnull=False).order_by("-deleted_at")
        else:
            qs = Testimonial.objects.filter(deleted_at__isnull=True).order_by("-id")
        serializer = TestimonialSerializer(qs, many=True)
        return Response({"success": True, "data": serializer.data})

    def post(self, request):
        serializer = TestimonialSerializer(data=request.data)
        if serializer.is_valid():
            t = serializer.save()
            return Response({"success": True, "data": TestimonialSerializer(t).data}, status=201)
        return Response({"success": False, "error": serializer.errors}, status=400)


class AdminTestimonialDetailUpdateDeleteView(APIView):
    permission_classes = [IsAdminUserAuthenticated, require_role("editor")]

    def get(self, request, pk):
        t = Testimonial.objects.filter(pk=pk, deleted_at__isnull=True).first()
        if not t:
            return Response({"success": False, "error": "Not found"}, status=404)
        return Response({"success": True, "data": TestimonialSerializer(t).data})

    def put(self, request, pk):
        t = Testimonial.objects.filter(pk=pk, deleted_at__isnull=True).first()
        if not t:
            return Response({"success": False, "error": "Not found"}, status=404)

        serializer = TestimonialSerializer(t, data=request.data, partial=True)
        if serializer.is_valid():
            updated = serializer.save()
            return Response({"success": True, "data": TestimonialSerializer(updated).data})
        return Response({"success": False, "error": serializer.errors}, status=400)

    def delete(self, request, pk):
        t = Testimonial.objects.filter(pk=pk, deleted_at__isnull=True).first()
        if not t:
            return Response({"success": False, "error": "Not found"}, status=404)

        t.deleted_at = timezone.now()
        t.save(update_fields=["deleted_at"])
        return Response({"success": True, "message": "Testimonial deleted successfully"})
