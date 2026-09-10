from django.contrib import admin
from .models import (
    Client,
    Enquiry,
    EnquiryFollowUp,
    ClientProject,
    Proposal,
    ProposalVersion,
    ChangeOrder,
)

class EnquiryFollowUpInline(admin.TabularInline):
    model = EnquiryFollowUp
    extra = 1
    readonly_fields = ("created_at",)


class ProposalVersionInline(admin.StackedInline):
    model = ProposalVersion
    extra = 1
    readonly_fields = ("created_at",)


class ProposalInline(admin.TabularInline):
    model = Proposal
    extra = 0
    show_change_link = True


class ChangeOrderInline(admin.TabularInline):
    model = ChangeOrder
    extra = 0
    show_change_link = True


@admin.register(Client)
class ClientAdmin(admin.ModelAdmin):
    list_display = ("name", "phone", "email", "portal_token", "created_at")
    search_fields = ("name", "phone", "email", "portal_token")
    readonly_fields = ("created_at", "updated_at")


@admin.register(Enquiry)
class EnquiryAdmin(admin.ModelAdmin):
    list_display = ("name", "phone", "project_location", "property_type", "status", "assigned_to", "next_follow_up_date", "created_at")
    list_filter = ("status", "property_type", "service_scope")
    search_fields = ("name", "phone", "email", "project_location")
    readonly_fields = ("created_at", "updated_at")
    inlines = [EnquiryFollowUpInline]


@admin.register(EnquiryFollowUp)
class EnquiryFollowUpAdmin(admin.ModelAdmin):
    list_display = ("enquiry", "channel", "actor", "scheduled_at", "created_at")
    list_filter = ("channel",)
    readonly_fields = ("created_at",)


@admin.register(ClientProject)
class ClientProjectAdmin(admin.ModelAdmin):
    list_display = ("title", "client", "stage", "agreed_budget", "project_manager", "target_completion_date", "created_at")
    list_filter = ("stage",)
    search_fields = ("title", "client__name", "client__phone")
    readonly_fields = ("created_at", "updated_at")
    inlines = [ProposalInline, ChangeOrderInline]


@admin.register(Proposal)
class ProposalAdmin(admin.ModelAdmin):
    list_display = ("title", "project", "status", "approved_version", "approved_at", "created_at")
    list_filter = ("status",)
    search_fields = ("title", "project__title")
    readonly_fields = ("created_at", "updated_at")
    inlines = [ProposalVersionInline]


@admin.register(ProposalVersion)
class ProposalVersionAdmin(admin.ModelAdmin):
    list_display = ("proposal", "version", "proposed_cost", "timeline_days", "created_at")
    readonly_fields = ("created_at",)


@admin.register(ChangeOrder)
class ChangeOrderAdmin(admin.ModelAdmin):
    list_display = ("title", "project", "proposed_cost", "status", "timeline_impact_days", "decided_at", "created_at")
    list_filter = ("status",)
    search_fields = ("title", "project__title")
    readonly_fields = ("created_at", "updated_at")
