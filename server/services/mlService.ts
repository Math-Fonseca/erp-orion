import { SampleItem, ProcessItem } from "@shared/schema";

interface MLPrediction {
  score: number; // 0.0 to 1.0
  viable: boolean;
  modelVersion: string;
  features: Record<string, any>;
}

// Simple rule-based ML service
// In a real implementation, this would use scikit-learn or similar
export async function generateMlPrediction(
  item: SampleItem | ProcessItem
): Promise<Omit<MLPrediction, 'sampleItemId' | 'processItemId'>> {
  try {
    const features = extractFeatures(item);
    const score = calculateViabilityScore(features);
    const viable = score >= 0.6; // 60% threshold

    return {
      score: Math.round(score * 10000) / 10000, // Round to 4 decimal places
      viable,
      modelVersion: "1.0",
      features
    };
  } catch (error) {
    console.error('Error generating ML prediction:', error);
    // Return default prediction
    return {
      score: 0.5,
      viable: false,
      modelVersion: "1.0",
      features: {}
    };
  }
}

function extractFeatures(item: SampleItem | ProcessItem): Record<string, any> {
  const features: Record<string, any> = {};
  
  // Basic features
  features.hasQuantity = !!item.quantity;
  features.quantity = item.quantity || 0;
  features.hasDescription = !!(item.description || item.code);
  features.hasBrand = !!item.brand;
  
  // Process-specific features
  if ('awardedQuantity' in item) {
    features.awardedQuantity = item.awardedQuantity || 0;
    features.unitPrice = parseFloat(String(item.unitPrice || 0));
    features.totalValue = parseFloat(String(item.totalValue || 0));
    features.hasValidPricing = features.unitPrice > 0 && features.totalValue > 0;
  }
  
  // Sample-specific features
  if ('batch' in item) {
    features.hasBatch = !!item.batch;
    features.hasResult = !!item.result;
  }
  
  // Text analysis features
  const description = item.description || '';
  features.descriptionLength = description.length;
  features.hasNumbers = /\d/.test(description);
  features.hasUnits = /\b(mg|ml|kg|g|cm|mm|unid|und|pc|pç)\b/i.test(description);
  features.hasMedicalTerms = /\b(medicamento|remedio|droga|farmaco|tratamento)\b/i.test(description);
  features.hasTechnicalTerms = /\b(equipamento|aparelho|instrumento|dispositivo)\b/i.test(description);
  
  return features;
}

function calculateViabilityScore(features: Record<string, any>): number {
  let score = 0.0;
  let maxScore = 0.0;
  
  // Base score for having essential information
  if (features.hasQuantity) {
    score += 0.2;
  }
  maxScore += 0.2;
  
  if (features.hasDescription) {
    score += 0.2;
  }
  maxScore += 0.2;
  
  // Quality indicators
  if (features.hasBrand) {
    score += 0.1;
  }
  maxScore += 0.1;
  
  if (features.descriptionLength > 10) {
    score += 0.1;
  }
  maxScore += 0.1;
  
  // Quantity reasonableness
  if (features.quantity > 0 && features.quantity <= 10000) {
    score += 0.1;
  } else if (features.quantity > 10000) {
    score += 0.05; // Large quantities are less viable
  }
  maxScore += 0.1;
  
  // Technical completeness
  if (features.hasUnits) {
    score += 0.1;
  }
  maxScore += 0.1;
  
  // Domain-specific bonuses
  if (features.hasMedicalTerms || features.hasTechnicalTerms) {
    score += 0.05;
  }
  maxScore += 0.05;
  
  // Pricing viability (for process items)
  if (features.hasValidPricing) {
    score += 0.1;
    // Check if pricing is reasonable
    if (features.unitPrice > 0.01 && features.unitPrice < 100000) {
      score += 0.05;
    }
  }
  maxScore += 0.15;
  
  // Normalize score to 0-1 range
  return maxScore > 0 ? Math.min(score / maxScore, 1.0) : 0.5;
}

// Batch prediction for multiple items
export async function generateBatchPredictions(
  items: (SampleItem | ProcessItem)[]
): Promise<MLPrediction[]> {
  const predictions = await Promise.all(
    items.map(item => generateMlPrediction(item))
  );
  
  return predictions.map((pred, index) => ({
    ...pred,
    sampleItemId: 'quantity' in items[index] && !('awardedQuantity' in items[index]) ? items[index].id : undefined,
    processItemId: 'awardedQuantity' in items[index] ? items[index].id : undefined,
  }));
}

// Retrain model with new feedback (placeholder)
export async function retrainModel(
  feedbackData: Array<{
    itemId: string;
    actualResult: 'aprovado' | 'reprovado';
    features: Record<string, any>;
  }>
): Promise<void> {
  console.log('Retraining model with', feedbackData.length, 'feedback samples');
  // In a real implementation, this would update the ML model
  // using the actual results to improve predictions
}
