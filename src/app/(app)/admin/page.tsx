import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { users } from "@/db/schema/auth";
import { coupons, couponRedemptions } from "@/db/schema/coupons";
import { desc, eq, gte, count, inArray } from "drizzle-orm";
import { format, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import Link from "next/link";
import { 
  ArrowLeft, 
  Crown, 
  Users, 
  User, 
  Ticket, 
  ChevronRight,
  Gift,
  CreditCard,
  Clock,
  Zap
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/app/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/app/components/ui/table";
import { Badge } from "@/app/components/ui/badge";

const ALLOWED_EMAILS = ["matheus.rigote@gmail.com", "ipelabsapp@gmail.com"];

export default async function AdminPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email || !ALLOWED_EMAILS.includes(session.user.email)) {
    redirect("/dashboard");
  }

  // Get all users with their redemptions
  const allUsers = await db.query.users.findMany({
    orderBy: [desc(users.createdAt)],
  });

  // Get all redemptions with coupons
  const allRedemptions = await db.query.couponRedemptions.findMany({
    with: {
      coupon: true,
    },
  });

  // Get coupon stats
  const allCoupons = await db.query.coupons.findMany();
  const activeCoupons = allCoupons.filter(c => c.isActive).length;
  const totalRedemptions = allRedemptions.length;

  // Create a map of user redemptions
  const userRedemptionsMap = new Map<string, typeof allRedemptions>();
  allRedemptions.forEach(r => {
    const existing = userRedemptionsMap.get(r.userId) || [];
    existing.push(r);
    userRedemptionsMap.set(r.userId, existing);
  });

  // Auto-revoke expired courtesy plans
  const usersToDowngrade = allUsers.filter(u => {
    if (u.plan !== "pro" || u.stripeSubscriptionId) return false;
    const redemptions = userRedemptionsMap.get(u.id) || [];
    if (redemptions.length === 0) return false; // Genuine manual pro
    const hasActiveCourtesy = redemptions.some(
      r => r.courtesyExpiresAt && new Date(r.courtesyExpiresAt) > new Date()
    );
    return !hasActiveCourtesy; // Has redemptions but none are active
  });

  if (usersToDowngrade.length > 0) {
    const userIds = usersToDowngrade.map(u => u.id);
    await db.update(users)
      .set({ plan: "free", updatedAt: new Date() })
      .where(inArray(users.id, userIds));
      
    // Update memory array to reflect changes immediately
    usersToDowngrade.forEach(u => {
      u.plan = "free";
    });
  }

  // Calculate stats
  const totalUsers = allUsers.length;
  const proUsers = allUsers.filter(u => u.plan === "pro").length;
  const freeUsers = allUsers.filter(u => u.plan === "free").length;
  
  // Pro users breakdown
  const proWithStripe = allUsers.filter(u => u.plan === "pro" && u.stripeSubscriptionId).length;
  const proWithCourtesy = allUsers.filter(u => {
    if (u.plan !== "pro" || u.stripeSubscriptionId) return false;
    const redemptions = userRedemptionsMap.get(u.id) || [];
    return redemptions.some(r => r.courtesyExpiresAt && new Date(r.courtesyExpiresAt) > new Date());
  }).length;
  const proManual = proUsers - proWithStripe - proWithCourtesy;

  const proPercentage = totalUsers > 0 ? ((proUsers / totalUsers) * 100).toFixed(1) : "0.0";

  // Helper to get user plan details
  function getUserPlanDetails(user: typeof allUsers[0]) {
    const redemptions = userRedemptionsMap.get(user.id) || [];
    const activeCourtesy = redemptions.find(r => 
      r.courtesyExpiresAt && new Date(r.courtesyExpiresAt) > new Date()
    );

    if (user.plan === "free") {
      return { type: "free", label: "Gratuito", color: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300" };
    }

    if (user.stripeSubscriptionId) {
      const isMonthly = user.stripePriceId?.includes("month");
      return { 
        type: "stripe", 
        label: isMonthly ? "Pro Mensal" : "Pro Anual",
        color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
        icon: CreditCard
      };
    }

    if (activeCourtesy) {
      const daysLeft = differenceInDays(new Date(activeCourtesy.courtesyExpiresAt!), new Date());
      return { 
        type: "courtesy", 
        label: `Cortesia (${daysLeft}d)`,
        color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
        icon: Gift,
        couponCode: activeCourtesy.coupon?.code,
        expiresAt: activeCourtesy.courtesyExpiresAt,
        invoiceLimit: activeCourtesy.invoiceLimit
      };
    }

    return { 
      type: "manual", 
      label: "Pro Manual",
      color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
      icon: Zap
    };
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3 sm:gap-4">
          <Link
            href="/dashboard"
            className="p-2 hover:bg-accent rounded-full transition-colors flex-shrink-0"
          >
            <ArrowLeft className="h-5 w-5 sm:h-6 sm:w-6" />
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 bg-clip-text text-transparent break-words">
            Painel Administrativo
          </h1>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium break-words">{session.user.name}</p>
            <p className="text-xs text-muted-foreground break-words">{session.user.email}</p>
          </div>
          {session.user.image ? (
            <img
              src={session.user.image}
              alt={session.user.name || "User"}
              className="h-9 w-9 sm:h-10 sm:w-10 rounded-full border-2 border-border flex-shrink-0"
            />
          ) : (
            <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-full bg-primary/10 flex items-center justify-center border-2 border-border flex-shrink-0">
              <User className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2">
        <Link href="/admin/cupons">
          <Card className="hover:shadow-lg transition-all duration-300 cursor-pointer group">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Gerenciar Cupons</CardTitle>
              <Ticket className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 text-sm">
                <span className="text-2xl font-bold">{allCoupons.length}</span>
                <div className="text-xs text-muted-foreground">
                  <div>{activeCoupons} ativos</div>
                  <div>{totalRedemptions} resgates</div>
                </div>
              </div>
              <div className="flex items-center gap-1 text-sm text-primary mt-2">
                Acessar <ChevronRight className="w-4 h-4" />
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-card to-accent/10 border-none shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Usuários
            </CardTitle>
            <div className="h-8 w-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold break-words">{totalUsers}</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-card to-accent/10 border-none shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Usuários Pro
            </CardTitle>
            <div className="h-8 w-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <Crown className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{proUsers}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {proPercentage}% do total
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-card to-accent/10 border-none shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pro por Tipo
            </CardTitle>
            <div className="h-8 w-8 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <CreditCard className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Stripe:</span>
                <span className="font-medium">{proWithStripe}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Cortesia:</span>
                <span className="font-medium">{proWithCourtesy}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Manual:</span>
                <span className="font-medium">{proManual}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-card to-accent/10 border-none shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Usuários Free
            </CardTitle>
            <div className="h-8 w-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
              <User className="h-4 w-4 text-slate-600 dark:text-slate-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold break-words">{freeUsers}</div>
            <p className="text-xs text-muted-foreground mt-1 break-words">
              {totalUsers > 0 ? ((freeUsers / totalUsers) * 100).toFixed(1) : "0.0"}% do total
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <Card className="border-none shadow-md overflow-hidden">
        <CardHeader className="bg-muted/30 border-b">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            Lista de Usuários
          </CardTitle>
          <CardDescription>
            {totalUsers} usuários cadastrados
          </CardDescription>
        </CardHeader>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[250px]">USUÁRIO</TableHead>
                <TableHead>E-MAIL</TableHead>
                <TableHead>PLANO</TableHead>
                <TableHead>DETALHES</TableHead>
                <TableHead>CADASTRO</TableHead>
                <TableHead>ÚLTIMA ATIVIDADE</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allUsers.map((user) => {
                const planDetails = getUserPlanDetails(user);
                const IconComponent = planDetails.icon;
                
                return (
                  <TableRow key={user.id} className="hover:bg-muted/50 transition-colors">
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2 sm:gap-3">
                        {user.image ? (
                          <img
                            src={user.image}
                            alt={user.name || "User"}
                            className="h-8 w-8 sm:h-9 sm:w-9 rounded-full object-cover border border-border flex-shrink-0"
                          />
                        ) : (
                          <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-full bg-primary/10 flex items-center justify-center border border-border flex-shrink-0">
                            <span className="text-xs sm:text-sm font-semibold text-primary">
                              {(user.name || user.email || "?").substring(0, 2).toUpperCase()}
                            </span>
                          </div>
                        )}
                        <span className="truncate max-w-[120px] sm:max-w-[150px] break-words" title={user.name || "Sem nome"}>
                          {user.name || "Sem nome"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      <span className="truncate max-w-[150px] sm:max-w-[180px] block break-words" title={user.email || ""}>
                        {user.email}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={`${planDetails.color} gap-1`}
                      >
                        {IconComponent && <IconComponent className="h-3 w-3" />}
                        {planDetails.type === "free" ? "Gratuito" : (
                          <span className="flex items-center gap-1">
                            <Crown className="h-3 w-3" />
                            {planDetails.label}
                          </span>
                        )}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {planDetails.type === "stripe" && user.stripeCurrentPeriodEnd && (
                        <div className="text-xs space-y-0.5">
                          <div className="text-muted-foreground">
                            Renova: {format(new Date(user.stripeCurrentPeriodEnd), "dd/MM/yy")}
                          </div>
                        </div>
                      )}
                      {planDetails.type === "courtesy" && (
                        <div className="text-xs space-y-0.5">
                          {planDetails.couponCode && (
                            <div>
                              <Badge variant="outline" className="text-[10px] px-1 py-0">
                                {planDetails.couponCode}
                              </Badge>
                            </div>
                          )}
                          {planDetails.expiresAt && (
                            <div className="text-muted-foreground">
                              Expira: {format(new Date(planDetails.expiresAt), "dd/MM/yy")}
                            </div>
                          )}
                          {planDetails.invoiceLimit && (
                            <div className="text-muted-foreground">
                              Limite: {planDetails.invoiceLimit} faturas/mês
                            </div>
                          )}
                        </div>
                      )}
                      {planDetails.type === "manual" && (
                        <span className="text-xs text-muted-foreground">Sem expiração</span>
                      )}
                      {planDetails.type === "free" && (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {format(new Date(user.createdAt), "dd/MM/yyyy", { locale: ptBR })}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {user.updatedAt ? (
                        <div className="flex items-center gap-1">
                          {new Date(user.updatedAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) && (
                            <span className="text-emerald-500">●</span>
                          )}
                          {format(new Date(user.updatedAt), "dd/MM/yy HH:mm", { locale: ptBR })}
                        </div>
                      ) : "-"}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
