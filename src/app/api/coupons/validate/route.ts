import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { db } from "@/db"
import { coupons, couponRedemptions } from "@/db/schema/coupons"
import { users } from "@/db/schema/auth"
import { eq, and } from "drizzle-orm"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { code } = await request.json()

    if (!code) {
      return NextResponse.json({ error: "Código é obrigatório" }, { status: 400 })
    }

    // Find coupon
    const coupon = await db.query.coupons.findFirst({
      where: eq(coupons.code, code.toUpperCase()),
    })

    if (!coupon) {
      return NextResponse.json({ 
        valid: false, 
        error: "Cupom não encontrado" 
      }, { status: 404 })
    }

    // Check if active
    if (!coupon.isActive) {
      return NextResponse.json({ 
        valid: false, 
        error: "Cupom inativo" 
      })
    }

    // Check validity period
    const now = new Date()
    
    if (coupon.validFrom && now < new Date(coupon.validFrom)) {
      return NextResponse.json({ 
        valid: false, 
        error: "Cupom ainda não está válido" 
      })
    }

    if (coupon.validUntil && now > new Date(coupon.validUntil)) {
      return NextResponse.json({ 
        valid: false, 
        error: "Cupom expirado" 
      })
    }

    // Check max uses
    if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) {
      return NextResponse.json({ 
        valid: false, 
        error: "Cupom esgotado" 
      })
    }

    // Check restricted email
    if (coupon.restrictedEmail && coupon.restrictedEmail !== session.user.email.toLowerCase()) {
      return NextResponse.json({ 
        valid: false, 
        error: "Cupom não disponível para este email" 
      })
    }

    // Get user
    const user = await db.query.users.findFirst({
      where: eq(users.email, session.user.email),
    })

    if (!user) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 })
    }

    // Check if user already used this coupon
    const alreadyUsed = await db.query.couponRedemptions.findFirst({
      where: and(
        eq(couponRedemptions.couponId, coupon.id),
        eq(couponRedemptions.userId, user.id)
      ),
    })

    if (alreadyUsed) {
      return NextResponse.json({ 
        valid: false, 
        error: "Você já utilizou este cupom" 
      })
    }

    // Coupon is valid!
    return NextResponse.json({
      valid: true,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        type: coupon.type,
        discountPercent: coupon.discountPercent,
        courtesyDays: coupon.courtesyDays,
        description: coupon.description,
      },
    })
  } catch (error) {
    console.error("Error validating coupon:", error)
    return NextResponse.json({ error: "Erro ao validar cupom" }, { status: 500 })
  }
}
