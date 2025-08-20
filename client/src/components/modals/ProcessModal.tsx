import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Edit, Trash2, Package, FileText, DollarSign, Calculator } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

const processSchema = z.object({
  number: z.string().min(1, "Número do pregão é obrigatório"),
  contractNumber: z.string().min(1, "Número do contrato é obrigatório"),
  uasg: z.string().min(1, "UASG é obrigatória"),
  agency: z.string().min(1, "Órgão é obrigatório"),
  contractType: z.enum(["registro_precos", "compra_direta", "dispensa", "compra_direta_rp"]),
  contractDate: z.string().optional(),
  validityMonths: z.number().min(1).max(60).default(12),
  status: z.enum(["ativo", "vencido", "encerrado"]).default("ativo"),
});

const processItemSchema = z.object({
  code: z.string().min(1, "Código é obrigatório"),
  description: z.string().min(1, "Descrição é obrigatória"),
  brand: z.string().optional(),
  model: z.string().optional(),
  batch: z.string().optional(),
  awardedQuantity: z.number().min(1, "Quantidade deve ser maior que 0"),
  unitPrice: z.number().min(0.01, "Preço unitário deve ser maior que 0"),
});

const commitmentSchema = z.object({
  number: z.string().min(1, "Número do empenho é obrigatório"),
  date: z.string().min(1, "Data é obrigatória"),
  agency: z.string().min(1, "Órgão empenhador é obrigatório"),
  items: z.array(z.object({
    processItemId: z.string(),
    quantity: z.number().min(1),
    unitPrice: z.number().min(0.01),
  })).min(1, "Selecione pelo menos um item"),
});

type ProcessForm = z.infer<typeof processSchema>;
type ProcessItemForm = z.infer<typeof processItemSchema>;
type CommitmentForm = z.infer<typeof commitmentSchema>;

interface ProcessModalProps {
  isOpen: boolean;
  onClose: () => void;
  process?: any;
}

