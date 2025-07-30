import { ReportData } from '@/types/reports';

export class JSONFormatter {
  static formatToJSON(data: ReportData): string {
    return JSON.stringify(data, null, 2);
  }
}