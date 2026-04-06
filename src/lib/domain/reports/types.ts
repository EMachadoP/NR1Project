export type ReportType = "individual" | "campaign_analytical";
export type ReportTemplateVersion = "v1";
export type GeneratedReportStatus = "pending" | "done" | "failed";

export type GeneratedReportSnapshot = {
  reportType: ReportType;
  templateVersion: ReportTemplateVersion;
  generatedAt: string | null;
  analysisReferenceId: string | null;
  storagePath: string | null;
  status: GeneratedReportStatus;
  errorMessage: string | null;
};

export type IndividualReportData = {
  campaign: {
    id: string;
    name: string;
    sector: string | null;
    unit: string | null;
    language: string;
  };
  questionnaire: {
    id: string;
    name: string;
    version: string;
  };
  submission: {
    id: string;
    receiptCode: string;
    submittedAt: string;
    receiptExpiresAt: string;
    observationText: string | null;
  };
  sections: Array<{
    id: string;
    name: string;
    average: number;
    label: string;
    items: Array<{
      questionId: string;
      prompt: string;
      answerRaw: number;
      riskValue: number;
      isCritical: boolean;
    }>;
  }>;
};

export type AnalyticalReportData = {
  campaign: {
    id: string;
    name: string;
    sector: string | null;
    unit: string | null;
    language: string;
  };
  generatedAt: string;
  summary: {
    responseCount: number;
    criticalItemsCount: number;
    sectionCount: number;
  };
  sectionTable: Array<{
    sectionId: string;
    average: number;
    label: string;
    responseCount: number;
    criticalItemCount: number;
  }>;
  criticalItems: Array<{
    questionId: string;
    sectionId: string;
    riskValue: number;
  }>;
  recommendations: string[];
  actionPlan: Array<{
    id: string;
    riskIdentified: string;
    sectionName: string | null;
    measure: string;
    ownerName: string | null;
    dueDate: string | null;
    status: string;
  }>;
  scale: Array<{
    range: string;
    label: string;
  }>;
};

export type PublicReceiptData = {
  receiptCode: string;
  submittedAt: string;
  receiptExpiresAt: string;
  campaignName: string;
  questionnaireName: string;
  reportStatus: GeneratedReportStatus | null;
};
