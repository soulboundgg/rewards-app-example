export async function checkCampaignCompletion(id: string | undefined) {
  try {
    const apiUrl = process.env.API_URL;
    const [campaignData, campaignCompletionData] = await Promise.all([
      fetch(`${apiUrl}/api/campaigns/${id}`).then((response) =>
        response.json(),
      ),
      fetch(`${apiUrl}/api/campaigns/${id}/completions`).then((response) =>
        response.json(),
      ),
    ]);

    return (
      campaignData.campaign_objectives.length ===
      campaignCompletionData.data.length
    );
  } catch (error) {
    return false;
  }
}

export async function corepackClaim(address: string | undefined) {
  const corepackUrl = process.env.COREPACK_URL;
  const headers = new Headers();
  headers.append('Content-Type', 'application/json');
  headers.append('Accept', 'application/json');
  headers.append(
    'Authorization',
    'Bearer MDYwNmMyZWUtNGM1Ni00MWMxLTlhYjctMmE3ZTAzNDE1Zjg0',
  );

  const requestOptions: RequestInit = {
    method: 'POST',
    headers,
    body: JSON.stringify({
      artifact_id: process.env.ARTIFACT_ID,
      recipient_address: address,
      amount: 1,
    }),
  };
  try {
    // @ts-ignore
    const response = await fetch(corepackUrl, requestOptions);
    const result = await response.json();
    return result;
  } catch (error) {
    console.error('error', error);
    return false;
  }
}
