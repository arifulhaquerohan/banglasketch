from rest_framework import serializers
from .models import (
    Client,
    Enquiry,
    EnquiryFollowUp,
    ClientProject,
    Proposal,
    ProposalVersion,
    ChangeOrder,
)

class ClientSerializer(serializers.ModelSerializer):
    class Meta:
        model = Client
        fields = [
            "id",
            "name",
            "phone",
            "email",
            "alternate_phone",
            "address",
            "portal_token",
            "portal_token_expires_at",
            "notes",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "portal_token", "portal_token_expires_at", "created_at", "updated_at"]


class EnquiryFollowUpSerializer(serializers.ModelSerializer):
    actor_name = serializers.CharField(source="actor.display_name", read_only=True)

    class Meta:
        model = EnquiryFollowUp
        fields = [
            "id",
            "enquiry",
            "actor",
            "actor_name",
            "channel",
            "summary",
            "next_action",
            "scheduled_at",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]


class EnquirySerializer(serializers.ModelSerializer):
    follow_ups = EnquiryFollowUpSerializer(many=True, read_only=True)
    assigned_name = serializers.CharField(source="assigned_to.display_name", read_only=True)

    class Meta:
        model = Enquiry
        fields = [
            "id",
            "client",
            "name",
            "phone",
            "email",
            "project_location",
            "property_type",
            "service_scope",
            "approx_budget",
            "preferred_start_date",
            "notes",
            "attachments",
            "status",
            "status_reason",
            "assigned_to",
            "assigned_name",
            "next_action",
            "next_follow_up_date",
            "follow_ups",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class ProposalVersionSerializer(serializers.ModelSerializer):
    actor_name = serializers.CharField(source="actor.display_name", read_only=True)

    class Meta:
        model = ProposalVersion
        fields = [
            "id",
            "proposal",
            "version",
            "scope_summary",
            "proposed_cost",
            "timeline_days",
            "documents",
            "actor",
            "actor_name",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]


class ProposalSerializer(serializers.ModelSerializer):
    versions = ProposalVersionSerializer(many=True, read_only=True)

    class Meta:
        model = Proposal
        fields = [
            "id",
            "project",
            "title",
            "status",
            "approved_version",
            "approved_at",
            "approval_notes",
            "versions",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class ChangeOrderSerializer(serializers.ModelSerializer):
    requested_by_name = serializers.CharField(source="requested_by.display_name", read_only=True)

    class Meta:
        model = ChangeOrder
        fields = [
            "id",
            "project",
            "title",
            "description",
            "proposed_cost",
            "timeline_impact_days",
            "status",
            "client_notes",
            "decided_at",
            "requested_by",
            "requested_by_name",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class ClientProjectSerializer(serializers.ModelSerializer):
    client_name = serializers.CharField(source="client.name", read_only=True)
    project_manager_name = serializers.CharField(source="project_manager.display_name", read_only=True)
    proposals = ProposalSerializer(many=True, read_only=True)
    change_orders = ChangeOrderSerializer(many=True, read_only=True)

    class Meta:
        model = ClientProject
        fields = [
            "id",
            "client",
            "client_name",
            "enquiry",
            "title",
            "stage",
            "current_milestone",
            "next_milestone",
            "project_manager",
            "project_manager_name",
            "agreed_scope",
            "agreed_budget",
            "target_completion_date",
            "proposals",
            "change_orders",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class ProposalDocumentInputSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=255)
    url = serializers.URLField(max_length=2048)
    type = serializers.CharField(max_length=100, required=False, allow_blank=True)
    size = serializers.IntegerField(min_value=0, required=False)

    def validate_url(self, value):
        if not value.lower().startswith(("https://", "http://")):
            raise serializers.ValidationError("Document links must use HTTP or HTTPS.")
        return value


class ProposalVersionInputSerializer(serializers.Serializer):
    scope_summary = serializers.CharField()
    proposed_cost = serializers.DecimalField(max_digits=14, decimal_places=2, min_value=0)
    timeline_days = serializers.IntegerField(min_value=0, max_value=2147483647, required=False, allow_null=True, default=None)
    documents = ProposalDocumentInputSerializer(many=True, required=False, default=list)


class ProposalInputSerializer(ProposalVersionInputSerializer):
    title = serializers.CharField(max_length=255)
