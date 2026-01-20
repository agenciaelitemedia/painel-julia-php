import { Card, CardContent } from '@/components/ui/card';
import { Plus } from 'lucide-react';

interface CreateBoardCardProps {
  onClick: () => void;
}

export function CreateBoardCard({ onClick }: CreateBoardCardProps) {
  return (
    <Card
      className="border-2 border-dashed border-border hover:border-primary/40 hover:bg-muted/30 transition-all cursor-pointer min-h-[200px] flex items-center justify-center group"
      onClick={onClick}
    >
      <CardContent className="flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-primary/10 group-hover:bg-primary/20 flex items-center justify-center mb-3 transition-colors">
          <Plus className="h-8 w-8 text-primary" />
        </div>
        <p className="text-base font-medium text-muted-foreground group-hover:text-foreground transition-colors">Novo painel</p>
      </CardContent>
    </Card>
  );
}
