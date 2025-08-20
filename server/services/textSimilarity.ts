import { storage } from "../storage";
import { CatalogItem, SampleItem } from "@shared/schema";

interface SimilarItem {
  item: CatalogItem;
  similarity: number;
  sampleHistory?: {
    biddingNumber: string;
    agency: string;
    result: string;
    date: Date;
  }[];
}

// Simple TF-IDF implementation for text similarity
export async function findSimilarItems(query: string, limit: number = 10): Promise<SimilarItem[]> {
  try {
    const catalogItems = await storage.getCatalogItems();
    const similarities: Array<{ item: CatalogItem; similarity: number }> = [];
    
    // Tokenize and normalize query
    const queryTokens = tokenize(query.toLowerCase());
    const queryVector = createTfIdfVector(queryTokens, [queryTokens]);
    
    // Calculate similarity for each catalog item
    for (const item of catalogItems) {
      const itemText = `${item.code} ${item.description} ${item.brand || ''}`;
      const itemTokens = tokenize(itemText.toLowerCase());
      const itemVector = createTfIdfVector(itemTokens, [itemTokens]);
      
      const similarity = cosineSimilarity(queryVector, itemVector);
      
      if (similarity > 0.1) { // Only include items with some similarity
        similarities.push({ item, similarity });
      }
    }
    
    // Sort by similarity and take top results
    similarities.sort((a, b) => b.similarity - a.similarity);
    const topSimilar = similarities.slice(0, limit);
    
    // Fetch sample history for each similar item
    const results: SimilarItem[] = [];
    
    for (const { item, similarity } of topSimilar) {
      // Get sample history for this item (simplified query)
      const sampleHistory: any[] = []; // In real implementation, would query sample_items
      
      results.push({
        item,
        similarity: Math.round(similarity * 100) / 100, // Round to 2 decimal places
        sampleHistory
      });
    }
    
    return results;
  } catch (error) {
    console.error('Error finding similar items:', error);
    return [];
  }
}

function tokenize(text: string): string[] {
  // Simple tokenization - split by spaces and punctuation
  return text
    .toLowerCase()
    .replace(/[^\w\sÀ-ÿ]/g, ' ') // Remove punctuation but keep accented chars
    .split(/\s+/)
    .filter(token => token.length > 2) // Remove very short tokens
    .filter(token => !isStopWord(token));
}

function isStopWord(word: string): boolean {
  const stopWords = new Set([
    'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from',
    'has', 'he', 'in', 'is', 'it', 'its', 'of', 'on', 'that', 'the',
    'to', 'was', 'will', 'with', 'para', 'com', 'por', 'em', 'de',
    'da', 'do', 'das', 'dos', 'na', 'no', 'nas', 'nos', 'um', 'uma',
    'uns', 'umas', 'ou', 'mas', 'que', 'como', 'ser', 'ter', 'estar'
  ]);
  return stopWords.has(word.toLowerCase());
}

function createTfIdfVector(tokens: string[], allDocuments: string[][]): Map<string, number> {
  const vector = new Map<string, number>();
  const tokenCounts = new Map<string, number>();
  
  // Calculate term frequency (TF)
  for (const token of tokens) {
    tokenCounts.set(token, (tokenCounts.get(token) || 0) + 1);
  }
  
  // Calculate TF-IDF
  for (const [token, count] of tokenCounts) {
    const tf = count / tokens.length;
    const documentsWithTerm = allDocuments.filter(doc => doc.includes(token)).length;
    const idf = Math.log(allDocuments.length / (documentsWithTerm + 1));
    vector.set(token, tf * idf);
  }
  
  return vector;
}

function cosineSimilarity(vectorA: Map<string, number>, vectorB: Map<string, number>): number {
  const allTokens = new Set([...vectorA.keys(), ...vectorB.keys()]);
  
  let dotProduct = 0;
  let magnitudeA = 0;
  let magnitudeB = 0;
  
  for (const token of allTokens) {
    const valueA = vectorA.get(token) || 0;
    const valueB = vectorB.get(token) || 0;
    
    dotProduct += valueA * valueB;
    magnitudeA += valueA * valueA;
    magnitudeB += valueB * valueB;
  }
  
  const magnitude = Math.sqrt(magnitudeA) * Math.sqrt(magnitudeB);
  return magnitude === 0 ? 0 : dotProduct / magnitude;
}

// Create similarity relationships in the database
export async function createSimilarityRelationships(
  itemId: string,
  similarItems: CatalogItem[],
  threshold: number = 0.7
): Promise<void> {
  try {
    const item = await storage.getCatalogItem(itemId);
    if (!item) return;
    
    for (const similarItem of similarItems) {
      if (similarItem.id === itemId) continue;
      
      const similarity = await calculateItemSimilarity(item, similarItem);
      
      if (similarity >= threshold) {
        await storage.createHistoryRelationship({
          itemId: itemId,
          relatedItemId: similarItem.id,
          similarityScore: similarity
        });
      }
    }
  } catch (error) {
    console.error('Error creating similarity relationships:', error);
  }
}

async function calculateItemSimilarity(itemA: CatalogItem, itemB: CatalogItem): Promise<number> {
  const textA = `${itemA.code} ${itemA.description} ${itemA.brand || ''}`;
  const textB = `${itemB.code} ${itemB.description} ${itemB.brand || ''}`;
  
  const tokensA = tokenize(textA.toLowerCase());
  const tokensB = tokenize(textB.toLowerCase());
  
  const vectorA = createTfIdfVector(tokensA, [tokensA, tokensB]);
  const vectorB = createTfIdfVector(tokensB, [tokensA, tokensB]);
  
  return cosineSimilarity(vectorA, vectorB);
}

// Search for items with fuzzy matching
export async function fuzzySearchItems(query: string, threshold: number = 0.3): Promise<CatalogItem[]> {
  try {
    const catalogItems = await storage.getCatalogItems();
    const matches: Array<{ item: CatalogItem; score: number }> = [];
    
    const queryTokens = tokenize(query.toLowerCase());
    
    for (const item of catalogItems) {
      const itemText = `${item.code} ${item.description} ${item.brand || ''}`;
      const itemTokens = tokenize(itemText.toLowerCase());
      
      const similarity = calculateJaccardSimilarity(queryTokens, itemTokens);
      
      if (similarity >= threshold) {
        matches.push({ item, score: similarity });
      }
    }
    
    return matches
      .sort((a, b) => b.score - a.score)
      .slice(0, 20)
      .map(match => match.item);
  } catch (error) {
    console.error('Error in fuzzy search:', error);
    return [];
  }
}

function calculateJaccardSimilarity(setA: string[], setB: string[]): number {
  const intersection = setA.filter(token => setB.includes(token));
  const union = [...new Set([...setA, ...setB])];
  
  return union.length === 0 ? 0 : intersection.length / union.length;
}
