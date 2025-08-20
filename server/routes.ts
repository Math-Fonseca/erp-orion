import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import multer from "multer";
import { 
  insertSampleBiddingSchema,
  insertSampleItemSchema,
  insertProcessSchema,
  insertProcessItemSchema,
  insertCommitmentSchema,
  insertCommitmentItemSchema,
  insertCatalogItemSchema
} from "@shared/schema";
import { parseExcelFile } from "./services/fileParser";
import { generateMlPrediction } from "./services/mlService";
import { findSimilarItems } from "./services/textSimilarity";

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'application/pdf',
      'application/xml',
      'text/xml'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de arquivo não suportado'));
    }
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Dashboard routes
  app.get('/api/dashboard/stats', isAuthenticated, async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  // Catalog routes
  app.get('/api/catalog', isAuthenticated, async (req, res) => {
    try {
      const items = await storage.getCatalogItems();
      res.json(items);
    } catch (error) {
      console.error("Error fetching catalog items:", error);
      res.status(500).json({ message: "Failed to fetch catalog items" });
    }
  });

  app.get('/api/catalog/search', isAuthenticated, async (req, res) => {
    try {
      const query = req.query.q as string;
      if (!query) {
        return res.status(400).json({ message: "Query parameter 'q' is required" });
      }
      const items = await storage.searchCatalogItems(query);
      res.json(items);
    } catch (error) {
      console.error("Error searching catalog items:", error);
      res.status(500).json({ message: "Failed to search catalog items" });
    }
  });

  app.post('/api/catalog', isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertCatalogItemSchema.parse(req.body);
      const item = await storage.createCatalogItem(validatedData);
      res.status(201).json(item);
    } catch (error) {
      console.error("Error creating catalog item:", error);
      res.status(500).json({ message: "Failed to create catalog item" });
    }
  });

  app.put('/api/catalog/:id', isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = insertCatalogItemSchema.partial().parse(req.body);
      const item = await storage.updateCatalogItem(id, validatedData);
      res.json(item);
    } catch (error) {
      console.error("Error updating catalog item:", error);
      res.status(500).json({ message: "Failed to update catalog item" });
    }
  });

  app.delete('/api/catalog/:id', isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteCatalogItem(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting catalog item:", error);
      res.status(500).json({ message: "Failed to delete catalog item" });
    }
  });

  // Sample bidding routes
  app.get('/api/samples', isAuthenticated, async (req, res) => {
    try {
      const biddings = await storage.getSampleBiddings();
      res.json(biddings);
    } catch (error) {
      console.error("Error fetching sample biddings:", error);
      res.status(500).json({ message: "Failed to fetch sample biddings" });
    }
  });

  app.get('/api/samples/:id', isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const bidding = await storage.getSampleBidding(id);
      if (!bidding) {
        return res.status(404).json({ message: "Sample bidding not found" });
      }
      
      const items = await storage.getSampleItems(id);
      res.json({ ...bidding, items });
    } catch (error) {
      console.error("Error fetching sample bidding:", error);
      res.status(500).json({ message: "Failed to fetch sample bidding" });
    }
  });

  app.post('/api/samples', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = insertSampleBiddingSchema.parse({
        ...req.body,
        createdBy: userId
      });
      const bidding = await storage.createSampleBidding(validatedData);
      res.status(201).json(bidding);
    } catch (error) {
      console.error("Error creating sample bidding:", error);
      res.status(500).json({ message: "Failed to create sample bidding" });
    }
  });

  app.put('/api/samples/:id', isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = insertSampleBiddingSchema.partial().parse(req.body);
      const bidding = await storage.updateSampleBidding(id, validatedData);
      res.json(bidding);
    } catch (error) {
      console.error("Error updating sample bidding:", error);
      res.status(500).json({ message: "Failed to update sample bidding" });
    }
  });

  app.delete('/api/samples/:id', isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteSampleBidding(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting sample bidding:", error);
      res.status(500).json({ message: "Failed to delete sample bidding" });
    }
  });

  // Sample item routes
  app.get('/api/samples/:biddingId/items', isAuthenticated, async (req, res) => {
    try {
      const { biddingId } = req.params;
      const items = await storage.getSampleItems(biddingId);
      res.json(items);
    } catch (error) {
      console.error("Error fetching sample items:", error);
      res.status(500).json({ message: "Failed to fetch sample items" });
    }
  });

  app.post('/api/samples/:biddingId/items', isAuthenticated, async (req, res) => {
    try {
      const { biddingId } = req.params;
      const validatedData = insertSampleItemSchema.parse({
        ...req.body,
        biddingId
      });
      
      const item = await storage.createSampleItem(validatedData);
      
      // Generate ML prediction for the item
      try {
        const prediction = await generateMlPrediction(item);
        await storage.createMlPrediction({
          sampleItemId: item.id,
          ...prediction
        });
      } catch (mlError) {
        console.error("Error generating ML prediction:", mlError);
        // Continue without ML prediction
      }
      
      res.status(201).json(item);
    } catch (error) {
      console.error("Error creating sample item:", error);
      res.status(500).json({ message: "Failed to create sample item" });
    }
  });

  app.put('/api/samples/:biddingId/items/:id', isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = insertSampleItemSchema.partial().parse(req.body);
      const item = await storage.updateSampleItem(id, validatedData);
      res.json(item);
    } catch (error) {
      console.error("Error updating sample item:", error);
      res.status(500).json({ message: "Failed to update sample item" });
    }
  });

  app.delete('/api/samples/:biddingId/items/:id', isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteSampleItem(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting sample item:", error);
      res.status(500).json({ message: "Failed to delete sample item" });
    }
  });

  // Process routes
  app.get('/api/processes', isAuthenticated, async (req, res) => {
    try {
      const processes = await storage.getProcesses();
      res.json(processes);
    } catch (error) {
      console.error("Error fetching processes:", error);
      res.status(500).json({ message: "Failed to fetch processes" });
    }
  });

  app.get('/api/processes/expiring', isAuthenticated, async (req, res) => {
    try {
      const days = parseInt(req.query.days as string) || 30;
      const processes = await storage.getExpiringProcesses(days);
      res.json(processes);
    } catch (error) {
      console.error("Error fetching expiring processes:", error);
      res.status(500).json({ message: "Failed to fetch expiring processes" });
    }
  });

  app.get('/api/processes/:id', isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const process = await storage.getProcess(id);
      if (!process) {
        return res.status(404).json({ message: "Process not found" });
      }
      
      const items = await storage.getProcessItems(id);
      const commitments = await storage.getCommitments(id);
      res.json({ ...process, items, commitments });
    } catch (error) {
      console.error("Error fetching process:", error);
      res.status(500).json({ message: "Failed to fetch process" });
    }
  });

  app.post('/api/processes', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = insertProcessSchema.parse({
        ...req.body,
        createdBy: userId
      });
      const process = await storage.createProcess(validatedData);
      res.status(201).json(process);
    } catch (error) {
      console.error("Error creating process:", error);
      res.status(500).json({ message: "Failed to create process" });
    }
  });

  app.put('/api/processes/:id', isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = insertProcessSchema.partial().parse(req.body);
      const process = await storage.updateProcess(id, validatedData);
      res.json(process);
    } catch (error) {
      console.error("Error updating process:", error);
      res.status(500).json({ message: "Failed to update process" });
    }
  });

  app.delete('/api/processes/:id', isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteProcess(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting process:", error);
      res.status(500).json({ message: "Failed to delete process" });
    }
  });

  // Process item routes
  app.get('/api/processes/:processId/items', isAuthenticated, async (req, res) => {
    try {
      const { processId } = req.params;
      const items = await storage.getProcessItems(processId);
      res.json(items);
    } catch (error) {
      console.error("Error fetching process items:", error);
      res.status(500).json({ message: "Failed to fetch process items" });
    }
  });

  app.post('/api/processes/:processId/items', isAuthenticated, async (req, res) => {
    try {
      const { processId } = req.params;
      const validatedData = insertProcessItemSchema.parse({
        ...req.body,
        processId
      });
      const item = await storage.createProcessItem(validatedData);
      res.status(201).json(item);
    } catch (error) {
      console.error("Error creating process item:", error);
      res.status(500).json({ message: "Failed to create process item" });
    }
  });

  app.put('/api/processes/:processId/items/:id', isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = insertProcessItemSchema.partial().parse(req.body);
      const item = await storage.updateProcessItem(id, validatedData);
      res.json(item);
    } catch (error) {
      console.error("Error updating process item:", error);
      res.status(500).json({ message: "Failed to update process item" });
    }
  });

  app.delete('/api/processes/:processId/items/:id', isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteProcessItem(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting process item:", error);
      res.status(500).json({ message: "Failed to delete process item" });
    }
  });

  // Commitment routes
  app.get('/api/commitments', isAuthenticated, async (req, res) => {
    try {
      const processId = req.query.processId as string;
      const commitments = await storage.getCommitments(processId);
      res.json(commitments);
    } catch (error) {
      console.error("Error fetching commitments:", error);
      res.status(500).json({ message: "Failed to fetch commitments" });
    }
  });

  app.post('/api/commitments', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = insertCommitmentSchema.parse({
        ...req.body,
        createdBy: userId
      });
      const commitment = await storage.createCommitment(validatedData);
      res.status(201).json(commitment);
    } catch (error) {
      console.error("Error creating commitment:", error);
      res.status(500).json({ message: "Failed to create commitment" });
    }
  });

  app.post('/api/commitments/:commitmentId/items', isAuthenticated, async (req, res) => {
    try {
      const { commitmentId } = req.params;
      const validatedData = insertCommitmentItemSchema.parse({
        ...req.body,
        commitmentId
      });
      
      const item = await storage.createCommitmentItem(validatedData);
      
      // Update process item committed quantity
      const processItem = await storage.getProcessItem(validatedData.processItemId);
      if (processItem) {
        await storage.updateProcessItem(validatedData.processItemId, {
          committedQuantity: (processItem.committedQuantity || 0) + validatedData.quantity
        });
      }
      
      res.status(201).json(item);
    } catch (error) {
      console.error("Error creating commitment item:", error);
      res.status(500).json({ message: "Failed to create commitment item" });
    }
  });

  // History and similarity routes
  app.get('/api/history/similar', isAuthenticated, async (req, res) => {
    try {
      const query = req.query.q as string;
      if (!query) {
        return res.status(400).json({ message: "Query parameter 'q' is required" });
      }
      
      const similarItems = await findSimilarItems(query);
      res.json(similarItems);
    } catch (error) {
      console.error("Error finding similar items:", error);
      res.status(500).json({ message: "Failed to find similar items" });
    }
  });

  // File import routes
  app.post('/api/import', isAuthenticated, upload.single('file'), async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      
      const { type } = req.body; // samples, processes, catalog
      const userId = req.user.claims.sub;
      
      const parsedData = await parseExcelFile(req.file.buffer, type);
      
      let results = [];
      
      switch (type) {
        case 'samples':
          for (const item of parsedData) {
            const bidding = await storage.createSampleBidding({
              ...item,
              createdBy: userId
            });
            results.push(bidding);
          }
          break;
          
        case 'processes':
          for (const item of parsedData) {
            const process = await storage.createProcess({
              ...item,
              createdBy: userId
            });
            results.push(process);
          }
          break;
          
        case 'catalog':
          for (const item of parsedData) {
            const catalogItem = await storage.createCatalogItem(item);
            results.push(catalogItem);
          }
          break;
          
        default:
          return res.status(400).json({ message: "Invalid import type" });
      }
      
      res.json({
        message: `Successfully imported ${results.length} items`,
        data: results
      });
    } catch (error) {
      console.error("Error importing data:", error);
      res.status(500).json({ message: "Failed to import data" });
    }
  });

  // ML prediction routes
  app.get('/api/ml/prediction/:itemId', isAuthenticated, async (req, res) => {
    try {
      const { itemId } = req.params;
      const { type } = req.query; // 'sample' or 'process'
      
      let prediction;
      if (type === 'sample') {
        prediction = await storage.getMlPrediction(itemId);
      } else if (type === 'process') {
        prediction = await storage.getMlPrediction(undefined, itemId);
      }
      
      if (!prediction) {
        return res.status(404).json({ message: "Prediction not found" });
      }
      
      res.json(prediction);
    } catch (error) {
      console.error("Error fetching ML prediction:", error);
      res.status(500).json({ message: "Failed to fetch ML prediction" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
