import { prisma } from "@/lib/prisma"
import { UserRole } from "@/generated/prisma"

/**
 * Check if a user has access to a specific contract.
 * - Freelancers: must be the contract owner (userId)
 * - Clients: must be linked via ClientProfile (Client.linkedUserId)
 */
export async function hasContractAccess(userId: string, contractId: string, userRole: UserRole) {
  if (userRole === UserRole.FREELANCER) {
    const contract = await prisma.contract.findFirst({
      where: { id: contractId, userId },
    })
    return !!contract
  }

  // Client: check if user is linked to the ClientProfile on this contract
  const contract = await prisma.contract.findFirst({
    where: {
      id: contractId,
      client: { linkedUserId: userId },
    },
  })
  return !!contract
}

/**
 * Get the where clause for contracts visible to a user.
 */
export function contractWhereForUser(userId: string, userRole: UserRole) {
  if (userRole === UserRole.FREELANCER) {
    return { userId }
  }
  // Client: only contracts where the ClientProfile is linked to this user
  return {
    client: {
      linkedUserId: userId,
    },
  }
}
