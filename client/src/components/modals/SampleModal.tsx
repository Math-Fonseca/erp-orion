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
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Edit, Trash2, Package } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

const sampleBiddingSchema = z.object({
  number: z.string().min(1, "Número do pregão é obrigatório"),
  uasg: z.string().min(1, "UASG é obrigatória"),
  agency: z.string().min(1, "Órgão é obrigatório"),
  sendDate: z.string().optional(),
  trackingCode: z.string().optional(),
  returnDate: z.string().optional(),
  willBeDeducted: z.boolean().default(false),
  status: z.enum(["em_andamento", "aprovado", "reprovado", "encerrado"]).default("em_andamento"),
});

const sampleItemSchema = z.object({
  code: z.string().min(1, "Código é obrigatório"),
  description: z.string().min(1, "Descrição é obrigatória"),
  brand: z.string().optional(),
  batch: z.string().optional(),
  quantity: z.number().min(1, "Quantidade deve ser maior que 0"),
  result: z.enum(["aprovado", "reprovado", "pendente"]).optional(),
  reason: z.string().optional(),
});

type SampleBiddingForm = z.infer<typeof sampleBiddingSchema>;
type SampleItemForm = z.infer<typeof sampleItemSchema>;

interface SampleModalProps {
  isOpen: boolean;
  onClose: () => void;
  sample?: any;
}

