import { assertCampaignScope, assertInternalReportAccess } from "@/lib/auth/authorization";
import type { PortalSession } from "@/lib/auth/session";
import type { AnalyticalReportData, IndividualReportData } from "@/lib/domain/reports/types";
import { getCampaign } from "@/lib/server/repositories/campaigns-repository";
import { REPORT_TEMPLATE_VERSION, renderAnalyticalReportHtml, renderIndividualReportHtml } from "@/lib/server/pdf/report-templates";
import { createSignedReportUrl, uploadReportArtifact } from "@/lib/server/pdf/report-storage";
import {
  buildAnalyticalReportSnapshot,
  buildIndividualReportSnapshot,
  createPendingGeneratedReportRecord,
  getGeneratedReportById,
  getPublicReceiptData,
  markGeneratedReportDone,
  markGeneratedReportFailed
} from "@/lib/server/repositories/reports-repository";

function buildStoragePath(reportType: "individual" | "campaign_analytical", campaignId: string, reportId: string) {
  const stamp = new Date().toISOString().replaceAll(":", "-");
  return reportType === "individual"
    ? `campaigns/${campaignId}/individual/${reportId}/${REPORT_TEMPLATE_VERSION}-${stamp}.html`
    : `campaigns/${campaignId}/analytical/${reportId}/${REPORT_TEMPLATE_VERSION}-${stamp}.html`;
}

function getSafeErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message.slice(0, 500);
  }

  return "REPORT_GENERATION_FAILED";
}

function renderReportFromSnapshot(report: {
  report_type: "individual" | "campaign_analytical";
  payload_json: IndividualReportData | AnalyticalReportData;
}) {
  return report.report_type === "individual"
    ? renderIndividualReportHtml(report.payload_json as IndividualReportData)
    : renderAnalyticalReportHtml(report.payload_json as AnalyticalReportData);
}

export async function enqueueIndividualReport(submissionId: string) {
  const snapshot = await buildIndividualReportSnapshot(submissionId);
  if (!snapshot) {
    throw new Error("SUBMISSION_NOT_FOUND");
  }

  return createPendingGeneratedReportRecord({
    campaignId: snapshot.data.campaign.id,
    submissionId,
    reportType: "individual",
    templateVersion: REPORT_TEMPLATE_VERSION,
    sourceAnalysisId: snapshot.analysisId,
    payloadJson: snapshot.data
  });
}

export async function processGeneratedReport(reportId: string) {
  const report = await getGeneratedReportById(reportId);
  if (!report) {
    throw new Error("REPORT_NOT_FOUND");
  }

  if (report.status === "done" && report.storage_path) {
    return report;
  }

  try {
    const html = renderReportFromSnapshot(report);
    const campaignId = report.campaign_id ?? (report.payload_json as IndividualReportData | AnalyticalReportData).campaign.id;
    const storagePath = buildStoragePath(report.report_type, campaignId, report.id);

    await uploadReportArtifact(storagePath, html);
    return await markGeneratedReportDone(report.id, storagePath);
  } catch (error) {
    return await markGeneratedReportFailed(report.id, getSafeErrorMessage(error));
  }
}

export async function generateAnalyticalReport(campaignId: string) {
  const snapshot = await buildAnalyticalReportSnapshot(campaignId);
  if (!snapshot) {
    throw new Error("CAMPAIGN_NOT_FOUND");
  }

  const pending = await createPendingGeneratedReportRecord({
    campaignId,
    submissionId: null,
    reportType: "campaign_analytical",
    templateVersion: REPORT_TEMPLATE_VERSION,
    sourceAnalysisId: snapshot.analysisId,
    payloadJson: snapshot.data
  });

  return processGeneratedReport(pending.id);
}

export async function getInternalReportLink(reportId: string, actor: PortalSession) {
  const report = await getGeneratedReportById(reportId);
  if (!report) {
    throw new Error("REPORT_NOT_FOUND");
  }

  assertInternalReportAccess(actor, report);

  if (report.campaign_id) {
    const campaign = await getCampaign(report.campaign_id);
    assertCampaignScope(actor, campaign);
  }

  const finalReport = await processGeneratedReport(reportId);

  if (finalReport.status !== "done" || !finalReport.storage_path) {
    throw new Error(finalReport.error_message ?? "REPORT_NOT_READY");
  }

  const signedUrl = await createSignedReportUrl(finalReport.storage_path);

  return {
    report: finalReport,
    signedUrl
  };
}

export async function getPublicReceipt(receiptCode: string) {
  return getPublicReceiptData(receiptCode);
}
