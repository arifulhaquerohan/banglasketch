from django.db import models
from apps.authentication.models import AdminUser

class Client(models.Model):
    name = models.CharField(max_length=255)
    phone = models.CharField(max_length=50)
    email = models.EmailField(max_length=255, blank=True, null=True)
    alternate_phone = models.CharField(max_length=50, blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    portal_token = models.CharField(max_length=64, unique=True, blank=True, null=True)
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    deleted_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        db_table = "clients"
        verbose_name = "Client"
        verbose_name_plural = "Clients"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.name} ({self.phone})"


class Enquiry(models.Model):
    STATUS_CHOICES = (
        ("new_enquiry", "New Enquiry"),
        ("contacted", "Contacted"),
        ("consultation", "Consultation"),
        ("site_visit", "Site Visit"),
        ("proposal_sent", "Proposal Sent"),
        ("approved", "Approved"),
        ("active_project", "Active Project"),
        ("handover", "Handover"),
        ("on_hold", "On Hold"),
        ("closed", "Closed"),
    )

    client = models.ForeignKey(
        Client,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="enquiries",
        db_column="client_id",
    )
    name = models.CharField(max_length=255)
    phone = models.CharField(max_length=50)
    email = models.EmailField(max_length=255, blank=True, null=True)
    project_location = models.CharField(max_length=255)
    property_type = models.CharField(max_length=50)
    service_scope = models.CharField(max_length=50)
    approx_budget = models.CharField(max_length=100, blank=True, null=True)
    preferred_start_date = models.CharField(max_length=100, blank=True, null=True)
    notes = models.TextField(blank=True, null=True)
    attachments = models.JSONField(default=list, blank=True)
    status = models.CharField(max_length=50, default="new_enquiry", choices=STATUS_CHOICES)
    status_reason = models.TextField(blank=True, null=True)
    assigned_to = models.ForeignKey(
        AdminUser,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="assigned_enquiries",
        db_column="assigned_to",
    )
    next_action = models.TextField(blank=True, null=True)
    next_follow_up_date = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    deleted_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        db_table = "enquiries"
        verbose_name = "Enquiry"
        verbose_name_plural = "Enquiries"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.name} - {self.project_location} [{self.status}]"


class EnquiryFollowUp(models.Model):
    id = models.BigAutoField(primary_key=True)
    enquiry = models.ForeignKey(
        Enquiry,
        on_delete=models.CASCADE,
        related_name="follow_ups",
        db_column="enquiry_id",
    )
    actor = models.ForeignKey(
        AdminUser,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="recorded_follow_ups",
        db_column="actor_id",
    )
    channel = models.CharField(max_length=50, default="call")
    summary = models.TextField()
    next_action = models.TextField(blank=True, null=True)
    scheduled_at = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "enquiry_follow_ups"
        verbose_name = "Enquiry Follow-Up"
        verbose_name_plural = "Enquiry Follow-Ups"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.channel} on Enquiry #{self.enquiry_id} at {self.created_at}"


class ClientProject(models.Model):
    client = models.ForeignKey(
        Client,
        on_delete=models.RESTRICT,
        related_name="projects",
        db_column="client_id",
    )
    enquiry = models.ForeignKey(
        Enquiry,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="client_projects",
        db_column="enquiry_id",
    )
    title = models.CharField(max_length=255)
    stage = models.CharField(max_length=50, default="consultation")
    current_milestone = models.TextField(blank=True, null=True)
    next_milestone = models.TextField(blank=True, null=True)
    project_manager = models.ForeignKey(
        AdminUser,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="managed_projects",
        db_column="project_manager_id",
    )
    agreed_scope = models.TextField(blank=True, null=True)
    agreed_budget = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    target_completion_date = models.DateField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    deleted_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        db_table = "client_projects"
        verbose_name = "Client Project"
        verbose_name_plural = "Client Projects"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.title} (Client: {self.client.name})"


class Proposal(models.Model):
    STATUS_CHOICES = (
        ("draft", "Draft"),
        ("sent", "Sent"),
        ("approved", "Approved"),
        ("rejected", "Rejected"),
        ("superseded", "Superseded"),
    )

    project = models.ForeignKey(
        ClientProject,
        on_delete=models.CASCADE,
        related_name="proposals",
        db_column="project_id",
    )
    title = models.CharField(max_length=255)
    status = models.CharField(max_length=50, default="draft", choices=STATUS_CHOICES)
    approved_version = models.IntegerField(blank=True, null=True)
    approved_at = models.DateTimeField(blank=True, null=True)
    approval_notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "proposals"
        verbose_name = "Proposal"
        verbose_name_plural = "Proposals"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.title} [{self.status}] (Project: {self.project.title})"


class ProposalVersion(models.Model):
    proposal = models.ForeignKey(
        Proposal,
        on_delete=models.CASCADE,
        related_name="versions",
        db_column="proposal_id",
    )
    version = models.IntegerField(default=1)
    scope_summary = models.TextField()
    proposed_cost = models.DecimalField(max_digits=14, decimal_places=2)
    timeline_days = models.IntegerField(blank=True, null=True)
    documents = models.JSONField(default=list, blank=True)
    actor = models.ForeignKey(
        AdminUser,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="proposal_versions_authored",
        db_column="actor_id",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "proposal_versions"
        unique_together = (("proposal", "version"),)
        ordering = ["-version"]

    def __str__(self):
        return f"v{self.version} of Proposal #{self.proposal_id} ({self.proposed_cost} BDT)"


class ChangeOrder(models.Model):
    STATUS_CHOICES = (
        ("pending_approval", "Pending Approval"),
        ("approved", "Approved"),
        ("rejected", "Rejected"),
    )

    project = models.ForeignKey(
        ClientProject,
        on_delete=models.CASCADE,
        related_name="change_orders",
        db_column="project_id",
    )
    title = models.CharField(max_length=255)
    description = models.TextField()
    proposed_cost = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    timeline_impact_days = models.IntegerField(default=0)
    status = models.CharField(max_length=50, default="pending_approval", choices=STATUS_CHOICES)
    client_notes = models.TextField(blank=True, null=True)
    decided_at = models.DateTimeField(blank=True, null=True)
    requested_by = models.ForeignKey(
        AdminUser,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="requested_change_orders",
        db_column="requested_by",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "change_orders"
        verbose_name = "Change Order"
        verbose_name_plural = "Change Orders"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.title} ({self.proposed_cost} BDT) [{self.status}]"