export default function SampleModal({ isOpen, onClose, sample }: SampleModalProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("basic");
  const [editingItem, setEditingItem] = useState<any>(null);
  const [showItemForm, setShowItemForm] = useState(false);

  const form = useForm<SampleBiddingForm>({
    resolver: zodResolver(sampleBiddingSchema),
    defaultValues: {
      number: "",
      uasg: "",
      agency: "",
      sendDate: "",
      trackingCode: "",
      returnDate: "",
      willBeDeducted: false,
      status: "em_andamento",
    },
  });

  const itemForm = useForm<SampleItemForm>({
    resolver: zodResolver(sampleItemSchema),
    defaultValues: {
      code: "",
      description: "",
      brand: "",
      batch: "",
      quantity: 1,
      result: "pendente",
      reason: "",
    },
  });

  // Load sample items if editing
  const { data: sampleItems, refetch: refetchItems } = useQuery({
    queryKey: ['/api/samples', sample?.id, 'items'],
    enabled: !!sample?.id && isOpen,
    retry: false,
  });

  const createMutation = useMutation({
    mutationFn: async (data: SampleBiddingForm) => {
      const payload = {
        ...data,
        sendDate: data.sendDate ? new Date(data.sendDate).toISOString().split('T')[0] : null,
        returnDate: data.returnDate ? new Date(data.returnDate).toISOString().split('T')[0] : null,
        createdBy: user?.id,
      };
      await apiRequest('POST', '/api/samples', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/samples'] });
      onClose();
      form.reset();
      toast({
        title: "Sucesso",
        description: "Pregão de amostra criado com sucesso",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Falha ao criar pregão de amostra",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: SampleBiddingForm) => {
      const payload = {
        ...data,
        sendDate: data.sendDate ? new Date(data.sendDate).toISOString().split('T')[0] : null,
        returnDate: data.returnDate ? new Date(data.returnDate).toISOString().split('T')[0] : null,
      };
      await apiRequest('PUT', `/api/samples/${sample.id}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/samples'] });
      onClose();
      toast({
        title: "Sucesso",
        description: "Pregão de amostra atualizado com sucesso",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Falha ao atualizar pregão de amostra",
        variant: "destructive",
      });
    },
  });

  // Item mutations
  const createItemMutation = useMutation({
    mutationFn: async (data: SampleItemForm) => {
      await apiRequest('POST', `/api/samples/${sample.id}/items`, data);
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
    mutationFn: async (data: SampleItemForm) => {
      await apiRequest('PUT', `/api/samples/${sample.id}/items/${editingItem.id}`, data);
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
      await apiRequest('DELETE', `/api/samples/${sample.id}/items/${itemId}`);
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

  useEffect(() => {
    if (sample && isOpen) {
      form.reset({
        number: sample.number || "",
        uasg: sample.uasg || "",
        agency: sample.agency || "",
        sendDate: sample.sendDate ? new Date(sample.sendDate).toISOString().split('T')[0] : "",
        trackingCode: sample.trackingCode || "",
        returnDate: sample.returnDate ? new Date(sample.returnDate).toISOString().split('T')[0] : "",
        willBeDeducted: sample.willBeDeducted || false,
        status: sample.status || "em_andamento",
      });
    } else if (!sample && isOpen) {
      form.reset({
        number: "",
        uasg: "",
        agency: "",
        sendDate: "",
        trackingCode: "",
        returnDate: "",
        willBeDeducted: false,
        status: "em_andamento",
      });
    }
  }, [sample, isOpen, form]);

  const onSubmit = (data: SampleBiddingForm) => {
    if (sample) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const onItemSubmit = (data: SampleItemForm) => {
    if (editingItem) {
      updateItemMutation.mutate(data);
    } else {
      createItemMutation.mutate(data);
    }
  };

  const handleEditItem = (item: any) => {
    setEditingItem(item);
    itemForm.reset({
      code: item.code || "",
      description: item.description || "",
      brand: item.brand || "",
      batch: item.batch || "",
      quantity: item.quantity || 1,
      result: item.result || "pendente",
      reason: item.reason || "",
    });
    setShowItemForm(true);
  };

  const handleDeleteItem = (itemId: string) => {
    if (confirm("Tem certeza que deseja excluir este item?")) {
      deleteItemMutation.mutate(itemId);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {sample ? "Editar Pregão de Amostra" : "Novo Pregão de Amostra"}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="basic">Informações Básicas</TabsTrigger>
            <TabsTrigger value="items" disabled={!sample}>
              <Package className="w-4 h-4 mr-2" />
              Itens ({sampleItems?.length || 0})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="number"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nº do Pregão *</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="2024001" />
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
                    name="sendDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data de Envio</FormLabel>
                        <FormControl>
                          <Input {...field} type="date" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="trackingCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Código de Rastreio</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="BR123456789" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="returnDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data de Retorno</FormLabel>
                        <FormControl>
                          <Input {...field} type="date" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                            <SelectItem value="em_andamento">Em Andamento</SelectItem>
                            <SelectItem value="aprovado">Aprovado</SelectItem>
                            <SelectItem value="reprovado">Reprovado</SelectItem>
                            <SelectItem value="encerrado">Encerrado</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="willBeDeducted"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>
                            Será Abatido
                          </FormLabel>
                        </div>
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
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {sample ? "Atualizar" : "Criar"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </TabsContent>

          <TabsContent value="items" className="space-y-6">
            {sample && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Itens da Amostra</h3>
                  <Button
                    onClick={() => {
                      setEditingItem(null);
                      itemForm.reset();
                      setShowItemForm(true);
                    }}
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar Item
                  </Button>
                </div>

                {/* Item Form */}
                {showItemForm && (
                  <Card>
                    <CardHeader>
                      <CardTitle>{editingItem ? "Editar Item" : "Novo Item"}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Form {...itemForm}>
                        <form onSubmit={itemForm.handleSubmit(onItemSubmit)} className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                              control={itemForm.control}
                              name="code"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Código do Item *</FormLabel>
                                  <FormControl>
                                    <Input {...field} placeholder="OR123, PM006.000.000" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={itemForm.control}
                              name="description"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Descrição *</FormLabel>
                                  <FormControl>
                                    <Input {...field} placeholder="Descrição do item" />
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
                              name="quantity"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Quantidade *</FormLabel>
                                  <FormControl>
                                    <Input 
                                      {...field} 
                                      type="number" 
                                      min="1"
                                      onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={itemForm.control}
                              name="result"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Resultado da Avaliação</FormLabel>
                                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="pendente">Pendente</SelectItem>
                                      <SelectItem value="aprovado">Aprovado</SelectItem>
                                      <SelectItem value="reprovado">Reprovado</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          {itemForm.watch("result") === "reprovado" && (
                            <FormField
                              control={itemForm.control}
                              name="reason"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Motivo da Reprovação</FormLabel>
                                  <FormControl>
                                    <Textarea 
                                      {...field} 
                                      placeholder="Descreva o motivo da reprovação..."
                                      rows={3}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          )}

                          <div className="flex justify-end space-x-2">
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
                            <Button
                              type="submit"
                              disabled={createItemMutation.isPending || updateItemMutation.isPending}
                              className="bg-blue-600 hover:bg-blue-700"
                            >
                              {editingItem ? "Atualizar" : "Adicionar"}
                            </Button>
                          </div>
                        </form>
                      </Form>
                    </CardContent>
                  </Card>
                )}

                {/* Items List */}
                <div className="space-y-3">
                  {sampleItems && sampleItems.length > 0 ? (
                    sampleItems.map((item: any) => (
                      <Card key={item.id}>
                        <CardContent className="pt-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="text-sm font-medium text-gray-900">
                                <span className="font-bold">{item.code}</span> - {item.description}
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                {item.brand && `Marca: ${item.brand} • `}
                                {item.batch && `Lote: ${item.batch} • `}
                                Quantidade: {item.quantity}
                              </div>
                              {item.reason && (
                                <div className="text-xs text-red-600 mt-1">
                                  Motivo: {item.reason}
                                </div>
                              )}
                            </div>
                            <div className="flex items-center space-x-2">
                              <Badge 
                                className={
                                  item.result === 'aprovado' 
                                    ? 'bg-green-100 text-green-800'
                                    : item.result === 'reprovado'
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-yellow-100 text-yellow-800'
                                }
                              >
                                {item.result === 'aprovado' ? 'Aprovado' : 
                                 item.result === 'reprovado' ? 'Reprovado' : 'Pendente'}
                              </Badge>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEditItem(item)}
                              >
                                <Edit className="w-3 h-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDeleteItem(item.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      Nenhum item adicionado ainda. Clique em "Adicionar Item" para começar.
                    </div>
                  )}
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
