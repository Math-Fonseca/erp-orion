import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Brain, ExternalLink, Clock } from "lucide-react";

export default function History() {
  const [searchQuery, setSearchQuery] = useState("");
  
  const { data: similarItems, isLoading } = useQuery({
    queryKey: ['/api/history/similar', { q: searchQuery }],
    enabled: searchQuery.length > 2,
    retry: false,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Search is handled by the query above
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="bg-white shadow">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="py-6">
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                  Histórico Inteligente
                </h1>
                <p className="mt-1 text-sm text-gray-500">
                  Busca por similaridade de itens e histórico de pregões anteriores
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Search */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Brain className="h-5 w-5 mr-2 text-purple-600" />
              Busca Inteligente por Similaridade
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSearch} className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Digite a descrição do item para buscar itens similares..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <p className="text-sm text-gray-500">
                <Brain className="inline h-4 w-4 mr-1" />
                Powered by ML Text Similarity (TF-IDF + Cosine)
              </p>
            </form>
          </CardContent>
        </Card>

        {/* Results */}
        {searchQuery.length > 2 && (
          <Card>
            <CardHeader>
              <CardTitle>Itens Similares Encontrados</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8 text-gray-500">
                  Analisando similaridades...
                </div>
              ) : similarItems && similarItems.length > 0 ? (
                <div className="space-y-4">
                  {similarItems.map((item: any, index: number) => (
                    <div key={index} className="border rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h3 className="text-sm font-medium text-gray-900">
                              {item.item.description}
                            </h3>
                            <Badge 
                              variant="secondary" 
                              className="bg-blue-100 text-blue-800"
                            >
                              {Math.round(item.similarity * 100)}% similar
                            </Badge>
                          </div>
                          <div className="text-xs text-gray-500 space-y-1">
                            <div>Código: {item.item.code}</div>
                            {item.item.brand && <div>Marca: {item.item.brand}</div>}
                          </div>
                          
                          {/* Sample History */}
                          {item.sampleHistory && item.sampleHistory.length > 0 && (
                            <div className="mt-3 space-y-2">
                              <div className="text-xs font-medium text-gray-700">
                                Histórico de Amostras:
                              </div>
                              {item.sampleHistory.slice(0, 3).map((history: any, idx: number) => (
                                <div key={idx} className="flex items-center justify-between text-xs bg-gray-50 rounded p-2">
                                  <div className="flex items-center space-x-2">
                                    <Clock className="h-3 w-3 text-gray-400" />
                                    <span>{history.biddingNumber} - {history.agency}</span>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <Badge 
                                      className={
                                        history.result === 'aprovado' 
                                          ? 'bg-green-100 text-green-800' 
                                          : 'bg-red-100 text-red-800'
                                      }
                                    >
                                      {history.result}
                                    </Badge>
                                    <span className="text-gray-500">
                                      {new Date(history.date).toLocaleDateString('pt-BR')}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          className="ml-2 text-blue-600 hover:text-blue-900"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Nenhum item similar encontrado
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Instructions */}
        {searchQuery.length <= 2 && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <Brain className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-4 text-lg font-medium text-gray-900">
                  Histórico Inteligente
                </h3>
                <p className="mt-2 text-sm text-gray-500 max-w-sm mx-auto">
                  Digite a descrição de um item (pelo menos 3 caracteres) para encontrar 
                  itens similares que já foram enviados em pregões anteriores.
                </p>
                <div className="mt-6 bg-blue-50 rounded-lg p-4">
                  <div className="flex items-start">
                    <Brain className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div className="ml-3 text-left">
                      <h4 className="text-sm font-medium text-blue-900">
                        Como funciona?
                      </h4>
                      <div className="mt-2 text-xs text-blue-800 space-y-1">
                        <div>• Análise de similaridade usando TF-IDF e similaridade cosseno</div>
                        <div>• Busca inteligente por descrições similares</div>
                        <div>• Histórico de resultados de aprovação/reprovação</div>
                        <div>• Informações de pregões anteriores</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}
