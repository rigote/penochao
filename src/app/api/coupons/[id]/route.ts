import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { db } from "@/db"
import { coupons } from "@/db/schema/coupons"
import { eq } from "drizzle-orm"

const ADMIN_EMAILS = ["matheus.rigote@gmail.com"]

// Convert datetime string (YYYY-MM-DDTHH:mm) to Date in São Paulo timezone
function parseDateTimeSaoPaulo(dateTimeStr: string): Date {
  if (dateTimeStr.includes("T")) {
    const [datePart, timePart] = dateTimeStr.split("T")
    const [year, month, day] = datePart.split("-").map(Number)
    const [hours, minutes] = timePart.split(":").map(Number)
    // São Paulo is UTC-3, so add 3 hours to convert local to UTC
    return new Date(Date.UTC(year, month - 1, day, hours + 3, minutes, 0, 0))
  } else {
    const [year, month, day] = dateTimeStr.split("-").map(Number)
    return new Date(Date.UTC(year, month - 1, day, 3, 0, 0, 0))
  }
}

async function isAdmin(email: string | null | undefined): Promise<boolean> {
  return !!email && ADMIN_EMAILS.includes(email)
}

// GET - Get single coupon (admin only)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession()

    if (!session?.user?.email || !await isAdmin(session.user.email)) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 403 })
    }

    const { id } = await params

    const coupon = await db.query.coupons.findFirst({
      where: eq(coupons.id, id),
    })

    if (!coupon) {
      return NextResponse.json({ error: "Cupom não encontrado" }, { status: 404 })
    }

    return NextResponse.json(coupon)
  } catch (error) {
    console.error("Error fetching coupon:", error)
    return NextResponse.json({ error: "Erro ao buscar cupom" }, { status: 500 })
  }
}

// PATCH - Update coupon (admin only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession()

    if (!session?.user?.email || !await isAdmin(session.user.email)) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()

    const {
      code,
      description,
      type,
      discountPercent,
      courtesyDays,
      invoiceLimit,
      restrictedEmail,
      maxUses,
      validFrom,
      validUntil,
      isActive,
    } = body

    // Check if coupon exists
    const existing = await db.query.coupons.findFirst({
      where: eq(coupons.id, id),
    })

    if (!existing) {
      return NextResponse.json({ error: "Cupom não encontrado" }, { status: 404 })
    }

    // If changing code, check if new code already exists
    if (code && code.toUpperCase() !== existing.code) {
      const codeExists = await db.query.coupons.findFirst({
        where: eq(coupons.code, code.toUpperCase()),
      })
      if (codeExists) {
        return NextResponse.json({ error: "Código já existe" }, { status: 400 })
      }
    }

    // Update coupon
    const [updated] = await db
      .update(coupons)
      .set({
        code: code ? code.toUpperCase() : existing.code,
        description: description ?? existing.description,
        type: type ?? existing.type,
        discountPercent: type === "discount" ? discountPercent : existing.discountPercent,
        courtesyDays: type === "courtesy" ? courtesyDays : existing.courtesyDays,
        invoiceLimit: invoiceLimit !== undefined ? (invoiceLimit || null) : existing.invoiceLimit,
        restrictedEmail: restrictedEmail !== undefined 
          ? (restrictedEmail?.toLowerCase() || null) 
          : existing.restrictedEmail,
        maxUses: maxUses !== undefined ? (maxUses || null) : existing.maxUses,
        validFrom: validFrom !== undefined 
          ? (validFrom ? parseDateTimeSaoPaulo(validFrom) : null) 
          : existing.validFrom,
        validUntil: validUntil !== undefined 
          ? (validUntil ? parseDateTimeSaoPaulo(validUntil) : null) 
          : existing.validUntil,
        isActive: isActive ?? existing.isActive,
        updatedAt: new Date(),
      })
      .where(eq(coupons.id, id))
      .returning()

    return NextResponse.json(updated)
  } catch (error) {
    console.error("Error updating coupon:", error)
    return NextResponse.json({ error: "Erro ao atualizar cupom" }, { status: 500 })
  }
}

// DELETE - Delete coupon (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession()

    if (!session?.user?.email || !await isAdmin(session.user.email)) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 403 })
    }

    const { id } = await params

    await db.delete(coupons).where(eq(coupons.id, id))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting coupon:", error)
    return NextResponse.json({ error: "Erro ao deletar cupom" }, { status: 500 })
  }
}
