import secrets
import datetime
from django.utils import timezone
from django.db import transaction
from django.db.models import Count, Q
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from apps.authentication.auth import IsAdminUserAuthenticated, require_role
from apps.authentication.models import AdminUser
from apps.core.models import AuditLog
from .models import (
    Client,
    Enquiry,
    EnquiryFollowUp,
    ClientProject,
    Proposal,
    ProposalVersion,
    ChangeOrder,
)
from .serializers import (
    ClientSerializer,
    EnquirySerializer,
    EnquiryFollowUpSerializer,
    ClientProjectSerializer,
    ProposalSerializer,
    ProposalVersionSerializer,
    ChangeOrderSerializer,
)


def format_dt(dt):
    if not dt:
        return None
    if hasattr(dt, "isoformat"):
        return dt.isoformat()
    return str(dt)


def serialize_enquiry_item(e):
    now = timezone.now()
    is_overdue = bool(
        e.next_follow_up_date
        and hasattr(e.next_follow_up_date, "__lt__")
        and e.next_follow_up_date < now
        and e.status not in ("closed", "handover", "active_project")
    )
    return {
        "id": e.id,
        "client_id": e.client_id,
        "client_name": e.client.name if e.client else e.name,
        "portal_token": e.client.portal_token if e.client else None,
        "name": e.name,
        "phone": e.phone,
        "email": e.email,
        "project_location": e.project_location,
        "property_type": e.property_type,
        "service_scope": e.service_scope,
        "approx_budget": e.approx_budget,
        "preferred_start_date": e.preferred_start_date,
        "notes": e.notes,
        "attachments": e.attachments or [],
        "status": e.status,
        "status_reason": e.status_reason,
        "assigned_to": e.assigned_to_id,
        "assigned_name": e.assigned_to.display_name if e.assigned_to else None,
        "next_action": e.next_action,
        "next_follow_up_date": format_dt(e.next_follow_up_date),
        "is_overdue": is_overdue,
        "created_at": format_dt(e.created_at),
        "updated_at": format_dt(e.updated_at),
    }


# ==========================================
# PUBLIC INTAKE & CLIENT PORTAL VIEWS
# ==========================================

class PublicEnquiryCreateView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        data = request.data
        website = data.get("website")
        started_at = data.get("started_at")

        # Honeypot spam trap
        if website:
            return Response({
                "success": True,
                "message": "Thank you! Your consultation request has been received.",
            }, status=201)

        # Quick-submit bot trap (< 1500ms between form render and submit)
        if started_at is not None:
            try:
                started = float(started_at)
                now_ms = timezone.now().timestamp() * 1000
                if now_ms - started < 1500:
                    return Response({
                        "success": False,
                        "error": "Please review your enquiry details and try again.",
                    }, status=400)
            except (ValueError, TypeError):
                pass

        name = (data.get("name") or "").strip()
        phone = (data.get("phone") or "").strip()
        email = (data.get("email") or "").strip()
        project_location = (data.get("project_location") or "").strip()
        property_type = (data.get("property_type") or "").strip()
        service_scope = (data.get("service_scope") or "").strip()
        approx_budget = data.get("approx_budget")
        preferred_start_date = data.get("preferred_start_date")
        notes = data.get("notes")
        attachments = data.get("attachments") or []

        if not name or not phone or not project_location:
            return Response({
                "success": False,
                "error": "Name, phone, and project location are required.",
            }, status=400)

        with transaction.atomic():
            # 1. Provision or associate Client by phone
            client = Client.objects.filter(phone=phone, deleted_at__isnull=True).first()
            if client:
                if email and not client.email:
                    client.email = email
                    client.save(update_fields=["email", "updated_at"])
            else:
                portal_token = secrets.token_hex(24)
                client = Client.objects.create(
                    name=name,
                    phone=phone,
                    email=email or None,
                    portal_token=portal_token,
                )

            # 2. Insert Enquiry with default 24h follow-up target
            default_next_action = "Initial call & qualification"
            next_follow_up = timezone.now() + datetime.timedelta(hours=24)
            enquiry = Enquiry.objects.create(
                client=client,
                name=name,
                phone=phone,
                email=email or None,
                project_location=project_location,
                property_type=property_type,
                service_scope=service_scope,
                approx_budget=approx_budget or None,
                preferred_start_date=preferred_start_date or None,
                notes=notes or None,
                attachments=attachments,
                status="new_enquiry",
                next_action=default_next_action,
                next_follow_up_date=next_follow_up,
            )

            # 3. Log initial system follow-up note
            EnquiryFollowUp.objects.create(
                enquiry=enquiry,
                channel="note",
                summary="Enquiry received via website intake form.",
                next_action=default_next_action,
                scheduled_at=next_follow_up,
            )

        return Response({
            "success": True,
            "data": {
                "id": enquiry.id,
                "clientId": client.id,
                "status": enquiry.status,
            },
            "message": "Thank you! Your enquiry has been received. Our team will contact you within 24 hours.",
        }, status=201)


