import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { db } from "@/db"
import { coupons } from "@/db/schema/coupons"
import { users } from "@/db/schema/auth"
import { eq, desc } from "drizzle-orm"

const ADMIN_EMAILS = ["matheus.rigote@gmail.com"]

// Convert datetime string (YYYY-MM-DDTHH:mm) to Date in São Paulo timezone
function parseDateTimeSaoPaulo(dateTimeStr: string): Date {
  // Check if includes time
  if (dateTimeStr.includes("T")) {
    const [datePart, timePart] = dateTimeStr.split("T")
    const [year, month, day] = datePart.split("-").map(Number)
    const [hours, minutes] = timePart.split(":").map(Number)
    // São Paulo is UTC-3, so add 3 hours to convert local to UTC
    return new Date(Date.UTC(year, month - 1, day, hours + 3, minutes, 0, 0))
  } else {
    // Fallback for date-only strings
    const [year, month, day] = dateTimeStr.split("-").map(Number)
    return new Date(Date.UTC(year, month - 1, day, 3, 0, 0, 0)) // 00:00 São Paulo = 03:00 UTC
  }
}

async function isAdmin(email: string | null | undefined): Promise<boolean> {
  return !!email && ADMIN_EMAILS.includes(email)
}

// GET - List all coupons (admin only)
export async function GET() {
  try {
    const session = await getServerSession()

    if (!session?.user?.email || !await isAdmin(session.user.email)) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 403 })
    }

    const allCoupons = await db.query.coupons.findMany({
      orderBy: [desc(coupons.createdAt)],
    })

    return NextResponse.json(allCoupons)
  } catch (error) {
    console.error("Error fetching coupons:", error)
    return NextResponse.json({ error: "Erro ao buscar cupons" }, { status: 500 })
  }
}

// POST - Create new coupon (admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()

    if (!session?.user?.email || !await isAdmin(session.user.email)) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 403 })
    }

    const user = await db.query.users.findFirst({
      where: eq(users.email, session.user.email),
    })

    if (!user) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 })
    }

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
      isActive = true,
    } = body

    // Validate required fields
    if (!code || !type) {
      return NextResponse.json(
        { error: "Código e tipo são obrigatórios" },
        { status: 400 }
      )
    }

    if (type === "discount" && (!discountPercent || discountPercent < 1 || discountPercent > 100)) {
      return NextResponse.json(
        { error: "Desconto deve ser entre 1 e 100%" },
        { status: 400 }
      )
    }

    if (type === "courtesy" && (!courtesyDays || courtesyDays < 1)) {
      return NextResponse.json(
        { error: "Dias de cortesia deve ser maior que 0" },
        { status: 400 }
      )
    }

    // Check if code already exists
    const existing = await db.query.coupons.findFirst({
      where: eq(coupons.code, code.toUpperCase()),
    })

    if (existing) {
      return NextResponse.json(
        { error: "Código já existe" },
        { status: 400 }
      )
    }

    // Create coupon
    const [newCoupon] = await db
      .insert(coupons)
      .values({
        code: code.toUpperCase(),
        description,
        type,
        discountPercent: type === "discount" ? discountPercent : null,
        courtesyDays: type === "courtesy" ? courtesyDays : null,
        invoiceLimit: invoiceLimit || null,
        restrictedEmail: restrictedEmail?.toLowerCase() || null,
        maxUses: maxUses || null,
        validFrom: validFrom ? parseDateTimeSaoPaulo(validFrom) : null,
        validUntil: validUntil ? parseDateTimeSaoPaulo(validUntil) : null,
        isActive,
        createdBy: user.id,
      })
      .returning()

    return NextResponse.json(newCoupon, { status: 201 })
  } catch (error) {
    console.error("Error creating coupon:", error)
    return NextResponse.json({ error: "Erro ao criar cupom" }, { status: 500 })
  }
}
