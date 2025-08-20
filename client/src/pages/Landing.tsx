import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, TrendingUp, Shield, Zap } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex justify-between items-center py-6">
          <div className="flex items-center">
            <FileText className="h-8 w-8 text-blue-600 mr-3" />
            <h1 className="text-2xl font-bold text-gray-900">GestãoPregões</h1>
          </div>
          <Button 
            onClick={() => window.location.href = '/api/login'}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Fazer Login
          </Button>
        </div>

        {/* Hero Section */}
        <div className="text-center py-20">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Sistema de Gestão de
            <span className="text-blue-600 block">Amostras e Pregões</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Plataforma completa para gerenciamento de amostras, processos de pregões, 
            catálogo de itens e análise inteligente com machine learning.
          </p>
          <Button 
            size="lg"
            onClick={() => window.location.href = '/api/login'}
            className="bg-blue-600 hover:bg-blue-700 text-lg px-8 py-3"
          >
            Começar Agora
          </Button>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 py-16">
          <Card className="text-center p-6">
            <CardContent className="pt-6">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Gestão de Amostras</h3>
              <p className="text-gray-600 text-sm">
                Controle completo de pregões de amostras, itens e resultados de aprovação.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center p-6">
            <CardContent className="pt-6">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Processos e Empenhos</h3>
              <p className="text-gray-600 text-sm">
                Acompanhe contratos, saldos, empenhos e vigências automaticamente.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center p-6">
            <CardContent className="pt-6">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Shield className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Histórico Inteligente</h3>
              <p className="text-gray-600 text-sm">
                Busca por similaridade de texto e histórico de itens já enviados.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center p-6">
            <CardContent className="pt-6">
              <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Zap className="h-6 w-6 text-amber-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Machine Learning</h3>
              <p className="text-gray-600 text-sm">
                Análise automática de viabilidade de amostras com IA.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Call to Action */}
        <div className="bg-blue-600 rounded-2xl p-12 text-center text-white my-16">
          <h2 className="text-3xl font-bold mb-4">
            Pronto para modernizar sua gestão de pregões?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Acesse agora e simplifique seus processos de amostragem e contratação.
          </p>
          <Button 
            size="lg"
            variant="secondary"
            onClick={() => window.location.href = '/api/login'}
            className="text-lg px-8 py-3"
          >
            Fazer Login
          </Button>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 py-8 text-center text-gray-600">
          <p>&copy; 2024 GestãoPregões. Sistema de gestão de amostras e processos.</p>
        </div>
      </div>
    </div>
  );
}
