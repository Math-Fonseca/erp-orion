import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Upload, FileText, CheckCircle, AlertCircle, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ImportModal({ isOpen, onClose }: ImportModalProps) {
  const [importType, setImportType] = useState("samples");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { toast } = useToast();

  const importMutation = useMutation({
    mutationFn: async () => {
      if (!selectedFile) throw new Error("No file selected");
      
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('type', importType);
      
      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 200);

      const response = await fetch('/api/import', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error);
      }

      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/samples'] });
      queryClient.invalidateQueries({ queryKey: ['/api/processes'] });
      queryClient.invalidateQueries({ queryKey: ['/api/catalog'] });
      
      toast({
        title: "Importação concluída",
        description: `${data.data?.length || 0} itens importados com sucesso`,
      });
      
      handleClose();
    },
    onError: (error: any) => {
      setUploadProgress(0);
      toast({
        title: "Erro na importação",
        description: error.message || "Falha ao processar arquivo",
        variant: "destructive",
      });
    },
  });

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (file: File) => {
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'application/pdf',
      'application/xml',
      'text/xml'
    ];

    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Tipo de arquivo não suportado",
        description: "Selecione um arquivo Excel (.xlsx, .xls), PDF ou XML",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "Arquivo muito grande",
        description: "O arquivo deve ter no máximo 10MB",
        variant: "destructive",
      });
      return;
    }

    setSelectedFile(file);
  };

  const handleClose = () => {
    setSelectedFile(null);
    setUploadProgress(0);
    setImportType("samples");
    onClose();
  };

  const handleImport = () => {
    if (!selectedFile) {
      toast({
        title: "Nenhum arquivo selecionado",
        description: "Selecione um arquivo para importar",
        variant: "destructive",
      });
      return;
    }
    
    setUploadProgress(0);
    importMutation.mutate();
  };

  const getFileIcon = (file: File) => {
    if (file.type.includes('excel') || file.type.includes('spreadsheet')) {
      return <FileText className="h-8 w-8 text-green-600" />;
    }
    if (file.type.includes('pdf')) {
      return <FileText className="h-8 w-8 text-red-600" />;
    }
    if (file.type.includes('xml')) {
      return <FileText className="h-8 w-8 text-blue-600" />;
    }
    return <FileText className="h-8 w-8 text-gray-600" />;
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Importar Dados</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Import Type Selection */}
          <div>
            <Label className="text-sm font-medium text-gray-700 mb-2 block">
              Tipo de Importação
            </Label>
            <Select value={importType} onValueChange={setImportType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="samples">Pregão de Amostras</SelectItem>
                <SelectItem value="processes">Processos/Contratos</SelectItem>
                <SelectItem value="catalog">Catálogo de Itens</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* File Upload Area */}
          <div>
            <Label className="text-sm font-medium text-gray-700 mb-2 block">
              Arquivo
            </Label>
            
            {!selectedFile ? (
              <div
                className={`flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md transition-colors ${
                  dragActive 
                    ? 'border-blue-400 bg-blue-50' 
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <div className="space-y-1 text-center">
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="flex text-sm text-gray-600">
                    <label className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500">
                      <span>Escolher arquivo</span>
                      <input
                        type="file"
                        className="sr-only"
                        accept=".xlsx,.xls,.pdf,.xml"
                        onChange={(e) => e.target.files && handleFileSelect(e.target.files[0])}
                      />
                    </label>
                    <p className="pl-1">ou arraste e solte</p>
                  </div>
                  <p className="text-xs text-gray-500">Excel, PDF ou XML até 10MB</p>
                </div>
              </div>
            ) : (
              <div className="border border-gray-300 rounded-md p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    {getFileIcon(selectedFile)}
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">
                        {selectedFile.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedFile(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {/* Progress Bar */}
                {importMutation.isPending && (
                  <div className="mt-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-600">Processando...</span>
                      <span className="text-xs text-gray-600">{uploadProgress}%</span>
                    </div>
                    <Progress value={uploadProgress} className="w-full" />
                  </div>
                )}

                {/* Success/Error States */}
                {uploadProgress === 100 && !importMutation.isPending && !importMutation.isError && (
                  <div className="mt-3 flex items-center text-green-600">
                    <CheckCircle className="h-4 w-4 mr-1" />
                    <span className="text-xs">Importação concluída</span>
                  </div>
                )}

                {importMutation.isError && (
                  <div className="mt-3 flex items-center text-red-600">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    <span className="text-xs">Erro na importação</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button
            onClick={handleImport}
            disabled={!selectedFile || importMutation.isPending}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {importMutation.isPending ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Importando...
              </div>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Importar
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