class PublicPortalView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, token):
        if not token or len(token) < 16:
            return Response({"success": False, "error": "Invalid portal token"}, status=400)

        client = Client.objects.filter(portal_token=token, deleted_at__isnull=True).first()
        if not client:
            return Response({"success": False, "error": "Client portal not found or access link has expired"}, status=404)

        projects = ClientProject.objects.filter(client=client, deleted_at__isnull=True).order_by("-created_at")

        projects_data = []
        for p in projects:
            p_data = {
                "id": p.id,
                "title": p.title,
                "stage": p.stage,
                "current_milestone": p.current_milestone,
                "next_milestone": p.next_milestone,
                "agreed_scope": p.agreed_scope,
                "agreed_budget": str(p.agreed_budget),
                "target_completion_date": format_dt(p.target_completion_date),
                "project_manager_name": p.project_manager.display_name if p.project_manager else None,
                "created_at": format_dt(p.created_at),
                "updated_at": format_dt(p.updated_at),
                "proposals": [],
                "changeOrders": [],
            }

            # Proposals visible to client (sent, approved, superseded)
            proposals = Proposal.objects.filter(
                project=p,
                status__in=["sent", "approved", "superseded"],
            ).order_by("id")
            for prop in proposals:
                versions = ProposalVersion.objects.filter(proposal=prop).order_by("-version")
                p_data["proposals"].append({
                    "id": prop.id,
                    "title": prop.title,
                    "status": prop.status,
                    "approved_version": prop.approved_version,
                    "approved_at": format_dt(prop.approved_at),
                    "approval_notes": prop.approval_notes,
                    "versions": [
                        {
                            "id": v.id,
                            "version": v.version,
                            "scope_summary": v.scope_summary,
                            "proposed_cost": str(v.proposed_cost),
                            "timeline_days": v.timeline_days,
                            "documents": v.documents or [],
                            "created_at": format_dt(v.created_at),
                        }
                        for v in versions
                    ],
                })

            # Change orders visible to client
            change_orders = ChangeOrder.objects.filter(project=p).order_by("-created_at")
            p_data["changeOrders"] = [
                {
                    "id": co.id,
                    "project_id": co.project_id,
                    "title": co.title,
                    "description": co.description,
                    "proposed_cost": str(co.proposed_cost),
                    "timeline_impact_days": co.timeline_impact_days,
                    "status": co.status,
                    "client_notes": co.client_notes,
                    "decided_at": format_dt(co.decided_at),
                    "created_at": format_dt(co.created_at),
                }
                for co in change_orders
            ]

            projects_data.append(p_data)

        # Enquiries intake history
        enquiries = Enquiry.objects.filter(client=client, deleted_at__isnull=True).order_by("-created_at")
        enquiries_data = [
            {
                "id": e.id,
                "project_location": e.project_location,
                "property_type": e.property_type,
                "service_scope": e.service_scope,
                "status": e.status,
                "approx_budget": e.approx_budget,
                "created_at": format_dt(e.created_at),
            }
            for e in enquiries
        ]

        response = Response({
            "success": True,
            "data": {
                "client": {
                    "id": client.id,
                    "name": client.name,
                    "phone": client.phone,
                    "email": client.email,
                    "memberSince": format_dt(client.created_at),
                },
                "projects": projects_data,
                "enquiries": enquiries_data,
            }
        })
        response["Cache-Control"] = "private, no-cache, no-store, must-revalidate"
        return response


class PublicPortalProposalDecisionView(APIView):
    permission_classes = [AllowAny]

    @transaction.atomic
    def post(self, request, token, proposal_id):
        client = Client.objects.filter(portal_token=token, deleted_at__isnull=True).first()
        if not client:
            return Response({"success": False, "error": "Unauthorized or invalid portal token"}, status=401)

        proposal = Proposal.objects.select_for_update().filter(
            pk=proposal_id, project__client=client, project__deleted_at__isnull=True,
        ).first()
        if not proposal:
            return Response({"success": False, "error": "Proposal not found"}, status=404)

        decision = request.data.get("decision")
        notes = request.data.get("notes", "")
        requested_version = request.data.get("version")
        if decision not in ["approved", "rejected"] or not isinstance(notes, str):
            return Response({"success": False, "error": "A valid decision and text notes are required"}, status=400)
        if proposal.status != "sent":
            return Response({"success": False, "error": "Only sent proposals can receive a decision"}, status=409)

        version = None
        if decision == "approved":
            versions = ProposalVersion.objects.filter(proposal=proposal)
            if requested_version is not None:
                # Reject booleans, fractional numbers and malformed IDs before ORM coercion.
                if not isinstance(requested_version, (str, int)) or isinstance(requested_version, bool):
                    return Response({"success": False, "error": "Invalid proposal version"}, status=400)
                try:
                    version_number = int(requested_version)
                except (ValueError, TypeError):
                    return Response({"success": False, "error": "Invalid proposal version"}, status=400)
                if not 1 <= version_number <= 2147483647:
                    return Response({"success": False, "error": "Invalid proposal version"}, status=400)
                versions = versions.filter(version=version_number)
            version = versions.order_by("-version").first()
            if version is None:
                return Response({"success": False, "error": "Proposal version not found"}, status=404)

        proposal.status = decision
        proposal.approval_notes = notes
        if version is not None:
            proposal.approved_at = timezone.now()
            proposal.approved_version = version.version
            Proposal.objects.filter(project=proposal.project, status="approved").exclude(pk=proposal.pk).update(
                status="superseded", updated_at=timezone.now(),
            )
            ClientProject.objects.filter(pk=proposal.project_id).update(
                agreed_budget=version.proposed_cost, stage="approved", updated_at=timezone.now(),
            )
        proposal.save()
        return Response({"success": True, "message": f"Proposal marked as {decision}"})


