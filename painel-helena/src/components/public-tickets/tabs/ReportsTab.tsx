import { useMemo } from "react";
import { Loader2, BarChart3, Clock, CheckCircle2, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { differenceInHours } from "date-fns";

interface ReportsTabProps {
  tickets: any[];
  isLoading: boolean;
  sectors: Array<{ id: string; name: string; color?: string }>;
  teamMembers: Array<{ id: string; user_name: string; sector_id: string }>;
}

export function ReportsTab({
  tickets,
  isLoading,
  sectors,
  teamMembers,
}: ReportsTabProps) {
  const stats = useMemo(() => {
    const total = tickets.length;
    const open = tickets.filter(
      (t) => t.status !== "resolvido" && t.status !== "cancelado"
    ).length;
    const resolved = tickets.filter((t) => t.status === "resolvido").length;
    const critical = tickets.filter(
      (t) =>
        t.priority === "critica" &&
        t.status !== "resolvido" &&
        t.status !== "cancelado"
    ).length;

    // Average resolution time
    const resolvedTickets = tickets.filter(
      (t) => t.status === "resolvido" && t.resolved_at
    );
    let avgResolutionTime = 0;
    if (resolvedTickets.length > 0) {
      const totalHours = resolvedTickets.reduce((acc, t) => {
        return (
          acc +
          differenceInHours(new Date(t.resolved_at), new Date(t.created_at))
        );
      }, 0);
      avgResolutionTime = Math.round(totalHours / resolvedTickets.length);
    }

    // By sector
    const bySector = sectors.map((sector) => {
      const sectorTickets = tickets.filter((t) => t.sector_id === sector.id);
      const sectorOpen = sectorTickets.filter(
        (t) => t.status !== "resolvido" && t.status !== "cancelado"
      ).length;
      return {
        ...sector,
        total: sectorTickets.length,
        open: sectorOpen,
        resolved: sectorTickets.filter((t) => t.status === "resolvido").length,
      };
    });

    // By team member
    const byMember = teamMembers.map((member) => {
      const memberTickets = tickets.filter(
        (t) => t.assigned_to_id === member.id
      );
      const memberOpen = memberTickets.filter(
        (t) => t.status !== "resolvido" && t.status !== "cancelado"
      ).length;
      return {
        ...member,
        total: memberTickets.length,
        open: memberOpen,
        resolved: memberTickets.filter((t) => t.status === "resolvido").length,
      };
    });

    // By status
    const byStatus = {
      aberto: tickets.filter((t) => t.status === "aberto").length,
      em_atendimento: tickets.filter((t) => t.status === "em_atendimento")
        .length,
      aguardando: tickets.filter((t) => t.status === "aguardando").length,
      resolvido: tickets.filter((t) => t.status === "resolvido").length,
      cancelado: tickets.filter((t) => t.status === "cancelado").length,
    };

    return {
      total,
      open,
      resolved,
      critical,
      avgResolutionTime,
      bySector,
      byMember: byMember.filter((m) => m.total > 0).sort((a, b) => b.total - a.total),
      byStatus,
    };
  }, [tickets, sectors, teamMembers]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Tickets
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Em Aberto
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">{stats.open}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Resolvidos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">
              {stats.resolved}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Críticos Abertos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {stats.critical}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Resolution Time */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Tempo Médio de Resolução
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">
            {stats.avgResolutionTime > 0 ? (
              <>
                {stats.avgResolutionTime < 24
                  ? `${stats.avgResolutionTime}h`
                  : `${Math.round(stats.avgResolutionTime / 24)}d`}
              </>
            ) : (
              <span className="text-muted-foreground text-lg">
                Sem dados suficientes
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* By Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Por Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.entries(stats.byStatus).map(([status, count]) => {
              const percentage =
                stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
              const statusLabels: Record<string, string> = {
                aberto: "Aberto",
                em_atendimento: "Em Atendimento",
                aguardando: "Aguardando",
                resolvido: "Resolvido",
                cancelado: "Cancelado",
              };
              const statusColors: Record<string, string> = {
                aberto: "bg-blue-500",
                em_atendimento: "bg-orange-500",
                aguardando: "bg-yellow-500",
                resolvido: "bg-green-500",
                cancelado: "bg-gray-500",
              };

              return (
                <div key={status} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>{statusLabels[status]}</span>
                    <span className="text-muted-foreground">
                      {count} ({percentage}%)
                    </span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full ${statusColors[status]} transition-all`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* By Sector */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5" />
            Por Setor
          </CardTitle>
        </CardHeader>
        <CardContent>
          {stats.bySector.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhum setor cadastrado
            </p>
          ) : (
            <div className="space-y-3">
              {stats.bySector.map((sector) => (
                <div
                  key={sector.id}
                  className="flex items-center gap-3 p-3 bg-muted rounded-lg"
                >
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: sector.color || "#6366f1" }}
                  />
                  <span className="font-medium flex-1">{sector.name}</span>
                  <div className="flex gap-2">
                    <Badge variant="secondary">{sector.total} total</Badge>
                    <Badge variant="outline" className="text-orange-500">
                      {sector.open} abertos
                    </Badge>
                    <Badge variant="outline" className="text-green-500">
                      {sector.resolved} resolvidos
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* By Team Member */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Por Atendente
          </CardTitle>
        </CardHeader>
        <CardContent>
          {stats.byMember.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhum ticket atribuído
            </p>
          ) : (
            <div className="space-y-3">
              {stats.byMember.slice(0, 10).map((member) => (
                <div
                  key={member.id}
                  className="flex items-center gap-3 p-3 bg-muted rounded-lg"
                >
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-sm font-medium text-primary">
                      {member.user_name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span className="font-medium flex-1">{member.user_name}</span>
                  <div className="flex gap-2">
                    <Badge variant="secondary">{member.total} total</Badge>
                    <Badge variant="outline" className="text-orange-500">
                      {member.open} abertos
                    </Badge>
                    <Badge variant="outline" className="text-green-500">
                      {member.resolved} resolvidos
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
