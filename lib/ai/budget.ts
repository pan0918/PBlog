import { siteConfig } from '../../siteConfig';
import { startOfSiteMonth } from '../datetime';
import type { db } from '../db';
import { getAiUsageByFeature, sumAiUsage, type AiUsageTotals } from '../db/ai-usage';

// Features used only by the logged-in admin are logged under this prefix and
// do not count toward the visitor budget.
const ADMIN_FEATURE_PREFIX = 'admin-';

export function isAdminFeature(feature: string) {
  return feature.startsWith(ADMIN_FEATURE_PREFIX);
}

export interface MonthlyAiUsage {
  visitor: AiUsageTotals;
  admin: AiUsageTotals;
  budgetUsd: number;
  /** Visitor features should stop calling the API until next month. */
  exhausted: boolean;
}

/** AI usage and estimated spend for the current month (Beijing time). */
export async function getMonthlyAiUsage(
  now: Date = new Date(),
  client?: Pick<typeof db, 'execute'>,
): Promise<MonthlyAiUsage> {
  const rows = await getAiUsageByFeature(startOfSiteMonth(now), client);
  const visitor = sumAiUsage(rows.filter((row) => !isAdminFeature(row.feature)));
  const admin = sumAiUsage(rows.filter((row) => isAdminFeature(row.feature)));
  const budgetUsd = siteConfig.aiConfig.monthlyBudgetUsd;
  return { visitor, admin, budgetUsd, exhausted: visitor.costUsd >= budgetUsd };
}