class PublicPortalChangeOrderDecisionView(APIView):
    permission_classes = [AllowAny]

    @transaction.atomic
    def post(self, request, token, change_order_id):
        client = Client.objects.filter(portal_token=token, deleted_at__isnull=True).first()
        if not client:
            return Response({"success": False, "error": "Unauthorized or invalid portal token"}, status=401)

        change_order = ChangeOrder.objects.select_for_update().filter(
            pk=change_order_id, project__client=client, project__deleted_at__isnull=True,
        ).first()
        if not change_order:
            return Response({"success": False, "error": "Change order not found"}, status=404)

        decision = request.data.get("decision")
        notes = request.data.get("notes", "")
        if decision not in ["approved", "rejected"] or not isinstance(notes, str):
            return Response({"success": False, "error": "A valid decision and text notes are required"}, status=400)
        if change_order.status != "pending_approval":
            return Response({"success": False, "error": "This change order already has a decision"}, status=409)

        change_order.status = decision
        change_order.client_notes = notes
        change_order.decided_at = timezone.now()
        change_order.save()
        return Response({"success": True, "message": f"Change order marked as {decision}"})


# ==========================================
# ADMIN CLIENT HANDLING VIEWS
# ==========================================

class AdminClientDashboardView(APIView):
    permission_classes = [IsAdminUserAuthenticated, require_role("viewer")]

    def get(self, request):
        now = timezone.now()

        # Overdue follow-ups
        overdue_qs = Enquiry.objects.filter(
            deleted_at__isnull=True,
            next_follow_up_date__lt=now,
        ).exclude(
            status__in=["closed", "handover", "active_project"]
        ).select_related("assigned_to", "client").order_by("next_follow_up_date")

        overdue_count = overdue_qs.count()
        overdue_items = [
            {
                "id": e.id,
                "name": e.name,
                "phone": e.phone,
                "project_location": e.project_location,
                "status": e.status,
                "next_action": e.next_action,
                "next_follow_up_date": format_dt(e.next_follow_up_date),
                "assigned_to_name": e.assigned_to.display_name if e.assigned_to else None,
            }
            for e in overdue_qs[:10]
        ]

        # Change orders awaiting approval
        pending_co_qs = ChangeOrder.objects.filter(
            status="pending_approval"
        ).select_related("project__client").order_by("created_at")

        pending_count = pending_co_qs.count()
        pending_items = [
            {
                "id": co.id,
                "title": co.title,
                "proposed_cost": str(co.proposed_cost),
                "timeline_impact_days": co.timeline_impact_days,
                "created_at": format_dt(co.created_at),
                "project_id": co.project_id,
                "project_title": co.project.title if co.project else None,
                "client_name": co.project.client.name if co.project and co.project.client else None,
            }
            for co in pending_co_qs[:10]
        ]

        # New unassigned leads
        unassigned_qs = Enquiry.objects.filter(
            deleted_at__isnull=True,
            assigned_to__isnull=True,
            status="new_enquiry",
        ).order_by("-created_at")

        unassigned_count = unassigned_qs.count()
        unassigned_items = [
            {
                "id": e.id,
                "name": e.name,
                "phone": e.phone,
                "project_location": e.project_location,
                "property_type": e.property_type,
                "service_scope": e.service_scope,
                "created_at": format_dt(e.created_at),
            }
            for e in unassigned_qs[:10]
        ]

        # Pipeline stage distribution
        pipeline_counts = (
            Enquiry.objects.filter(deleted_at__isnull=True)
            .values("status")
            .annotate(c=Count("id"))
        )
        pipeline_map = {row["status"]: row["c"] for row in pipeline_counts}

        # Active projects count
        active_projects_count = ClientProject.objects.filter(
            deleted_at__isnull=True
        ).exclude(
            stage__in=["completed", "closed", "cancelled"]
        ).count()

        return Response({
            "success": True,
            "data": {
                "needsAttention": {
                    "overdueFollowUps": overdue_items,
                    "pendingChangeOrders": pending_items,
                    "unassignedLeads": unassigned_items,
                    "counts": {
                        "overdue": overdue_count,
                        "pendingApprovals": pending_count,
                        "unassigned": unassigned_count,
                    },
                },
                "pipeline": pipeline_map,
                "activeProjectsCount": active_projects_count,
            },
        })


class AdminEnquiryPipelineView(APIView):
    permission_classes = [IsAdminUserAuthenticated, require_role("viewer")]

    def get(self, request):
        stages = [
            "new_enquiry",
            "contacted",
            "consultation",
            "site_visit",
            "proposal_sent",
            "approved",
            "active_project",
            "handover",
            "on_hold",
            "closed",
        ]

        enquiries = (
            Enquiry.objects.filter(deleted_at__isnull=True)
            .select_related("assigned_to", "client")
            .order_by("-created_at", "-id")
        )

        board = {s: [] for s in stages}
        total = 0
        for e in enquiries:
            item = serialize_enquiry_item(e)
            if e.status in board:
                board[e.status].append(item)
            total += 1

        return Response({
            "success": True,
            "data": {
                "stages": stages,
                "columns": board,
                "total": total,
            },
        })