export default function ProcessModal({ isOpen, onClose, process }: ProcessModalProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("basic");
  const [editingItem, setEditingItem] = useState<any>(null);
  const [showItemForm, setShowItemForm] = useState(false);
  const [showCommitmentForm, setShowCommitmentForm] = useState(false);
  const [selectedCommitmentItems, setSelectedCommitmentItems] = useState<string[]>([]);

  const form = useForm<ProcessForm>({
    resolver: zodResolver(processSchema),
    defaultValues: {
      number: "",
      contractNumber: "",
      uasg: "",
      agency: "",
      contractType: "registro_precos",
      contractDate: "",
      validityMonths: 12,
      status: "ativo",
    },
  });

  const itemForm = useForm<ProcessItemForm>({
    resolver: zodResolver(processItemSchema),
    defaultValues: {
      code: "",
      description: "",
      brand: "",
      model: "",
      batch: "",
      awardedQuantity: 1,
      unitPrice: 0,
    },
  });

  const commitmentForm = useForm<CommitmentForm>({
    resolver: zodResolver(commitmentSchema),
    defaultValues: {
      number: "",
      date: "",
      agency: "",
      items: [],
    },
  });

  // Load process items and commitments if editing
  const { data: processItems = [], refetch: refetchItems } = useQuery({
    queryKey: ['/api/processes', process?.id, 'items'],
    enabled: !!process?.id && isOpen,
    retry: false,
  });

  const { data: commitments = [], refetch: refetchCommitments } = useQuery({
    queryKey: ['/api/commitments', { processId: process?.id }],
    enabled: !!process?.id && isOpen,
    retry: false,
  });

  const createMutation = useMutation({
    mutationFn: async (data: ProcessForm) => {
      const payload = {
        ...data,
        contractDate: data.contractDate ? new Date(data.contractDate).toISOString().split('T')[0] : null,
        createdBy: user?.id,
      };
      await apiRequest('POST', '/api/processes', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/processes'] });
      onClose();
      form.reset();
      toast({
        title: "Sucesso",
        description: "Processo criado com sucesso",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Falha ao criar processo",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: ProcessForm) => {
      const payload = {
        ...data,
        contractDate: data.contractDate ? new Date(data.contractDate).toISOString().split('T')[0] : null,
      };
      await apiRequest('PUT', `/api/processes/${process.id}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/processes'] });
      onClose();
      toast({
        title: "Sucesso",
        description: "Processo atualizado com sucesso",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Falha ao atualizar processo",
        variant: "destructive",
      });
    },
  });

  // Item mutations
  const createItemMutation = useMutation({
    mutationFn: async (data: ProcessItemForm) => {
      const totalValue = data.awardedQuantity * data.unitPrice;
      await apiRequest('POST', `/api/processes/${process?.id}/items`, {
        ...data,
        totalValue: totalValue.toFixed(2),
      });
    },
    onSuccess: () => {
      refetchItems();
      setShowItemForm(false);
      setEditingItem(null);
      itemForm.reset();
      toast({
        title: "Sucesso",
        description: "Item adicionado com sucesso",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Falha ao adicionar item",
        variant: "destructive",
      });
    },
  });

  const updateItemMutation = useMutation({
    mutationFn: async (data: ProcessItemForm) => {
      const totalValue = data.awardedQuantity * data.unitPrice;
      await apiRequest('PUT', `/api/processes/${process?.id}/items/${editingItem?.id}`, {
        ...data,
        totalValue: totalValue.toFixed(2),
      });
    },
    onSuccess: () => {
      refetchItems();
      setShowItemForm(false);
      setEditingItem(null);
      itemForm.reset();
      toast({
        title: "Sucesso",
        description: "Item atualizado com sucesso",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Falha ao atualizar item",
        variant: "destructive",
      });
    },
  });

  const deleteItemMutation = useMutation({
    mutationFn: async (itemId: string) => {
      await apiRequest('DELETE', `/api/processes/${process?.id}/items/${itemId}`);
    },
    onSuccess: () => {
      refetchItems();
      toast({
        title: "Sucesso",
        description: "Item excluído com sucesso",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Falha ao excluir item",
        variant: "destructive",
      });
    },
  });

  // Commitment mutations
  const createCommitmentMutation = useMutation({
    mutationFn: async (data: CommitmentForm) => {
      const totalValue = data.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
      await apiRequest('POST', `/api/commitments`, {
        processId: process?.id,
        number: data.number,
        date: data.date,
        agency: data.agency,
        totalValue: totalValue.toFixed(2),
        items: data.items,
      });
    },
    onSuccess: () => {
      refetchCommitments();
      refetchItems();
      setShowCommitmentForm(false);
      commitmentForm.reset();
      setSelectedCommitmentItems([]);
      toast({
        title: "Sucesso",
        description: "Empenho criado com sucesso",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Falha ao criar empenho",
        variant: "destructive",
      });
    },
  });

  // Helper functions
  const handleSubmit = (data: ProcessForm) => {
    if (process) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const handleItemSubmit = (data: ProcessItemForm) => {
    if (editingItem) {
      updateItemMutation.mutate(data);
    } else {
      createItemMutation.mutate(data);
    }
  };

  const handleCommitmentSubmit = (data: CommitmentForm) => {
    const commitmentItems = selectedCommitmentItems.map(itemId => {
      const item = processItems.find((pi: any) => pi.id === itemId);
      return {
        processItemId: itemId,
        quantity: 1,
        unitPrice: item?.unitPrice || 0,
      };
    });
    
    createCommitmentMutation.mutate({
      ...data,
      items: commitmentItems,
    });
  };

  const handleEditItem = (item: any) => {
    setEditingItem(item);
    itemForm.reset({
      code: item.code || "",
      description: item.description || "",
      brand: item.brand || "",
      model: item.model || "",
      batch: item.batch || "",
      awardedQuantity: item.awardedQuantity || 1,
      unitPrice: parseFloat(item.unitPrice || "0"),
    });
    setShowItemForm(true);
  };

  const handleDeleteItem = (itemId: string) => {
    if (confirm("Tem certeza que deseja excluir este item?")) {
      deleteItemMutation.mutate(itemId);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const calculateTotalValue = () => {
    return processItems.reduce((sum: number, item: any) => sum + parseFloat(item.totalValue || 0), 0);
  };

  const calculateCommittedValue = () => {
    return commitments.reduce((sum: number, commitment: any) => sum + parseFloat(commitment.totalValue || 0), 0);
  };

  const calculateCommitmentPercentage = () => {
    const total = calculateTotalValue();
    const committed = calculateCommittedValue();
    return total > 0 ? Math.round((committed / total) * 100) : 0;
  };

  useEffect(() => {
    if (process && isOpen) {
      form.reset({
        number: process.number || "",
        contractNumber: process.contractNumber || "",
        uasg: process.uasg || "",
        agency: process.agency || "",
        contractType: process.contractType || "registro_precos",
        contractDate: process.contractDate ? new Date(process.contractDate).toISOString().split('T')[0] : "",
        validityMonths: process.validityMonths || 12,
        status: process.status || "ativo",
      });
    } else if (!process && isOpen) {
      form.reset({
        number: "",
        contractNumber: "",
        uasg: "",
        agency: "",
        contractType: "registro_precos",
        contractDate: "",
        validityMonths: 12,
        status: "ativo",
      });
    }
  }, [process, isOpen, form]);

  const getContractTypeLabel = (type: string) => {
    const types = {
      'registro_precos': 'Registro de Preços',
      'compra_direta': 'Compra Direta',
      'dispensa': 'Dispensa',
      'compra_direta_rp': 'Compra Direta + RP'
    };
    return types[type as keyof typeof types] || type;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {process ? "Editar Processo" : "Novo Processo"}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="basic" className="flex items-center gap-2">
              <FileText size={16} />
              Informações Básicas
            </TabsTrigger>
            <TabsTrigger value="items" className="flex items-center gap-2" disabled={!process}>
              <Package size={16} />
              Itens ({processItems.length || 0})
            </TabsTrigger>
            <TabsTrigger value="commitments" className="flex items-center gap-2" disabled={!process}>
              <DollarSign size={16} />
              Empenhos ({commitments.length || 0})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="number"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nº do Pregão *</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="PE-2024-001" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="contractNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nº do Contrato *</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="CONT-2024-001" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="uasg"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>UASG *</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="123456" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="agency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Órgão *</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Ministério da Saúde" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="contractType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo de Contratação *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="registro_precos">Registro de Preços</SelectItem>
                            <SelectItem value="compra_direta">Compra Direta</SelectItem>
                            <SelectItem value="dispensa">Dispensa</SelectItem>
                            <SelectItem value="compra_direta_rp">Compra Direta + RP</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="ativo">Ativo</SelectItem>
                            <SelectItem value="vencido">Vencido</SelectItem>
                            <SelectItem value="encerrado">Encerrado</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="contractDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data do Contrato/Ata</FormLabel>
                        <FormControl>
                          <Input {...field} type="date" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="validityMonths"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Vigência (meses)</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            type="number" 
                            min="1" 
                            max="60"
                            onChange={(e) => field.onChange(parseInt(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={onClose}>
                    Cancelar
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createMutation.isPending || updateMutation.isPending}
                  >
                    {createMutation.isPending || updateMutation.isPending 
                      ? "Salvando..." 
                      : process ? "Atualizar" : "Criar"
                    }
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </TabsContent>

          <TabsContent value="items" className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-medium">Itens do Processo</h3>
                <p className="text-sm text-gray-600">
                  Total: {formatCurrency(calculateTotalValue())}
                </p>
              </div>
              <Button 
                onClick={() => setShowItemForm(true)}
                className="flex items-center gap-2"
              >
                <Plus size={16} />
                Adicionar Item
              </Button>
            </div>

            {processItems.length > 0 ? (
              <div className="space-y-2">
                {processItems.map((item: any) => (
                  <Card key={item.id}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline">{item.code}</Badge>
                            {item.brand && <Badge variant="secondary">{item.brand}</Badge>}
                          </div>
                          <h4 className="font-medium mb-1">{item.description}</h4>
                          <div className="text-sm text-gray-600 space-y-1">
                            {item.model && <p>Modelo: {item.model}</p>}
                            {item.batch && <p>Lote: {item.batch}</p>}
                            <p>Quantidade: {item.awardedQuantity}</p>
                            <p>Preço unitário: {formatCurrency(parseFloat(item.unitPrice))}</p>
                            <p className="font-medium">Total: {formatCurrency(parseFloat(item.totalValue))}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditItem(item)}
                          >
                            <Edit size={14} />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteItem(item.id)}
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                Nenhum item adicionado ainda
              </div>
            )}

            {showItemForm && (
              <Card>
                <CardHeader>
                  <CardTitle>
                    {editingItem ? "Editar Item" : "Adicionar Item"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Form {...itemForm}>
                    <form onSubmit={itemForm.handleSubmit(handleItemSubmit)} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={itemForm.control}
                          name="code"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Código *</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="ITEM-001" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={itemForm.control}
                          name="brand"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Marca</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="Nome da marca" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={itemForm.control}
                          name="description"
                          render={({ field }) => (
                            <FormItem className="md:col-span-2">
                              <FormLabel>Descrição *</FormLabel>
                              <FormControl>
                                <Textarea {...field} placeholder="Descrição detalhada do item" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={itemForm.control}
                          name="model"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Modelo</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="Modelo do produto" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={itemForm.control}
                          name="batch"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Lote</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="Número do lote" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={itemForm.control}
                          name="awardedQuantity"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Quantidade Arrematada *</FormLabel>
                              <FormControl>
                                <Input 
                                  {...field} 
                                  type="number" 
                                  min="1"
                                  onChange={(e) => field.onChange(parseInt(e.target.value))}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={itemForm.control}
                          name="unitPrice"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Preço Unitário *</FormLabel>
                              <FormControl>
                                <Input 
                                  {...field} 
                                  type="number" 
                                  step="0.01"
                                  min="0.01"
                                  onChange={(e) => field.onChange(parseFloat(e.target.value))}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button type="submit" disabled={createItemMutation.isPending || updateItemMutation.isPending}>
                          {createItemMutation.isPending || updateItemMutation.isPending 
                            ? "Salvando..." 
                            : editingItem ? "Atualizar" : "Adicionar"
                          }
                        </Button>
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => {
                            setShowItemForm(false);
                            setEditingItem(null);
                            itemForm.reset();
                          }}
                        >
                          Cancelar
                        </Button>
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="commitments" className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-medium">Empenhos</h3>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span>Empenhado: {formatCurrency(calculateCommittedValue())}</span>
                  <span>Total do processo: {formatCurrency(calculateTotalValue())}</span>
                  <div className="flex items-center gap-2">
                    <Progress value={calculateCommitmentPercentage()} className="w-20" />
                    <span>{calculateCommitmentPercentage()}%</span>
                  </div>
                </div>
              </div>
              <Button 
                onClick={() => setShowCommitmentForm(true)}
                className="flex items-center gap-2"
                disabled={processItems.length === 0}
              >
                <Plus size={16} />
                Novo Empenho
              </Button>
            </div>

            {commitments.length > 0 ? (
              <div className="space-y-2">
                {commitments.map((commitment: any) => (
                  <Card key={commitment.id}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <Badge>{commitment.number}</Badge>
                            <span className="text-sm text-gray-600">
                              {new Date(commitment.date).toLocaleDateString('pt-BR')}
                            </span>
                          </div>
                          <p className="font-medium">{commitment.agency}</p>
                          <p className="text-lg font-bold text-green-600">
                            {formatCurrency(parseFloat(commitment.totalValue))}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                Nenhum empenho criado ainda
              </div>
            )}

            {showCommitmentForm && (
              <Card>
                <CardHeader>
                  <CardTitle>Novo Empenho</CardTitle>
                </CardHeader>
                <CardContent>
                  <Form {...commitmentForm}>
                    <form onSubmit={commitmentForm.handleSubmit(handleCommitmentSubmit)} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={commitmentForm.control}
                          name="number"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Número do Empenho *</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="2024NE000001" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={commitmentForm.control}
                          name="date"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Data do Empenho *</FormLabel>
                              <FormControl>
                                <Input {...field} type="date" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={commitmentForm.control}
                          name="agency"
                          render={({ field }) => (
                            <FormItem className="md:col-span-2">
                              <FormLabel>Órgão Empenhador *</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="Nome do órgão responsável pelo empenho" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div>
                        <FormLabel>Itens do Empenho *</FormLabel>
                        <div className="space-y-2 mt-2">
                          {processItems.map((item: any) => (
                            <div key={item.id} className="flex items-center space-x-2 p-2 border rounded">
                              <Checkbox
                                checked={selectedCommitmentItems.includes(item.id)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setSelectedCommitmentItems([...selectedCommitmentItems, item.id]);
                                  } else {
                                    setSelectedCommitmentItems(selectedCommitmentItems.filter(id => id !== item.id));
                                  }
                                }}
                              />
                              <div className="flex-1">
                                <p className="font-medium">{item.code} - {item.description}</p>
                                <p className="text-sm text-gray-600">
                                  Qtd: {item.awardedQuantity} | Valor unitário: {formatCurrency(parseFloat(item.unitPrice))}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button 
                          type="submit" 
                          disabled={createCommitmentMutation.isPending || selectedCommitmentItems.length === 0}
                        >
                          {createCommitmentMutation.isPending ? "Criando..." : "Criar Empenho"}
                        </Button>
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => {
                            setShowCommitmentForm(false);
                            commitmentForm.reset();
                            setSelectedCommitmentItems([]);
                          }}
                        >
                          Cancelar
                        </Button>
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}