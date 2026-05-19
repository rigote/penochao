import { db } from "@/db"
import { resolveEffectiveUserPlan } from "./subscription"

jest.mock("@/db", () => ({
  db: {
    query: {
      couponRedemptions: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
      },
    },
    update: jest.fn(),
  },
}))

const mockedDb = db as unknown as {
  query: {
    couponRedemptions: {
      findMany: jest.Mock
      findFirst: jest.Mock
    }
  }
  update: jest.Mock
}

function user(overrides: Record<string, unknown> = {}) {
  return {
    id: "user-1",
    name: "User",
    email: "user@example.com",
    emailVerified: null,
    image: null,
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
    plan: "free",
    stripeCustomerId: null,
    stripeSubscriptionId: null,
    stripePriceId: null,
    stripeCurrentPeriodEnd: null,
    ...overrides,
  } as any
}

function mockUpdateReturning(value: unknown[]) {
  const returning = jest.fn().mockResolvedValue(value)
  const where = jest.fn().mockReturnValue({ returning })
  const set = jest.fn().mockReturnValue({ where })

  mockedDb.update.mockReturnValue({ set })

  return { set, where, returning }
}

describe("resolveEffectiveUserPlan", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("does nothing for free users", async () => {
    const freeUser = user({ plan: "free" })

    await expect(resolveEffectiveUserPlan(freeUser)).resolves.toBe(freeUser)
    expect(mockedDb.query.couponRedemptions.findMany).not.toHaveBeenCalled()
    expect(mockedDb.update).not.toHaveBeenCalled()
  })

  it("keeps paid Stripe Pro users as Pro regardless of courtesy state", async () => {
    const stripeUser = user({
      plan: "pro",
      stripeSubscriptionId: "sub_123",
    })

    await expect(resolveEffectiveUserPlan(stripeUser)).resolves.toBe(stripeUser)
    expect(mockedDb.query.couponRedemptions.findMany).not.toHaveBeenCalled()
    expect(mockedDb.update).not.toHaveBeenCalled()
  })

  it("keeps courtesy Pro active when there is an active redemption", async () => {
    const courtesyUser = user({ plan: "pro" })
    mockedDb.query.couponRedemptions.findMany.mockResolvedValue([{ id: "redemption-1" }])
    mockedDb.query.couponRedemptions.findFirst.mockResolvedValue({
      id: "redemption-1",
      courtesyExpiresAt: new Date("2026-12-31"),
    })

    await expect(resolveEffectiveUserPlan(courtesyUser)).resolves.toBe(courtesyUser)
    expect(mockedDb.update).not.toHaveBeenCalled()
  })

  it("downgrades expired courtesy Pro users without Stripe subscription", async () => {
    const courtesyUser = user({ plan: "pro" })
    const downgradedUser = user({ plan: "free", updatedAt: new Date("2026-05-19") })
    mockedDb.query.couponRedemptions.findMany.mockResolvedValue([{ id: "expired-redemption" }])
    mockedDb.query.couponRedemptions.findFirst.mockResolvedValue(null)
    const updateChain = mockUpdateReturning([downgradedUser])

    await expect(resolveEffectiveUserPlan(courtesyUser)).resolves.toMatchObject({
      id: "user-1",
      plan: "free",
    })
    expect(mockedDb.update).toHaveBeenCalledTimes(1)
    expect(updateChain.set).toHaveBeenCalledWith(
      expect.objectContaining({
        plan: "free",
        updatedAt: expect.any(Date),
      })
    )
  })
})