class AdminClientListCreateView(APIView):
    permission_classes = [IsAdminUserAuthenticated, require_role("editor")]

    def get(self, request):
        clients = Client.objects.filter(deleted_at__isnull=True).order_by("-created_at")
        serializer = ClientSerializer(clients, many=True)
        return Response({"success": True, "data": serializer.data})

    def post(self, request):
        serializer = ClientSerializer(data=request.data)
        if serializer.is_valid():
            client = serializer.save()
            if not client.portal_token:
                client.portal_token = secrets.token_hex(24)
                client.save(update_fields=["portal_token"])
            return Response({"success": True, "data": ClientSerializer(client).data}, status=201)
        return Response({"success": False, "error": serializer.errors}, status=400)


class AdminClientDetailUpdateDeleteView(APIView):
    permission_classes = [IsAdminUserAuthenticated, require_role("editor")]

    def get(self, request, pk):
        client = Client.objects.filter(pk=pk, deleted_at__isnull=True).first()
        if not client:
            return Response({"success": False, "error": "Not found"}, status=404)
        return Response({"success": True, "data": ClientSerializer(client).data})

    def put(self, request, pk):
        client = Client.objects.filter(pk=pk, deleted_at__isnull=True).first()
        if not client:
            return Response({"success": False, "error": "Not found"}, status=404)

        serializer = ClientSerializer(client, data=request.data, partial=True)
        if serializer.is_valid():
            updated = serializer.save()
            return Response({"success": True, "data": ClientSerializer(updated).data})
        return Response({"success": False, "error": serializer.errors}, status=400)

    def delete(self, request, pk):
        client = Client.objects.filter(pk=pk, deleted_at__isnull=True).first()
        if not client:
            return Response({"success": False, "error": "Not found"}, status=404)

        client.deleted_at = timezone.now()
        client.save(update_fields=["deleted_at"])
        return Response({"success": True, "message": "Client deleted successfully"})


class AdminEnquiryListCreateView(APIView):
    permission_classes = [IsAdminUserAuthenticated, require_role("editor")]

    def get(self, request):
        qs = Enquiry.objects.filter(deleted_at__isnull=True).select_related("assigned_to", "client")

        # Filters
        status = request.query_params.get("status")
        if status:
            qs = qs.filter(status=status)

        assigned_to = request.query_params.get("assigned_to")
        if assigned_to:
            try:
                qs = qs.filter(assigned_to_id=int(assigned_to))
            except (ValueError, TypeError):
                return Response({"success": False, "error": "Invalid assigned_to"}, status=400)

        needs_attention = request.query_params.get("needs_attention")
        if needs_attention == "true":
            now = timezone.now()
            qs = qs.filter(
                (
                    Q(next_follow_up_date__lt=now)
                    & ~Q(status__in=["closed", "handover", "active_project"])
                )
                | (Q(assigned_to__isnull=True) & Q(status="new_enquiry"))
                | (
                    (Q(next_action__isnull=True) | Q(next_action=""))
                    & ~Q(status__in=["closed", "handover"])
                )
            )

        search = (request.query_params.get("search") or "").strip().lower()
        if search:
            qs = qs.filter(
                Q(name__icontains=search)
                | Q(phone__icontains=search)
                | Q(email__icontains=search)
                | Q(project_location__icontains=search)
            )

        try:
            page = max(1, int(request.query_params.get("page", 1)))
        except (ValueError, TypeError):
            page = 1
        try:
            limit = min(200, max(1, int(request.query_params.get("limit", 24))))
        except (ValueError, TypeError):
            limit = 24

        offset = (page - 1) * limit
        items = qs.order_by("-created_at", "-id")[offset : offset + limit + 1]
        has_more = len(items) > limit
        page_items = items[:limit]

        data = [serialize_enquiry_item(e) for e in page_items]

        return Response({
            "success": True,
            "data": data,
            "pagination": {
                "page": page,
                "limit": limit,
                "hasMore": has_more,
            },
        })

    def post(self, request):
        serializer = EnquirySerializer(data=request.data)
        if serializer.is_valid():
            enquiry = serializer.save()
            return Response({"success": True, "data": serialize_enquiry_item(enquiry)}, status=201)
        return Response({"success": False, "error": serializer.errors}, status=400)


