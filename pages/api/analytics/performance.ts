import { NextApiRequest, NextApiResponse } from 'next'

// Performance analytics endpoint
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }
  
  try {
    const performanceData = req.body
    
    // Validate the performance data
    if (!performanceData.name || typeof performanceData.value !== 'number') {
      return res.status(400).json({ error: 'Invalid performance data' })
    }
    
    // In production, you would store this in your analytics database
    // For now, we'll log it and optionally send to external services
    
    console.log('📊 Performance Metric Received:', {
      name: performanceData.name,
      value: performanceData.value,
      rating: performanceData.rating,
      url: performanceData.url,
      timestamp: new Date(performanceData.timestamp).toISOString(),
    })
    
    // Send to external analytics services (optional)
    await Promise.allSettled([
      sendToGoogleAnalytics(performanceData),
      sendToCustomAnalytics(performanceData),
    ])
    
    res.status(200).json({ success: true })
  } catch (error) {
    console.error('Error processing performance data:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

// Send to Google Analytics 4
async function sendToGoogleAnalytics(data: any) {
  if (!process.env.GA4_MEASUREMENT_ID || !process.env.GA4_API_SECRET) {
    return
  }
  
  try {
    const response = await fetch(`https://www.google-analytics.com/mp/collect?measurement_id=${process.env.GA4_MEASUREMENT_ID}&api_secret=${process.env.GA4_API_SECRET}`, {
      method: 'POST',
      body: JSON.stringify({
        client_id: data.id,
        events: [{
          name: 'web_vitals',
          params: {
            metric_name: data.name,
            metric_value: data.value,
            metric_rating: data.rating,
            page_location: data.url,
          }
        }]
      })
    })
    
    if (!response.ok) {
      throw new Error(`GA4 API error: ${response.status}`)
    }
  } catch (error) {
    console.error('Failed to send to Google Analytics:', error)
  }
}

// Send to custom analytics service
async function sendToCustomAnalytics(data: any) {
  // Implement your custom analytics logic here
  // This could be sending to your own database, third-party service, etc.
  
  try {
    // Example: Store in database
    // await db.collection('performance_metrics').add(data)
    
    // Example: Send to monitoring service like DataDog, New Relic, etc.
    // await monitoringService.track('web_vitals', data)
    
  } catch (error) {
    console.error('Failed to send to custom analytics:', error)
  }
}