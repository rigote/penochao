
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { users } from "@/db/schema/auth";
import { desc } from "drizzle-orm";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import Link from "next/link";
import { ArrowLeft, Crown, Users, User } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
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

// Simple Avatar component locally since it seems missing or I can use the primitive
// Wait, I saw components/ui/avatar was NOT in the list in Step 54. 
// I should check if I can make a simple one or if it exists and I missed it.
// Checking Step 54 again: alert-dialog, badge, button, calendar, card... scroll-area, select, separator, sonner, table, tabs, textarea.
// Avatar is MISSING. I will implement a simple Avatar using standard HTML/Tailwind or create the component.
// For now I'll inline a simple avatar style.

export default async function AdminPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email || !ALLOWED_EMAILS.includes(session.user.email)) {
    redirect("/dashboard");
  }

  const allUsers = await db.select().from(users).orderBy(desc(users.createdAt));

  const totalUsers = allUsers.length;
  // Mocking Pro users for now as we don't have the field
  const proUsers = allUsers.filter(u => u.email === "matheus.rigote@gmail.com").length;
  const freeUsers = totalUsers - proUsers;
  const proPercentage = totalUsers > 0 ? ((proUsers / totalUsers) * 100).toFixed(1) : "0.0";
  const freePercentage = totalUsers > 0 ? ((freeUsers / totalUsers) * 100).toFixed(1) : "0.0";

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard"
            className="p-2 hover:bg-accent rounded-full transition-colors"
          >
            <ArrowLeft className="h-6 w-6" />
          </Link>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 bg-clip-text text-transparent">
            Painel Administrativo
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium">{session.user.name}</p>
            <p className="text-xs text-muted-foreground">{session.user.email}</p>
          </div>
          {session.user.image ? (
            <img
              src={session.user.image}
              alt={session.user.name || "User"}
              className="h-10 w-10 rounded-full border-2 border-border"
            />
          ) : (
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center border-2 border-border">
              <User className="h-5 w-5 text-primary" />
            </div>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-gradient-to-br from-card to-accent/10 border-none shadow-md hover:shadow-lg transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Usuários
            </CardTitle>
            <div className="h-8 w-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsers}</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-card to-accent/10 border-none shadow-md hover:shadow-lg transition-all duration-300">
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

        <Card className="bg-gradient-to-br from-card to-accent/10 border-none shadow-md hover:shadow-lg transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Usuários Free
            </CardTitle>
            <div className="h-8 w-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
              <User className="h-4 w-4 text-slate-600 dark:text-slate-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{freeUsers}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {freePercentage}% do total
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
        </CardHeader>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[300px]">USUÁRIO</TableHead>
                <TableHead>E-MAIL</TableHead>
                <TableHead>PLANO</TableHead>
                <TableHead>DATA DE INSCRIÇÃO</TableHead>
                <TableHead>DATA DO PRO</TableHead>
                <TableHead>ÚLTIMA SESSÃO</TableHead>
                <TableHead>VENCIMENTO PRO</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allUsers.map((user) => {
                const isPro = user.email === "matheus.rigote@gmail.com"; // Mock logic
                return (
                  <TableRow key={user.id} className="hover:bg-muted/50 transition-colors">
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-3">
                        {user.image ? (
                          <img
                            src={user.image}
                            alt={user.name || "User"}
                            className="h-9 w-9 rounded-full object-cover border border-border"
                          />
                        ) : (
                          <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center border border-border">
                            <span className="text-sm font-semibold text-primary">
                              {(user.name || user.email || "?").substring(0, 2).toUpperCase()}
                            </span>
                          </div>
                        )}
                        <span className="truncate max-w-[200px]" title={user.name || "Sem nome"}>
                          {user.name || "Sem nome"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      <div className="flex items-center gap-2 text-xs sm:text-sm">
                        <span className="truncate max-w-[200px]" title={user.email}>
                          {user.email}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={isPro
                          ? "bg-amber-100 text-amber-700 hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-400"
                          : "bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400"
                        }
                      >
                        {isPro ? (
                          <span className="flex items-center gap-1">
                            <Crown className="h-3 w-3" /> Pro Anual
                          </span>
                        ) : "Gratuito"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      <div className="flex items-center gap-2">
                        {format(new Date(user.createdAt), "dd/MM/yyyy", { locale: ptBR })}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {isPro ? "02/01/2026" : "-"}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {/* Using updatedAt as proxy for last session if recent, else - */}
                      {user.updatedAt ? (
                        <div className="flex items-center gap-1">
                          <span className={`${new Date(user.updatedAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                            ? "text-emerald-500"
                            : ""
                            }`}>⚡</span>
                          {format(new Date(user.updatedAt), "dd/MM/yyyy", { locale: ptBR })}
                        </div>
                      ) : "-"}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {isPro ? "02/01/2036" : "-"}
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
