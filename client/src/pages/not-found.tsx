import { Link } from "wouter";
import { ShinyButton } from "@/components/ui/shiny-button";
import { AlertCircle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background p-4">
      <div className="text-center space-y-6 max-w-md">
        <div className="w-24 h-24 bg-destructive/10 rounded-full flex items-center justify-center mx-auto text-destructive mb-6">
          <AlertCircle className="w-12 h-12" />
        </div>
        
        <h1 className="text-5xl font-black uppercase text-foreground tracking-tighter">
          404 Não encontrado!
        </h1>
        <p className="text-lg text-muted-foreground">
          A página que você está procurando não foi encontrada.
        </p>
        
        <Link href="/">
          <ShinyButton size="lg" className="w-full">
            Voltar ao campo
          </ShinyButton>
        </Link>
      </div>
    </div>
  );
}
