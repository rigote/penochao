import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { db } from "@/db"
import { coupons } from "@/db/schema/coupons"
import { desc } from "drizzle-orm"
import { CuponsClient } from "./cupons-client"

const ALLOWED_EMAILS = ["matheus.rigote@gmail.com"]

export default async function CuponsPage() {
  const session = await getServerSession()

  if (!session?.user?.email || !ALLOWED_EMAILS.includes(session.user.email)) {
    redirect("/dashboard")
  }

  const allCoupons = await db.query.coupons.findMany({
    orderBy: [desc(coupons.createdAt)],
  })

  return <CuponsClient initialCoupons={allCoupons} />
}
