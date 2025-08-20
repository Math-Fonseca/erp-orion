import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import Layout from "@/components/Layout";
import DataTable from "@/components/DataTable";
import SampleModal from "@/components/modals/SampleModal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Filter, Eye, Edit, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Samples() {
  const [selectedSample, setSelectedSample] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();

  const { data: samples, isLoading } = useQuery({
    queryKey: ['/api/samples'],
    retry: false,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest('DELETE', `/api/samples/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/samples'] });
      toast({
        title: "Sucesso",
        description: "Pregão de amostra excluído com sucesso",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Falha ao excluir pregão de amostra",
        variant: "destructive",
      });
    },
  });

  const handleView = (sample: any) => {
    setSelectedSample(sample);
    setIsModalOpen(true);
  };

  const handleEdit = (sample: any) => {
    setSelectedSample(sample);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Tem certeza que deseja excluir este pregão de amostra?")) {
      deleteMutation.mutate(id);
    }
  };

  const filteredSamples = samples?.filter((sample: any) =>
    sample.number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    sample.agency?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    sample.uasg?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const columns = [
    { key: 'number', header: 'Nº Pregão' },
    { key: 'uasg', header: 'UASG' },
    { key: 'agency', header: 'Órgão' },
    { 
      key: 'sendDate', 
      header: 'Data Envio',
      render: (value: string) => value ? new Date(value).toLocaleDateString('pt-BR') : '-'
    },
    { 
      key: 'status', 
      header: 'Status',
      render: (value: string) => {
        const statusMap = {
          'em_andamento': { label: 'Em Andamento', color: 'bg-yellow-100 text-yellow-800' },
          'aprovado': { label: 'Aprovado', color: 'bg-green-100 text-green-800' },
          'reprovado': { label: 'Reprovado', color: 'bg-red-100 text-red-800' },
          'encerrado': { label: 'Encerrado', color: 'bg-gray-100 text-gray-800' },
        };
        const status = statusMap[value as keyof typeof statusMap] || { label: value, color: 'bg-gray-100 text-gray-800' };
        return <Badge className={status.color}>{status.label}</Badge>;
      }
    },
  ];

  const actions = [
    {
      icon: Eye,
      label: "Ver",
      onClick: handleView,
      className: "text-blue-600 hover:text-blue-900"
    },
    {
      icon: Edit,
      label: "Editar",
      onClick: handleEdit,
      className: "text-gray-600 hover:text-gray-900"
    },
    {
      icon: Trash2,
      label: "Excluir",
      onClick: (item: any) => handleDelete(item.id),
      className: "text-red-600 hover:text-red-900"
    }
  ];

  return (
    <Layout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="bg-white shadow">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="py-6 md:flex md:items-center md:justify-between">
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                  Gestão de Amostras
                </h1>
                <p className="mt-1 text-sm text-gray-500">
                  Controle de pregões de amostras e resultados
                </p>
              </div>
              <div className="mt-6 flex space-x-3 md:mt-0 md:ml-4">
                <Button 
                  onClick={() => {
                    setSelectedSample(null);
                    setIsModalOpen(true);
                  }}
                  className="inline-flex items-center bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Pregão
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Buscar por número, órgão ou UASG..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Button variant="outline">
                <Filter className="h-4 w-4 mr-2" />
                Filtros
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Data Table */}
        <Card>
          <CardHeader>
            <CardTitle>Pregões de Amostras</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6 text-center text-gray-500">Carregando...</div>
            ) : (
              <DataTable
                data={filteredSamples}
                columns={columns}
                actions={actions}
              />
            )}
          </CardContent>
        </Card>

        {/* Sample Modal */}
        <SampleModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedSample(null);
          }}
          sample={selectedSample}
        />
      </div>
    </Layout>
  );
}
