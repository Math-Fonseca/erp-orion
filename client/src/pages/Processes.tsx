import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import Layout from "@/components/Layout";
import DataTable from "@/components/DataTable";
import ProcessModal from "@/components/modals/ProcessModal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Plus, Search, Filter, Eye, Edit, PlusCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Processes() {
  const [selectedProcess, setSelectedProcess] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();

  const { data: processes, isLoading } = useQuery({
    queryKey: ['/api/processes'],
    retry: false,
  });

  const handleView = (process: any) => {
    setSelectedProcess(process);
    setIsModalOpen(true);
  };

  const handleEdit = (process: any) => {
    setSelectedProcess(process);
    setIsModalOpen(true);
  };

  const handleAddCommitment = (process: any) => {
    // TODO: Open commitment modal
    console.log("Add commitment for process:", process.id);
  };

  const filteredProcesses = processes?.filter((process: any) =>
    process.number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    process.agency?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    process.uasg?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const columns = [
    { key: 'number', header: 'Nº Contrato' },
    { key: 'agency', header: 'Órgão' },
    { 
      key: 'contractType', 
      header: 'Tipo',
      render: (value: string) => {
        const typeMap = {
          'registro_precos': 'Registro de Preços',
          'compra_direta': 'Compra Direta',
          'dispensa': 'Dispensa',
          'compra_direta_rp': 'Compra Direta + RP'
        };
        return typeMap[value as keyof typeof typeMap] || value;
      }
    },
    { 
      key: 'validityMonths', 
      header: 'Vigência',
      render: (value: number) => `${value || 0} meses`
    },
    { 
      key: 'balance', 
      header: 'Saldo',
      render: () => 'R$ 1.250.000,00' // TODO: Calculate from items
    },
    { 
      key: 'commitmentPercentage', 
      header: '% Empenhado',
      render: () => (
        <div className="flex items-center space-x-2">
          <Progress value={72} className="w-16" />
          <span className="text-sm text-gray-600">72%</span>
        </div>
      )
    },
    { 
      key: 'status', 
      header: 'Status',
      render: (value: string) => {
        const statusMap = {
          'ativo': { label: 'Ativo', color: 'bg-green-100 text-green-800' },
          'vencido': { label: 'Vencido', color: 'bg-red-100 text-red-800' },
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
      label: "Ver detalhes",
      onClick: handleView,
      className: "text-blue-600 hover:text-blue-900"
    },
    {
      icon: PlusCircle,
      label: "Adicionar empenho",
      onClick: handleAddCommitment,
      className: "text-green-600 hover:text-green-900"
    },
    {
      icon: Edit,
      label: "Editar",
      onClick: handleEdit,
      className: "text-gray-600 hover:text-gray-900"
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
                  Gestão de Processos
                </h1>
                <p className="mt-1 text-sm text-gray-500">
                  Controle de contratos, saldos e empenhos
                </p>
              </div>
              <div className="mt-6 flex space-x-3 md:mt-0 md:ml-4">
                <Button 
                  onClick={() => {
                    setSelectedProcess(null);
                    setIsModalOpen(true);
                  }}
                  className="inline-flex items-center bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Contrato
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
            <CardTitle>Contratos e Processos</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6 text-center text-gray-500">Carregando...</div>
            ) : (
              <DataTable
                data={filteredProcesses}
                columns={columns}
                actions={actions}
              />
            )}
          </CardContent>
        </Card>

        {/* Process Modal */}
        <ProcessModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedProcess(null);
          }}
          process={selectedProcess}
        />
      </div>
    </Layout>
  );
}
