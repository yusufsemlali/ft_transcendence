import { initContract } from "@ts-rest/core";
import { z } from "zod";
import { OrganizationSchema, CreateOrganizationSchema, UpdateOrganizationSchema } from "../schemas/organizations";
import { ORG_ROLES } from "../constants/roles";

const c = initContract();

export const OrgRolesSchema = z.enum(ORG_ROLES);

export const OrganizationProfileSchema = OrganizationSchema.extend({
    stats: z.object({
        memberCount: z.number(),
        totalTournaments: z.number(),
        activeTournaments: z.number(),
    }),
});

export const MemberSchema = z.object({
    id: z.string().uuid(),
    username: z.string(),
    email: z.string().email(),
    role: OrgRolesSchema,
    joinedAt: z.coerce.date(),
});

export const organizationsContract = c.router({
    getOrganizations: {
        method: "GET",
        path: "/organizations",
        responses: {
            200: z.object({ 
                message: z.string(), 
                data: z.array(OrganizationSchema) 
            }),
            401: z.object({ message: z.string() }),
        },
        summary: "List all organizations the user is a member of",
    },
    getOrganization: {
        method: "GET",
        path: "/organizations/:id",
        pathParams: z.object({ id: z.string().uuid() }),
        responses: {
            200: z.object({ 
                message: z.string(), 
                data: OrganizationProfileSchema 
            }),
            404: z.object({ message: z.string() }),
        },
        summary: "Get detailed profile and stats for an organization",
    },
    updateOrganization: {
        method: "PATCH",
        path: "/organizations/:id",
        pathParams: z.object({ id: z.string().uuid() }),
        body: UpdateOrganizationSchema,
        responses: {
            200: z.object({ 
                message: z.string(), 
                data: OrganizationSchema 
            }),
            403: z.object({ message: z.string() }),
            404: z.object({ message: z.string() }),
            409: z.object({ message: z.string() }),
        },
        summary: "Update organization details (Requires: owner or admin)",
    },
    deleteOrganization: {
        method: "DELETE",
        path: "/organizations/:id",
        pathParams: z.object({ id: z.string().uuid() }),
        body: z.object({}),
        responses: {
            200: z.object({ message: z.string() }),
            403: z.object({ message: z.string() }),
            404: z.object({ message: z.string() }),
        },
        summary: "Permanently delete organization and ALL its data (Requires: owner)",
    },
    createOrganization: {
        method: "POST",
        path: "/organizations",
        body: CreateOrganizationSchema,
        responses: {
            201: z.object({ message: z.string(), data: OrganizationSchema }),
            400: z.object({ message: z.string() }),
            401: z.object({ message: z.string() }),
        },
        summary: "Create a new organization",
    },
    addMember: {
        method: "POST",
        path: "/organizations/:id/members",
        pathParams: z.object({ id: z.string().uuid() }),
        body: z.object({
            email: z.string().email(),
            role: OrgRolesSchema.default("member"),
        }),
        responses: {
            201: z.object({ message: z.string() }),
            403: z.object({ message: z.string() }), // Not allowed to add
            404: z.object({ message: z.string() }), // User email not found
            409: z.object({ message: z.string() }), // Already a member
        },
        summary: "Add a user to the organization by email",
    },
    updateMemberRole: {
        method: "PATCH",
        path: "/organizations/:id/members/:userId",
        pathParams: z.object({
            id: z.string().uuid(),
            userId: z.string().uuid(),
        }),
        body: z.object({
            role: OrgRolesSchema,
        }),
        responses: {
            200: z.object({ message: z.string() }),
            403: z.object({ message: z.string() }),
        },
        summary: "Change a member's role",
    },
    leaveOrganization: {
        method: "DELETE",
        path: "/organizations/:id/members/leave",
        pathParams: z.object({ id: z.string().uuid() }),
        body: z.object({}),
        responses: {
            200: z.object({ message: z.string() }),
            403: z.object({ message: z.string() }),
            404: z.object({ message: z.string() }),
        },
        summary: "Voluntarily leave the organization (Owner cannot leave, must delete)",
    },
    removeMember: {
        method: "DELETE",
        path: "/organizations/:id/members/:userId",
        pathParams: z.object({
            id: z.string().uuid(),
            userId: z.string().uuid(),
        }),
        body: z.object({}),
        responses: {
            200: z.object({ message: z.string() }),
            403: z.object({ message: z.string() }),
            404: z.object({ message: z.string() }),
        },
        summary: "Kick a member out of the organization (Requires: owner or admin)",
    },
    getOrganizationMembers: {
        method: "GET",
        path: "/organizations/:id/members",
        pathParams: z.object({ id: z.string().uuid() }),
        responses: {
            200: z.object({ 
                message: z.string(), 
                data: z.array(MemberSchema) 
            }),
            404: z.object({ message: z.string() }),
        },
        summary: "List all members and their roles in an organization",
    },
});
