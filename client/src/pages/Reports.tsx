import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Download, FileText, TrendingUp, Calendar } from "lucide-react";

export default function Reports() {
  const [reportType, setReportType] = useState("summary");
  const [dateRange, setDateRange] = useState("30d");

  const { data: stats } = useQuery({
    queryKey: ['/api/dashboard/stats'],
    retry: false,
  });

  const { data: samples } = useQuery({
    queryKey: ['/api/samples'],
    retry: false,
  });

  const { data: processes } = useQuery({
    queryKey: ['/api/processes'],
    retry: false,
  });

  // Mock data for charts
  const approvalRateData = [
    { month: 'Jan', aprovado: 85, reprovado: 15 },
    { month: 'Fev', aprovado: 78, reprovado: 22 },
    { month: 'Mar', aprovado: 92, reprovado: 8 },
    { month: 'Abr', aprovado: 87, reprovado: 13 },
    { month: 'Mai', aprovado: 89, reprovado: 11 },
    { month: 'Jun', aprovado: 94, reprovado: 6 },
  ];

  const agencyData = [
    { name: 'Min. Saúde', value: 35, color: '#3B82F6' },
    { name: 'Min. Educação', value: 28, color: '#10B981' },
    { name: 'Min. Defesa', value: 22, color: '#F59E0B' },
    { name: 'Outros', value: 15, color: '#6B7280' },
  ];

  const contractTypeData = [
    { name: 'Registro de Preços', value: 45, color: '#8B5CF6' },
    { name: 'Compra Direta', value: 30, color: '#EF4444' },
    { name: 'Dispensa', value: 15, color: '#06B6D4' },
    { name: 'CD + RP', value: 10, color: '#F97316' },
  ];

  const handleExport = (type: string) => {
    // TODO: Implement export functionality
    console.log(`Exporting ${type} report`);
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="bg-white shadow">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="py-6 md:flex md:items-center md:justify-between">
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                  Relatórios e Analytics
                </h1>
                <p className="mt-1 text-sm text-gray-500">
                  Análise detalhada de desempenho e estatísticas
                </p>
              </div>
              <div className="mt-6 flex space-x-3 md:mt-0 md:ml-4">
                <Select value={dateRange} onValueChange={setDateRange}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7d">7 dias</SelectItem>
                    <SelectItem value="30d">30 dias</SelectItem>
                    <SelectItem value="90d">90 dias</SelectItem>
                    <SelectItem value="1y">1 ano</SelectItem>
                  </SelectContent>
                </Select>
                <Button 
                  variant="outline" 
                  onClick={() => handleExport('pdf')}
                  className="inline-flex items-center"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Exportar
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Report Type Selector */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="summary">Resumo Geral</SelectItem>
                  <SelectItem value="samples">Relatório de Amostras</SelectItem>
                  <SelectItem value="processes">Relatório de Processos</SelectItem>
                  <SelectItem value="commitments">Relatório de Empenhos</SelectItem>
                  <SelectItem value="ml">Análise ML</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <FileText className="h-8 w-8 text-blue-500" />
                </div>
                <div className="ml-4">
                  <div className="text-sm font-medium text-gray-500">Total de Pregões</div>
                  <div className="text-2xl font-bold text-gray-900">
                    {(samples?.length || 0) + (processes?.length || 0)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <TrendingUp className="h-8 w-8 text-green-500" />
                </div>
                <div className="ml-4">
                  <div className="text-sm font-medium text-gray-500">Taxa Sucesso</div>
                  <div className="text-2xl font-bold text-gray-900">
                    {stats?.approvalRate || 0}%
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Calendar className="h-8 w-8 text-purple-500" />
                </div>
                <div className="ml-4">
                  <div className="text-sm font-medium text-gray-500">Este Mês</div>
                  <div className="text-2xl font-bold text-gray-900">12</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center">
                    <span className="text-amber-600 text-sm font-bold">R$</span>
                  </div>
                </div>
                <div className="ml-4">
                  <div className="text-sm font-medium text-gray-500">Valor Total</div>
                  <div className="text-2xl font-bold text-gray-900">5,2M</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Approval Rate Trend */}
          <Card>
            <CardHeader>
              <CardTitle>Taxa de Aprovação por Mês</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={approvalRateData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="aprovado" fill="#10B981" />
                  <Bar dataKey="reprovado" fill="#EF4444" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Agency Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Distribuição por Órgão</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={agencyData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={120}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {agencyData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-4 grid grid-cols-2 gap-2">
                {agencyData.map((item, index) => (
                  <div key={index} className="flex items-center">
                    <div 
                      className="w-3 h-3 rounded mr-2" 
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-sm text-gray-600">{item.name}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Performing Agencies */}
          <Card>
            <CardHeader>
              <CardTitle>Órgãos com Melhor Desempenho</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { name: 'Ministério da Saúde', success: 94, total: 45 },
                  { name: 'Ministério da Educação', success: 89, total: 32 },
                  { name: 'Ministério da Defesa', success: 87, total: 28 },
                  { name: 'Ministério da Justiça', success: 82, total: 19 },
                ].map((agency, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">
                        {agency.name}
                      </div>
                      <div className="flex items-center mt-1">
                        <Progress value={agency.success} className="w-24 mr-2" />
                        <span className="text-xs text-gray-500">
                          {agency.success}% ({agency.total} pregões)
                        </span>
                      </div>
                    </div>
                    <Badge 
                      className={
                        agency.success >= 90 
                          ? 'bg-green-100 text-green-800'
                          : agency.success >= 85 
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }
                    >
                      {agency.success}%
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Contract Types */}
          <Card>
            <CardHeader>
              <CardTitle>Tipos de Contratação</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {contractTypeData.map((type, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div 
                        className="w-4 h-4 rounded mr-3" 
                        style={{ backgroundColor: type.color }}
                      />
                      <span className="text-sm font-medium text-gray-900">
                        {type.name}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Progress value={type.value} className="w-16" />
                      <span className="text-sm text-gray-500 w-8 text-right">
                        {type.value}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Export Options */}
        <Card>
          <CardHeader>
            <CardTitle>Opções de Exportação</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button
                variant="outline"
                onClick={() => handleExport('excel')}
                className="justify-start"
              >
                <FileText className="h-4 w-4 mr-2" />
                Exportar para Excel
              </Button>
              <Button
                variant="outline"
                onClick={() => handleExport('pdf')}
                className="justify-start"
              >
                <Download className="h-4 w-4 mr-2" />
                Relatório em PDF
              </Button>
              <Button
                variant="outline"
                onClick={() => handleExport('csv')}
                className="justify-start"
              >
                <TrendingUp className="h-4 w-4 mr-2" />
                Dados em CSV
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
