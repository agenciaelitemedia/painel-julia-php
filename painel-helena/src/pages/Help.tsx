import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Help() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Ajuda</h1>
        <p className="text-muted-foreground">
          Central de ajuda e documentação
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Documentação</CardTitle>
          <CardDescription>
            Em desenvolvimento...
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Esta página está em construção
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