class AdminEnquiryDetailUpdateDeleteView(APIView):
    permission_classes = [IsAdminUserAuthenticated, require_role("editor")]

    def get(self, request, pk):
        enquiry = (
            Enquiry.objects.filter(pk=pk, deleted_at__isnull=True)
            .select_related("assigned_to", "client")
            .first()
        )
        if not enquiry:
            return Response({"success": False, "error": "Enquiry not found"}, status=404)

        follow_ups = (
            EnquiryFollowUp.objects.filter(enquiry=enquiry)
            .select_related("actor")
            .order_by("-created_at")
        )

        enquiry_data = serialize_enquiry_item(enquiry)
        if enquiry.client:
            enquiry_data.update({
                "client_phone": enquiry.client.phone,
                "client_email": enquiry.client.email,
                "client_alt_phone": enquiry.client.alternate_phone,
                "client_notes": enquiry.client.notes,
            })

        follow_ups_data = [
            {
                "id": fu.id,
                "enquiry_id": fu.enquiry_id,
                "actor_id": fu.actor_id,
                "actor_name": fu.actor.display_name if fu.actor else None,
                "channel": fu.channel,
                "summary": fu.summary,
                "next_action": fu.next_action,
                "scheduled_at": format_dt(fu.scheduled_at),
                "created_at": format_dt(fu.created_at),
            }
            for fu in follow_ups
        ]

        return Response({
            "success": True,
            "data": {
                "enquiry": enquiry_data,
                "followUps": follow_ups_data,
            },
        })

    def patch(self, request, pk):
        enquiry = Enquiry.objects.filter(pk=pk, deleted_at__isnull=True).first()
        if not enquiry:
            return Response({"success": False, "error": "Enquiry not found"}, status=404)

        before_status = enquiry.status
        allowed_fields = [
            "status",
            "status_reason",
            "assigned_to",
            "next_action",
            "next_follow_up_date",
            "notes",
        ]

        updated = False
        for field in allowed_fields:
            if field in request.data:
                val = request.data[field]
                if field == "assigned_to":
                    if val is None or val == "":
                        enquiry.assigned_to = None
                    else:
                        admin_user = AdminUser.objects.filter(pk=val).first()
                        if admin_user:
                            enquiry.assigned_to = admin_user
                    updated = True
                elif field == "next_follow_up_date":
                    enquiry.next_follow_up_date = val if val else None
                    updated = True
                else:
                    setattr(enquiry, field, val if val != "" else None)
                    updated = True

        if not updated:
            return Response({"success": False, "error": "No fields provided to update"}, status=400)

        enquiry.save()

        # If status changed, automatically log a follow-up note
        if before_status != enquiry.status:
            summary = f'Stage updated from "{before_status}" to "{enquiry.status}"'
            if enquiry.status_reason:
                summary += f" ({enquiry.status_reason})"

            EnquiryFollowUp.objects.create(
                enquiry=enquiry,
                actor=request.user if hasattr(request.user, "id") else None,
                channel="note",
                summary=summary,
                next_action=enquiry.next_action,
                scheduled_at=enquiry.next_follow_up_date,
            )

        return Response({"success": True, "data": serialize_enquiry_item(enquiry)})

    def delete(self, request, pk):
        enquiry = Enquiry.objects.filter(pk=pk, deleted_at__isnull=True).first()
        if not enquiry:
            return Response({"success": False, "error": "Enquiry not found"}, status=404)

        enquiry.deleted_at = timezone.now()
        enquiry.save(update_fields=["deleted_at"])
        return Response({"success": True, "message": "Enquiry deleted successfully"})


class AdminEnquiryFollowUpCreateView(APIView):
    permission_classes = [IsAdminUserAuthenticated, require_role("editor")]

    def post(self, request, enquiry_id):
        enquiry = Enquiry.objects.filter(pk=enquiry_id, deleted_at__isnull=True).first()
        if not enquiry:
            return Response({"success": False, "error": "Enquiry not found"}, status=404)

        channel = request.data.get("channel", "call")
        summary = (request.data.get("summary") or "").strip()
        next_action = request.data.get("next_action")
        scheduled_at = request.data.get("scheduled_at")

        if not summary:
            return Response({"success": False, "error": "Follow-up summary is required"}, status=400)

        with transaction.atomic():
            fu = EnquiryFollowUp.objects.create(
                enquiry=enquiry,
                actor=request.user if hasattr(request.user, "id") else None,
                channel=channel,
                summary=summary,
                next_action=next_action or None,
                scheduled_at=scheduled_at or None,
            )

            # Synchronize enquiry next action / date if provided
            update_fields = ["updated_at"]
            if next_action:
                enquiry.next_action = next_action
                update_fields.append("next_action")
            if scheduled_at:
                enquiry.next_follow_up_date = scheduled_at
                update_fields.append("next_follow_up_date")
            enquiry.save(update_fields=update_fields)

        return Response({
            "success": True,
            "data": {
                "id": fu.id,
                "enquiry_id": fu.enquiry_id,
                "actor_id": fu.actor_id,
                "actor_name": request.user.display_name if hasattr(request.user, "display_name") else None,
                "channel": fu.channel,
                "summary": fu.summary,
                "next_action": fu.next_action,
                "scheduled_at": format_dt(fu.scheduled_at),
                "created_at": format_dt(fu.created_at),
            },
        }, status=201)


class AdminEnquiryConvertToProjectView(APIView):
    permission_classes = [IsAdminUserAuthenticated, require_role("editor")]

    def post(self, request, id):
        with transaction.atomic():
            enquiry = Enquiry.objects.select_for_update().filter(pk=id, deleted_at__isnull=True).first()
            if not enquiry:
                return Response({"success": False, "error": "Enquiry not found"}, status=404)

            # Prevent duplicate conversion
            existing = ClientProject.objects.filter(enquiry=enquiry, deleted_at__isnull=True).first()
            if existing:
                return Response({
                    "success": True,
                    "data": ClientProjectSerializer(existing).data,
                    "message": "Enquiry was already converted to project.",
                })

            # Ensure client exists
            client = enquiry.client
            if not client:
                client = Client.objects.filter(phone=enquiry.phone, deleted_at__isnull=True).first()
                if not client:
                    client = Client.objects.create(
                        name=enquiry.name,
                        phone=enquiry.phone,
                        email=enquiry.email or None,
                        portal_token=secrets.token_hex(24),
                    )
                enquiry.client = client
                enquiry.save(update_fields=["client"])

            title = request.data.get("title") or f"{enquiry.name}'s {enquiry.property_type or 'Interior'} Project"
            agreed_scope = request.data.get("agreed_scope") or enquiry.notes or "Agreed architectural and interior design scope"
            agreed_budget = request.data.get("agreed_budget") or 0
            pm_id = request.data.get("project_manager_id") or enquiry.assigned_to_id or (request.user.id if hasattr(request.user, "id") else None)

            pm_user = AdminUser.objects.filter(pk=pm_id).first() if pm_id else None

            project = ClientProject.objects.create(
                client=client,
                enquiry=enquiry,
                title=title,
                stage="active_project",
                current_milestone="Kickoff & Concept Confirmation",
                next_milestone="Detailed Architectural Layout",
                project_manager=pm_user,
                agreed_scope=agreed_scope,
                agreed_budget=agreed_budget,
            )

            enquiry.status = "active_project"
            enquiry.next_action = "Project onboarding & kickoff meeting"
            enquiry.save(update_fields=["status", "next_action", "updated_at"])

            EnquiryFollowUp.objects.create(
                enquiry=enquiry,
                actor=request.user if hasattr(request.user, "id") else None,
                channel="note",
                summary=f"Promoted to active client project #{project.id}",
                next_action="Project onboarding & kickoff meeting",
            )

        return Response({
            "success": True,
            "data": ClientProjectSerializer(project).data,
            "message": "Enquiry successfully promoted to active project.",
        }, status=201)


