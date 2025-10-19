/**
 * Utility functions for the Business Card CRM application
 */

/**
 * Returns Tailwind classes for importance level badge styling
 */
export const getImportanceColor = (importance: number): string => {
  if (importance >= 4) return "bg-destructive/20 text-destructive";
  if (importance >= 3) return "bg-warning/20 text-warning";
  return "bg-muted text-muted-foreground";
};

/**
 * Returns Tailwind classes for priority badge styling
 */
export const getPriorityColor = (priority: string): string => {
  switch (priority) {
    case "high":
      return "bg-destructive/20 text-destructive";
    case "medium":
      return "bg-warning/20 text-warning";
    default:
      return "bg-muted text-muted-foreground";
  }
};
