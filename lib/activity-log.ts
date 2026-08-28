import { prisma } from "@/lib/prisma";

export async function logActivity({
  actorId,
  action,
  entityType,
  entityId,
  metadata,
}: {
  actorId: string;
  action: "CREATE" | "UPDATE" | "DELETE" | "PUBLISH" | "UNPUBLISH";
  entityType: "Center" | "Article" | "PortfolioProject" | "ExpertiseTag" | "Lead" | "SiteSetting";
  entityId: string;
  metadata?: any;
}) {
  try {
    await prisma.activityLog.create({
      data: {
        actorId,
        action,
        entityType,
        entityId,
        metadata: metadata ? JSON.stringify(metadata) : undefined,
      },
    });
  } catch (error) {
    console.error("[ActivityLog Error] Failed to record activity log:", error);
  }
}