class AdminClientProjectListCreateView(APIView):
    permission_classes = [IsAdminUserAuthenticated, require_role("editor")]

    def get(self, request):
        qs = ClientProject.objects.filter(deleted_at__isnull=True).select_related("client", "project_manager")

        stage = request.query_params.get("stage")
        if stage:
            qs = qs.filter(stage=stage)

        client_id = request.query_params.get("client_id")
        if client_id:
            try:
                qs = qs.filter(client_id=int(client_id))
            except (ValueError, TypeError):
                return Response({"success": False, "error": "Invalid client_id"}, status=400)

        try:
            page = max(1, int(request.query_params.get("page", 1)))
        except (ValueError, TypeError):
            page = 1
        try:
            limit = min(200, max(1, int(request.query_params.get("limit", 24))))
        except (ValueError, TypeError):
            limit = 24

        offset = (page - 1) * limit
        items = qs.order_by("-created_at", "-id")[offset : offset + limit + 1]
        has_more = len(items) > limit
        page_items = items[:limit]

        # Annotate with pending change orders count
        data = []
        for cp in page_items:
            pending_co_count = ChangeOrder.objects.filter(project=cp, status="pending_approval").count()
            data.append({
                "id": cp.id,
                "client_id": cp.client_id,
                "client_name": cp.client.name if cp.client else None,
                "client_phone": cp.client.phone if cp.client else None,
                "client_email": cp.client.email if cp.client else None,
                "enquiry_id": cp.enquiry_id,
                "title": cp.title,
                "stage": cp.stage,
                "current_milestone": cp.current_milestone,
                "next_milestone": cp.next_milestone,
                "project_manager_id": cp.project_manager_id,
                "project_manager_name": cp.project_manager.display_name if cp.project_manager else None,
                "agreed_scope": cp.agreed_scope,
                "agreed_budget": str(cp.agreed_budget),
                "target_completion_date": format_dt(cp.target_completion_date),
                "pending_change_orders_count": pending_co_count,
                "created_at": format_dt(cp.created_at),
                "updated_at": format_dt(cp.updated_at),
            })

        return Response({
            "success": True,
            "data": data,
            "pagination": {
                "page": page,
                "limit": limit,
                "hasMore": has_more,
            },
        })

    def post(self, request):
        serializer = ClientProjectSerializer(data=request.data)
        if serializer.is_valid():
            cp = serializer.save()
            return Response({"success": True, "data": ClientProjectSerializer(cp).data}, status=201)
        return Response({"success": False, "error": serializer.errors}, status=400)


