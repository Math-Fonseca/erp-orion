import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import Layout from "@/components/Layout";
import KPICard from "@/components/KPICard";
import DataTable from "@/components/DataTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, CheckCircle, File, Percent, Upload, Plus } from "lucide-react";

export default function Dashboard() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/dashboard/stats'],
    retry: false,
  });

  const { data: samples, isLoading: samplesLoading } = useQuery({
    queryKey: ['/api/samples'],
    retry: false,
  });

  const { data: expiringProcesses, isLoading: processesLoading } = useQuery({
    queryKey: ['/api/processes/expiring?days=30'],
    retry: false,
  });

  if (isLoading || !isAuthenticated) {
    return null;
  }

  const sampleColumns = [
    { key: 'number', header: 'Nº Pregão' },
    { key: 'uasg', header: 'UASG' },
    { key: 'agency', header: 'Órgão' },
    { key: 'sendDate', header: 'Data Envio' },
    { key: 'status', header: 'Status' },
  ];

  const processColumns = [
    { key: 'number', header: 'Nº Contrato' },
    { key: 'agency', header: 'Órgão' },
    { key: 'contractType', header: 'Tipo' },
    { key: 'status', header: 'Status' },
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
                  Dashboard
                </h1>
                <p className="mt-1 text-sm text-gray-500">
                  Visão geral dos pregões de amostras e processos ativos
                </p>
              </div>
              <div className="mt-6 flex space-x-3 md:mt-0 md:ml-4">
                <Button variant="outline" className="inline-flex items-center">
                  <Upload className="h-4 w-4 mr-2" />
                  Importar
                </Button>
                <Button className="inline-flex items-center bg-blue-600 hover:bg-blue-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Pregão
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <KPICard
            title="Amostras em Andamento"
            value={stats?.ongoingSamples || 0}
            change="+12%"
            changeType="positive"
            icon={FileText}
            iconColor="text-blue-500"
            iconBg="bg-blue-100"
          />
          <KPICard
            title="Taxa de Aprovação"
            value={`${stats?.approvalRate || 0}%`}
            change="+3%"
            changeType="positive"
            icon={CheckCircle}
            iconColor="text-green-500"
            iconBg="bg-green-100"
          />
          <KPICard
            title="Processos Ativos"
            value={stats?.activeProcesses || 0}
            change="-2%"
            changeType="negative"
            icon={File}
            iconColor="text-purple-500"
            iconBg="bg-purple-100"
          />
          <KPICard
            title="% Empenhado"
            value={`${stats?.commitmentPercentage || 0}%`}
            change="+8%"
            changeType="positive"
            icon={Percent}
            iconColor="text-amber-500"
            iconBg="bg-amber-100"
          />
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Samples */}
          <Card>
            <CardHeader className="border-b border-gray-200">
              <CardTitle className="text-lg leading-6 font-medium text-gray-900">
                Pregões de Amostras Recentes
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {samplesLoading ? (
                <div className="p-6 text-center text-gray-500">Carregando...</div>
              ) : (
                <DataTable
                  data={samples?.slice(0, 5) || []}
                  columns={sampleColumns}
                  compact
                />
              )}
            </CardContent>
          </Card>

          {/* Expiring Processes */}
          <Card>
            <CardHeader className="border-b border-gray-200">
              <CardTitle className="text-lg leading-6 font-medium text-gray-900">
                Processos Vencendo
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {processesLoading ? (
                <div className="p-6 text-center text-gray-500">Carregando...</div>
              ) : (
                <DataTable
                  data={expiringProcesses?.slice(0, 5) || []}
                  columns={processColumns}
                  compact
                />
              )}
            </CardContent>
          </Card>
        </div>

        {/* Main Data Table */}
        <Card>
          <CardHeader className="border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg leading-6 font-medium text-gray-900">
                  Gestão de Amostras
                </CardTitle>
                <p className="mt-1 text-sm text-gray-500">
                  Controle detalhado de pregões e amostras
                </p>
              </div>
              <div className="flex space-x-3">
                <Button variant="outline" size="sm">
                  Filtrar
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {samplesLoading ? (
              <div className="p-6 text-center text-gray-500">Carregando...</div>
            ) : (
              <DataTable
                data={samples || []}
                columns={[
                  ...sampleColumns,
                  { key: 'itemCount', header: 'Itens' },
                  { key: 'mlScore', header: 'ML Score' },
                ]}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
