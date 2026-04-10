function buildCampaignSyncPlan({ questionnaireId, existingCampaigns, defaultCampaign }) {
  const linkedCampaigns = existingCampaigns.filter(
    (campaign) => campaign.questionnaire_id === questionnaireId
  );

  return {
    campaignsToPreserve: linkedCampaigns.map((campaign) => campaign.id),
    shouldCreateDefaultCampaign: linkedCampaigns.length === 0,
    defaultCampaign,
  };
}

module.exports = {
  buildCampaignSyncPlan,
};