class AdminClientProjectDetailUpdateDeleteView(APIView):
    permission_classes = [IsAdminUserAuthenticated, require_role("editor")]

    def get(self, request, pk):
        cp = (
            ClientProject.objects.filter(pk=pk, deleted_at__isnull=True)
            .select_related("client", "project_manager")
            .first()
        )
        if not cp:
            return Response({"success": False, "error": "Project not found"}, status=404)

        proposals = Proposal.objects.filter(project=cp).order_by("-created_at", "-id")
        proposals_data = []
        for p in proposals:
            versions = ProposalVersion.objects.filter(proposal=p).order_by("-version")
            proposals_data.append({
                "id": p.id,
                "project_id": p.project_id,
                "title": p.title,
                "status": p.status,
                "approved_version": p.approved_version,
                "approved_at": format_dt(p.approved_at),
                "approval_notes": p.approval_notes,
                "versions": [
                    {
                        "id": v.id,
                        "version": v.version,
                        "scope_summary": v.scope_summary,
                        "proposed_cost": str(v.proposed_cost),
                        "timeline_days": v.timeline_days,
                        "documents": v.documents or [],
                        "created_at": format_dt(v.created_at),
                    }
                    for v in versions
                ],
                "created_at": format_dt(p.created_at),
                "updated_at": format_dt(p.updated_at),
            })

        change_orders = (
            ChangeOrder.objects.filter(project=cp)
            .select_related("requested_by")
            .order_by("-created_at", "-id")
        )
        change_orders_data = [
            {
                "id": co.id,
                "project_id": co.project_id,
                "title": co.title,
                "description": co.description,
                "proposed_cost": str(co.proposed_cost),
                "timeline_impact_days": co.timeline_impact_days,
                "status": co.status,
                "client_notes": co.client_notes,
                "decided_at": format_dt(co.decided_at),
                "requested_by": co.requested_by_id,
                "requested_by_name": co.requested_by.display_name if co.requested_by else None,
                "created_at": format_dt(co.created_at),
                "updated_at": format_dt(co.updated_at),
            }
            for co in change_orders
        ]

        project_data = {
            "id": cp.id,
            "client_id": cp.client_id,
            "client_name": cp.client.name if cp.client else None,
            "client_phone": cp.client.phone if cp.client else None,
            "client_email": cp.client.email if cp.client else None,
            "portal_token": cp.client.portal_token if cp.client else None,
            "enquiry_id": cp.enquiry_id,
            "title": cp.title,
            "stage": cp.stage,
            "current_milestone": cp.current_milestone,
            "next_milestone": cp.next_milestone,
            "project_manager_id": cp.project_manager_id,
            "project_manager_name": cp.project_manager.display_name if cp.project_manager else None,
            "agreed_scope": cp.agreed_scope,
            "agreed_budget": str(cp.agreed_budget),
            "target_completion_date": format_dt(cp.target_completion_date),
            "created_at": format_dt(cp.created_at),
            "updated_at": format_dt(cp.updated_at),
        }

        return Response({
            "success": True,
            "data": {
                "project": project_data,
                "proposals": proposals_data,
                "changeOrders": change_orders_data,
            },
        })

    def patch(self, request, pk):
        cp = ClientProject.objects.filter(pk=pk, deleted_at__isnull=True).first()
        if not cp:
            return Response({"success": False, "error": "Project not found"}, status=404)

        allowed_fields = [
            "stage",
            "current_milestone",
            "next_milestone",
            "project_manager_id",
            "agreed_scope",
            "agreed_budget",
            "target_completion_date",
        ]

        updated = False
        for field in allowed_fields:
            if field in request.data:
                val = request.data[field]
                if field == "project_manager_id":
                    if val is None or val == "":
                        cp.project_manager = None
                    else:
                        admin_user = AdminUser.objects.filter(pk=val).first()
                        if admin_user:
                            cp.project_manager = admin_user
                    updated = True
                elif field == "target_completion_date":
                    cp.target_completion_date = val if val else None
                    updated = True
                else:
                    setattr(cp, field, val if val != "" else None)
                    updated = True

        if not updated:
            return Response({"success": False, "error": "No fields to update"}, status=400)

        cp.save()
        return Response({"success": True, "data": ClientProjectSerializer(cp).data})

    def delete(self, request, pk):
        cp = ClientProject.objects.filter(pk=pk, deleted_at__isnull=True).first()
        if not cp:
            return Response({"success": False, "error": "Project not found"}, status=404)

        cp.deleted_at = timezone.now()
        cp.save(update_fields=["deleted_at"])
        return Response({"success": True, "message": "Client project deleted successfully"})


class AdminProposalCreateView(APIView):
    permission_classes = [IsAdminUserAuthenticated, require_role("editor")]

    def post(self, request, id):
        cp = ClientProject.objects.filter(pk=id, deleted_at__isnull=True).first()
        if not cp:
            return Response({"success": False, "error": "Project not found"}, status=404)

        title = (request.data.get("title") or "").strip()
        scope_summary = (request.data.get("scope_summary") or "").strip()
        proposed_cost = request.data.get("proposed_cost")
        timeline_days = request.data.get("timeline_days")
        documents = request.data.get("documents") or []

        if not title or not scope_summary or proposed_cost is None:
            return Response({"success": False, "error": "Title, scope summary, and proposed cost are required"}, status=400)

        with transaction.atomic():
            proposal = Proposal.objects.create(
                project=cp,
                title=title,
                status="draft",
            )
            version = ProposalVersion.objects.create(
                proposal=proposal,
                version=1,
                scope_summary=scope_summary,
                proposed_cost=proposed_cost,
                timeline_days=timeline_days or None,
                documents=documents,
                actor=request.user if hasattr(request.user, "id") else None,
            )

        return Response({
            "success": True,
            "data": {
                "id": proposal.id,
                "project_id": proposal.project_id,
                "title": proposal.title,
                "status": proposal.status,
                "version": {
                    "id": version.id,
                    "version": version.version,
                    "scope_summary": version.scope_summary,
                    "proposed_cost": str(version.proposed_cost),
                    "timeline_days": version.timeline_days,
                    "documents": version.documents,
                    "created_at": format_dt(version.created_at),
                },
            },
        }, status=201)


