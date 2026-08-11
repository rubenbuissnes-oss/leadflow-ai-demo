# LeadFlow backend

The repository now contains the first real backend component for LeadFlow.

## API

`POST /api/lead`

Request body:

```json
{
  "intent": "Buyer",
  "timeline": "tomorrow",
  "budget": "$850k",
  "details": "3 bedrooms near the beach"
}
```

The endpoint returns a normalized lead, deal value, score, and HOT/WARM/COLD temperature.

## Deployment

`api/lead.js` is Vercel-compatible. GitHub Pages can continue serving the existing demo frontend, while the API can be deployed separately. No API key is stored in the repository.

## Next production step

Deploy this API and set the frontend API base URL to the deployed endpoint. After that, add persistent lead storage, then connect an AI conversation layer and calendar integration.