class AdminProposalVersionCreateView(APIView):
    permission_classes = [IsAdminUserAuthenticated, require_role("editor")]

    def post(self, request, id):
        proposal = Proposal.objects.filter(pk=id).first()
        if not proposal:
            return Response({"success": False, "error": "Proposal not found"}, status=404)

        scope_summary = (request.data.get("scope_summary") or "").strip()
        proposed_cost = request.data.get("proposed_cost")
        timeline_days = request.data.get("timeline_days")
        documents = request.data.get("documents") or []

        if not scope_summary or proposed_cost is None:
            return Response({"success": False, "error": "Scope summary and proposed cost are required"}, status=400)

        with transaction.atomic():
            max_v = ProposalVersion.objects.filter(proposal=proposal).order_by("-version").first()
            next_version = (max_v.version + 1) if max_v else 1

            version = ProposalVersion.objects.create(
                proposal=proposal,
                version=next_version,
                scope_summary=scope_summary,
                proposed_cost=proposed_cost,
                timeline_days=timeline_days or None,
                documents=documents,
                actor=request.user if hasattr(request.user, "id") else None,
            )
            proposal.updated_at = timezone.now()
            proposal.save(update_fields=["updated_at"])

        return Response({
            "success": True,
            "data": {
                "id": version.id,
                "proposal_id": version.proposal_id,
                "version": version.version,
                "scope_summary": version.scope_summary,
                "proposed_cost": str(version.proposed_cost),
                "timeline_days": version.timeline_days,
                "documents": version.documents,
                "created_at": format_dt(version.created_at),
            },
        }, status=201)


class AdminProposalApproveView(APIView):
    permission_classes = [IsAdminUserAuthenticated, require_role("editor")]

    def post(self, request, id):
        proposal = Proposal.objects.filter(pk=id, project__deleted_at__isnull=True).first()
        if not proposal:
            return Response({"success": False, "error": "Proposal not found"}, status=404)

        if proposal.status not in ("draft", "sent"):
            return Response({"success": False, "error": "Only draft or sent proposals can be approved"}, status=409)

        req_version = request.data.get("version")
        approval_notes = request.data.get("approval_notes", "Client signed off on scope & cost")

        with transaction.atomic():
            if req_version is not None:
                # Validate version input — reject booleans, fractional numbers, and out-of-range values.
                if not isinstance(req_version, (str, int)) or isinstance(req_version, bool):
                    return Response({"success": False, "error": "Invalid proposal version"}, status=400)
                try:
                    version_number = int(req_version)
                except (ValueError, TypeError):
                    return Response({"success": False, "error": "Invalid proposal version"}, status=400)
                if not 1 <= version_number <= 2147483647:
                    return Response({"success": False, "error": "Invalid proposal version"}, status=400)
                version = ProposalVersion.objects.select_for_update().filter(proposal=proposal, version=version_number).first()
            else:
                version = ProposalVersion.objects.select_for_update().filter(proposal=proposal).order_by("-version").first()

            if not version:
                return Response({"success": False, "error": "Specified proposal version not found"}, status=404)

            # Lock and re-fetch the proposal to prevent race conditions
            proposal = Proposal.objects.select_for_update().get(pk=proposal.pk)

            # Mark earlier proposals for this project as superseded (only if they are currently approved)
            Proposal.objects.select_for_update().filter(
                project_id=proposal.project_id,
                status="approved",
            ).exclude(pk=proposal.id).update(status="superseded", updated_at=timezone.now())

            proposal.status = "approved"
            proposal.approved_version = version.version
            proposal.approved_at = timezone.now()
            proposal.approval_notes = approval_notes
            proposal.save(update_fields=["status", "approved_version", "approved_at", "approval_notes", "updated_at"])

            # Update baseline agreed budget on project
            project = proposal.project
            project.agreed_budget = version.proposed_cost
            project.stage = "approved"
            project.save(update_fields=["agreed_budget", "stage", "updated_at"])

        return Response({
            "success": True,
            "data": {
                "proposal": ProposalSerializer(proposal).data,
                "approvedVersion": ProposalVersionSerializer(version).data,
            },
            "message": f"Proposal #{id} approved at Version {version.version}. Baseline agreed budget updated.",
        })


class AdminChangeOrderCreateView(APIView):
    permission_classes = [IsAdminUserAuthenticated, require_role("editor")]

    def post(self, request, id):
        cp = ClientProject.objects.filter(pk=id, deleted_at__isnull=True).first()
        if not cp:
            return Response({"success": False, "error": "Project not found"}, status=404)

        title = (request.data.get("title") or "").strip()
        description = (request.data.get("description") or "").strip()
        proposed_cost = request.data.get("proposed_cost", 0)
        timeline_impact_days = request.data.get("timeline_impact_days", 0)

        if not title:
            return Response({"success": False, "error": "Title is required"}, status=400)

        co = ChangeOrder.objects.create(
            project=cp,
            title=title,
            description=description,
            proposed_cost=proposed_cost,
            timeline_impact_days=timeline_impact_days or 0,
            status="pending_approval",
            requested_by=request.user if hasattr(request.user, "id") else None,
        )

        return Response({
            "success": True,
            "data": ChangeOrderSerializer(co).data,
            "message": "Change order logged and awaiting client approval.",
        }, status=201)


class AdminChangeOrderDecisionView(APIView):
    permission_classes = [IsAdminUserAuthenticated, require_role("editor")]

    def post(self, request, id):
        co = ChangeOrder.objects.filter(pk=id).first()
        if not co:
            return Response({"success": False, "error": "Change order not found"}, status=404)

        status_val = request.data.get("status")
        client_notes = request.data.get("client_notes")

        if status_val not in ["approved", "rejected"]:
            return Response({"success": False, "error": "Status must be 'approved' or 'rejected'"}, status=400)

        co.status = status_val
        co.client_notes = client_notes or None
        co.decided_at = timezone.now()
        co.save(update_fields=["status", "client_notes", "decided_at", "updated_at"])

        return Response({
            "success": True,
            "data": ChangeOrderSerializer(co).data,
            "message": f"Change order #{id} has been marked as {status_val}.",
        })
