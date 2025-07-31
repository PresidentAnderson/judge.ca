# HR.PVTHostel.com Plugin Development Guide
**Building Third-Party Applications and Integrations**

## 🚀 Overview

The HR.PVTHostel.com Plugin System enables developers to create powerful third-party applications, integrations, and custom features that extend the core platform functionality. This comprehensive guide covers everything you need to build, deploy, and distribute plugins for the HR portal ecosystem.

## 🏗 Plugin Architecture

### Core Concepts

#### 1. Plugin Manifest
Every plugin requires a `manifest.json` file that defines its capabilities, permissions, and integration points:

```json
{
  "name": "Slack Integration",
  "slug": "slack-integration",
  "version": "1.0.0",
  "description": "Real-time notifications and candidate updates in Slack",
  "author": "HR.PVTHostel.com",
  "author_email": "plugins@pvthostel.com",
  "category": "communication",
  "permissions": [
    "read:applications",
    "write:notifications",
    "read:jobs"
  ],
  "hooks": [
    {
      "name": "application_submitted",
      "type": "url",
      "endpoint": "https://your-app.com/webhooks/application-submitted",
      "priority": 10
    }
  ],
  "api_endpoints": [
    {
      "method": "POST",
      "path": "/api/plugins/slack/configure",
      "handler": "configure_slack_integration"
    }
  ],
  "config_schema": {
    "type": "object",
    "properties": {
      "slack_webhook_url": {
        "type": "string",
        "title": "Slack Webhook URL",
        "description": "Your Slack incoming webhook URL"
      },
      "notification_channel": {
        "type": "string",
        "title": "Default Channel",
        "description": "Default Slack channel for notifications"
      }
    },
    "required": ["slack_webhook_url"]
  }
}
```

#### 2. Plugin Types

**Communication Plugins**
- Slack, Microsoft Teams, Discord integrations
- Email automation and templates
- SMS and mobile notifications

**Assessment Plugins**
- Technical skill assessments (HackerRank, Codility)
- Personality and culture fit tests
- Video interview platforms (Zoom, WebEx)

**Background Check Plugins**
- Identity verification services
- Criminal background checks
- Employment history verification

**Analytics Plugins**
- Advanced reporting dashboards
- Predictive hiring analytics
- Custom KPI tracking

**Integration Plugins**
- ATS system integrations
- CRM and sales tool connections
- Learning management systems

## 🔧 Development Environment Setup

### Prerequisites

```bash
# Required tools
Node.js 18+
Python 3.9+
PostgreSQL 14+
Redis 6+

# Development tools
git
docker
docker-compose
```

### Local Development Setup

```bash
# Clone the plugin development kit
git clone https://github.com/hr-pvthostel/plugin-development-kit
cd plugin-development-kit

# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env with your development credentials

# Start development server
npm run dev
```

### Plugin Development Kit Structure

```
plugin-development-kit/
├── templates/           # Plugin templates
│   ├── basic-integration/
│   ├── webhook-handler/
│   ├── dashboard-widget/
│   └── api-extension/
├── sdk/                # Development SDK
│   ├── client.js       # API client
│   ├── hooks.js        # Hook system
│   ├── auth.js         # Authentication helpers
│   └── utils.js        # Utility functions
├── examples/           # Example plugins
├── docs/              # Development documentation
└── tools/             # Development tools
```

## 🔐 Authentication & Security

### API Authentication

All plugin API calls require proper authentication using JWT tokens:

```javascript
const { HRPortalClient } = require('@hr-pvthostel/plugin-sdk');

const client = new HRPortalClient({
  apiUrl: 'https://api.hr.pvthostel.com',
  tenantId: 'your-tenant-id',
  apiKey: 'your-api-key'
});

// Example API call
const jobs = await client.jobs.list({
  status: 'published',
  limit: 10
});
```

### Permission System

Plugins must declare required permissions in their manifest:

```json
{
  "permissions": [
    "read:jobs",          // Read job listings
    "write:jobs",         // Create/update jobs
    "read:applications",  // Read applications
    "write:applications", // Update application status
    "read:users",         // Read user profiles
    "write:users",        // Update user data
    "read:analytics",     // Access analytics data
    "write:analytics",    // Create custom metrics
    "admin:settings"      // Access tenant settings
  ]
}
```

### Webhook Security

Secure webhook endpoints using signature verification:

```javascript
const crypto = require('crypto');

function verifyWebhookSignature(payload, signature, secret) {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex');
    
  return crypto.timingSafeEqual(
    Buffer.from(signature, 'hex'),
    Buffer.from(expectedSignature, 'hex')
  );
}

// Express.js webhook handler
app.post('/webhook', (req, res) => {
  const signature = req.headers['x-plugin-signature'];
  const isValid = verifyWebhookSignature(req.body, signature, process.env.WEBHOOK_SECRET);
  
  if (!isValid) {
    return res.status(401).json({ error: 'Invalid signature' });
  }
  
  // Process webhook payload
  handleWebhookPayload(req.body);
  res.json({ success: true });
});
```

## 🪝 Hook System

### Available Hooks

The platform provides numerous hooks for extending functionality:

#### Job Management Hooks
```javascript
// Job created
{
  "name": "job_created",
  "payload": {
    "job": { /* job object */ },
    "tenant_id": "uuid",
    "created_by": "user_uuid"
  }
}

// Job published
{
  "name": "job_published", 
  "payload": {
    "job": { /* job object */ },
    "tenant_id": "uuid"
  }
}

// Job closed
{
  "name": "job_closed",
  "payload": {
    "job": { /* job object */ },
    "tenant_id": "uuid",
    "reason": "filled|expired|cancelled"
  }
}
```

#### Application Hooks
```javascript
// Application submitted
{
  "name": "application_submitted",
  "payload": {
    "application": { /* application object */ },
    "job": { /* job object */ },
    "candidate": { /* user object */ },
    "tenant_id": "uuid"
  }
}

// Application status changed
{
  "name": "application_status_changed",
  "payload": {
    "application": { /* application object */ },
    "previous_status": "pending",
    "new_status": "interviewing",
    "changed_by": "user_uuid",
    "tenant_id": "uuid"
  }
}

// Interview scheduled
{
  "name": "interview_scheduled",
  "payload": {
    "application": { /* application object */ },
    "interview": { /* interview object */ },
    "tenant_id": "uuid"
  }
}
```

#### User Hooks
```javascript
// User registered
{
  "name": "user_registered",
  "payload": {
    "user": { /* user object */ },
    "tenant_id": "uuid",
    "registration_type": "self|invited"
  }
}

// User profile updated
{
  "name": "user_profile_updated",
  "payload": {
    "user": { /* user object */ },
    "previous_data": { /* previous user data */ },
    "tenant_id": "uuid"
  }
}
```

### Hook Implementation

#### Webhook-based Hooks
```javascript
// Plugin manifest hook definition
{
  "hooks": [
    {
      "name": "application_submitted",
      "type": "url",
      "endpoint": "https://your-plugin.com/hooks/application-submitted",
      "priority": 10,
      "retry_policy": {
        "max_retries": 3,
        "backoff": "exponential"
      }
    }
  ]
}

// Webhook handler implementation
app.post('/hooks/application-submitted', async (req, res) => {
  try {
    const { application, job, candidate } = req.body;
    
    // Process the application submission
    await sendSlackNotification({
      channel: '#hiring',
      text: `New application received for ${job.title}`,
      attachments: [{
        title: `${candidate.first_name} ${candidate.last_name}`,
        fields: [
          { title: 'Position', value: job.title, short: true },
          { title: 'Match Score', value: `${application.match_score}%`, short: true }
        ]
      }]
    });
    
    res.json({ success: true });
  } catch (error) {
    console.error('Hook processing failed:', error);
    res.status(500).json({ error: error.message });
  }
});
```

#### Function-based Hooks (Internal Plugins)
```javascript
// For plugins running within the platform
const hooks = {
  application_submitted: async (payload) => {
    const { application, job, candidate } = payload;
    
    // Custom processing logic
    await processNewApplication(application);
    
    return {
      success: true,
      data: { processed: true }
    };
  }
};

module.exports = hooks;
```

## 🛠 API Integration

### REST API Client

The platform provides a comprehensive REST API for plugin integration:

```javascript
const { HRPortalClient } = require('@hr-pvthostel/plugin-sdk');

class MyPlugin {
  constructor(config) {
    this.client = new HRPortalClient({
      apiUrl: config.apiUrl,
      tenantId: config.tenantId,
      apiKey: config.apiKey
    });
  }

  async getActiveJobs() {
    return await this.client.jobs.list({
      status: 'published',
      is_active: true
    });
  }

  async createApplication(jobId, candidateData) {
    return await this.client.applications.create({
      job_id: jobId,
      candidate_data: candidateData,
      source: 'plugin:my-plugin'
    });
  }

  async updateApplicationStatus(applicationId, status, notes) {
    return await this.client.applications.update(applicationId, {
      status,
      notes,
      last_action_at: new Date()
    });
  }

  async getAnalytics(dateRange) {
    return await this.client.analytics.getHiringMetrics({
      start_date: dateRange.start,
      end_date: dateRange.end,
      metrics: ['applications', 'hires', 'time_to_hire']
    });
  }
}
```

### GraphQL API (Advanced)

For complex data requirements, use the GraphQL API:

```javascript
const { GraphQLClient } = require('graphql-request');

const graphqlClient = new GraphQLClient('https://api.hr.pvthostel.com/graphql', {
  headers: {
    authorization: `Bearer ${apiKey}`,
    'x-tenant-id': tenantId
  }
});

const query = `
  query GetJobsWithApplications($limit: Int!) {
    jobs(limit: $limit, status: PUBLISHED) {
      id
      title
      description
      applications(limit: 10) {
        id
        status
        match_score
        candidate {
          first_name
          last_name
          email
        }
      }
    }
  }
`;

const data = await graphqlClient.request(query, { limit: 20 });
```

## 🎨 UI Integration

### Dashboard Widgets

Create custom dashboard widgets for different user roles:

```javascript
// Widget configuration
const widgetConfig = {
  id: 'slack-notifications-widget',
  title: 'Slack Notifications',
  description: 'Configure Slack notification settings',
  component: 'SlackNotificationsWidget',
  roles: ['hr_manager', 'admin'],
  placement: 'dashboard.main',
  size: 'medium'
};

// React component (frontend)
import React, { useState, useEffect } from 'react';
import { Card, Switch, Select, Button } from '@mui/material';

const SlackNotificationsWidget = ({ tenantId, userId }) => {
  const [settings, setSettings] = useState({});
  const [channels, setChannels] = useState([]);

  useEffect(() => {
    loadSlackSettings();
    loadSlackChannels();
  }, []);

  const loadSlackSettings = async () => {
    const response = await fetch(`/api/plugins/slack/settings?tenant=${tenantId}`);
    const data = await response.json();
    setSettings(data);
  };

  const loadSlackChannels = async () => {
    const response = await fetch(`/api/plugins/slack/channels?tenant=${tenantId}`);
    const data = await response.json();
    setChannels(data);
  };

  const updateSettings = async (newSettings) => {
    await fetch(`/api/plugins/slack/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...settings, ...newSettings, tenant_id: tenantId })
    });
    setSettings({ ...settings, ...newSettings });
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6">Slack Notifications</Typography>
        
        <FormGroup>
          <FormControlLabel
            control={
              <Switch
                checked={settings.enabled || false}
                onChange={(e) => updateSettings({ enabled: e.target.checked })}
              />
            }
            label="Enable Slack notifications"
          />
        </FormGroup>

        {settings.enabled && (
          <>
            <Select
              value={settings.default_channel || ''}
              onChange={(e) => updateSettings({ default_channel: e.target.value })}
              displayEmpty
              fullWidth
            >
              <MenuItem value="">Select default channel</MenuItem>
              {channels.map(channel => (
                <MenuItem key={channel.id} value={channel.id}>
                  #{channel.name}
                </MenuItem>
              ))}
            </Select>

            <Button
              variant="contained"
              onClick={() => testSlackConnection()}
              sx={{ mt: 2 }}
            >
              Test Connection
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default SlackNotificationsWidget;
```

### Custom Pages

Add custom pages to the platform navigation:

```javascript
// Page registration
const pageConfig = {
  id: 'advanced-analytics',
  title: 'Advanced Analytics',
  path: '/analytics/advanced',
  component: 'AdvancedAnalyticsPage',
  roles: ['hr_manager', 'admin'],
  navigation: {
    parent: 'analytics',
    icon: 'BarChart',
    order: 10
  }
};

// React page component
import React from 'react';
import { Grid, Paper, Typography } from '@mui/material';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const AdvancedAnalyticsPage = () => {
  const [analyticsData, setAnalyticsData] = useState(null);

  useEffect(() => {
    loadAnalyticsData();
  }, []);

  const loadAnalyticsData = async () => {
    const response = await fetch('/api/plugins/advanced-analytics/data');
    const data = await response.json();
    setAnalyticsData(data);
  };

  const chartData = {
    labels: analyticsData?.labels || [],
    datasets: [{
      label: 'Hiring Success Rate',
      data: analyticsData?.success_rates || [],
      backgroundColor: 'rgba(54, 162, 235, 0.6)',
      borderColor: 'rgba(54, 162, 235, 1)',
      borderWidth: 1
    }]
  };

  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Typography variant="h4">Advanced Analytics</Typography>
      </Grid>
      
      <Grid item xs={12} md={8}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Hiring Success Rate by Department
          </Typography>
          {analyticsData && <Bar data={chartData} />}
        </Paper>
      </Grid>
      
      <Grid item xs={12} md={4}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Key Metrics
          </Typography>
          {/* Additional metrics */}
        </Paper>
      </Grid>
    </Grid>
  );
};

export default AdvancedAnalyticsPage;
```

## 📦 Plugin Examples

### 1. Slack Integration Plugin

Complete Slack integration for real-time notifications:

```javascript
// slack-integration/manifest.json
{
  "name": "Slack Integration",
  "slug": "slack-integration",
  "version": "1.2.0",
  "description": "Real-time hiring notifications and candidate updates in Slack",
  "author": "HR.PVTHostel.com",
  "category": "communication",
  "permissions": ["read:applications", "read:jobs", "read:users"],
  "hooks": [
    {
      "name": "application_submitted",
      "type": "url", 
      "endpoint": "/webhooks/application-submitted"
    },
    {
      "name": "interview_scheduled",
      "type": "url",
      "endpoint": "/webhooks/interview-scheduled"
    }
  ],
  "config_schema": {
    "type": "object",
    "properties": {
      "webhook_url": { "type": "string", "title": "Slack Webhook URL" },
      "channel": { "type": "string", "title": "Default Channel" },
      "notify_on": {
        "type": "array",
        "title": "Notification Events",
        "items": { "type": "string" },
        "default": ["application_submitted", "interview_scheduled"]
      }
    }
  }
}

// slack-integration/server.js
const express = require('express');
const axios = require('axios');

class SlackIntegration {
  constructor(config) {
    this.config = config;
    this.app = express();
    this.setupRoutes();
  }

  setupRoutes() {
    this.app.post('/webhooks/application-submitted', async (req, res) => {
      const { application, job, candidate } = req.body;
      
      await this.sendSlackMessage({
        channel: this.config.channel,
        text: `🎯 New application received!`,
        attachments: [{
          color: 'good',
          title: `${candidate.first_name} ${candidate.last_name}`,
          title_link: `${this.config.app_url}/applications/${application.id}`,
          fields: [
            { title: 'Position', value: job.title, short: true },
            { title: 'Match Score', value: `${application.match_score}%`, short: true },
            { title: 'Experience', value: `${candidate.experience_years} years`, short: true }
          ],
          footer: 'HR Portal',
          ts: Math.floor(Date.now() / 1000)
        }]
      });
      
      res.json({ success: true });
    });

    this.app.post('/webhooks/interview-scheduled', async (req, res) => {
      const { application, interview, candidate } = req.body;
      
      await this.sendSlackMessage({
        channel: this.config.channel,
        text: `📅 Interview scheduled`,
        attachments: [{
          color: 'warning',
          title: `Interview with ${candidate.first_name} ${candidate.last_name}`,
          fields: [
            { title: 'Date', value: interview.scheduled_at, short: true },
            { title: 'Type', value: interview.type, short: true },
            { title: 'Interviewer', value: interview.interviewer_name, short: true }
          ]
        }]
      });
      
      res.json({ success: true });
    });
  }

  async sendSlackMessage(message) {
    try {
      await axios.post(this.config.webhook_url, message);
    } catch (error) {
      console.error('Failed to send Slack message:', error);
    }
  }
}

module.exports = SlackIntegration;
```

### 2. Video Interview Plugin

Integration with video conferencing platforms:

```javascript
// video-interview/manifest.json
{
  "name": "Video Interview Integration",
  "slug": "video-interview",
  "version": "1.0.0",
  "description": "Schedule and conduct video interviews with Zoom integration",
  "permissions": ["read:applications", "write:applications", "read:users"],
  "api_endpoints": [
    {
      "method": "POST",
      "path": "/api/plugins/video-interview/schedule",
      "handler": "scheduleInterview"
    }
  ],
  "config_schema": {
    "type": "object",
    "properties": {
      "zoom_api_key": { "type": "string", "title": "Zoom API Key" },
      "zoom_api_secret": { "type": "string", "title": "Zoom API Secret" },
      "default_duration": { "type": "number", "title": "Default Duration (minutes)", "default": 30 }
    }
  }
}

// video-interview/handlers.js
const ZoomAPI = require('./zoom-api');

class VideoInterviewPlugin {
  constructor(config) {
    this.zoom = new ZoomAPI(config.zoom_api_key, config.zoom_api_secret);
  }

  async scheduleInterview(req, res) {
    try {
      const { application_id, interviewer_id, scheduled_at, duration } = req.body;
      
      // Create Zoom meeting
      const meeting = await this.zoom.createMeeting({
        topic: `Interview - Application ${application_id}`,
        start_time: scheduled_at,
        duration: duration || 30,
        settings: {
          waiting_room: true,
          join_before_host: false
        }
      });

      // Update application with interview details
      await this.updateApplication(application_id, {
        interview_scheduled: true,
        interview_details: {
          meeting_id: meeting.id,
          join_url: meeting.join_url,
          start_url: meeting.start_url,
          scheduled_at,
          interviewer_id
        }
      });

      res.json({
        success: true,
        meeting_details: {
          join_url: meeting.join_url,
          meeting_id: meeting.id
        }
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}
```

### 3. Background Check Plugin

Automated background verification:

```javascript
// background-check/manifest.json
{
  "name": "Background Check Integration",
  "slug": "background-check",
  "version": "1.0.0",
  "description": "Automated background checks and verification",
  "permissions": ["read:applications", "write:applications"],
  "hooks": [
    {
      "name": "application_status_changed",
      "type": "url",
      "endpoint": "/webhooks/status-changed",
      "conditions": {
        "new_status": "background_check"
      }
    }
  ],
  "config_schema": {
    "type": "object",
    "properties": {
      "provider": { 
        "type": "string", 
        "enum": ["checkr", "sterling", "accurate"],
        "title": "Background Check Provider"
      },
      "api_key": { "type": "string", "title": "Provider API Key" },
      "auto_order": { 
        "type": "boolean", 
        "title": "Automatically Order Checks",
        "default": false 
      }
    }
  }
}

// background-check/handlers.js
class BackgroundCheckPlugin {
  constructor(config) {
    this.provider = this.getProvider(config.provider, config.api_key);
    this.autoOrder = config.auto_order;
  }

  async handleStatusChanged(payload) {
    const { application, new_status } = payload;
    
    if (new_status === 'background_check' && this.autoOrder) {
      return await this.orderBackgroundCheck(application);
    }
  }

  async orderBackgroundCheck(application) {
    try {
      const candidate = await this.getCandidate(application.applicant_id);
      
      const checkOrder = await this.provider.createCheck({
        candidate: {
          first_name: candidate.first_name,
          last_name: candidate.last_name,
          email: candidate.email,
          dob: candidate.date_of_birth,
          ssn: candidate.ssn_last_four
        },
        package: 'standard',
        callback_url: `${this.config.webhook_url}/background-check-complete`
      });

      await this.updateApplication(application.id, {
        background_check_id: checkOrder.id,
        background_check_status: 'pending',
        background_check_ordered_at: new Date()
      });

      return { success: true, check_id: checkOrder.id };
    } catch (error) {
      console.error('Background check order failed:', error);
      throw error;
    }
  }
}
```

## 🚀 Deployment & Distribution

### Plugin Packaging

Package your plugin for distribution:

```bash
# Create plugin package
mkdir my-plugin-v1.0.0
cp -r src/ manifest.json package.json my-plugin-v1.0.0/

# Create tarball
tar -czf my-plugin-v1.0.0.tar.gz my-plugin-v1.0.0/

# Generate plugin hash
shasum -a 256 my-plugin-v1.0.0.tar.gz > my-plugin-v1.0.0.tar.gz.sha256
```

### Plugin Marketplace Submission

Submit your plugin to the official marketplace:

```javascript
// Submit via API
const submission = await fetch('https://api.hr.pvthostel.com/marketplace/submit', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${developerToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: 'My Awesome Plugin',
    description: 'A comprehensive solution for...',
    category: 'integration',
    version: '1.0.0',
    package_url: 'https://releases.my-company.com/plugin-v1.0.0.tar.gz',
    documentation_url: 'https://docs.my-company.com/hr-plugin',
    support_email: 'support@my-company.com',
    price: 29.99,
    billing_cycle: 'monthly'
  })
});
```

### Private Plugin Deployment

Deploy plugins privately within your organization:

```javascript
// Install via tenant admin panel
const installation = await hrPortal.plugins.install({
  tenant_id: 'your-tenant-id',
  package_url: 'https://internal.company.com/plugins/custom-plugin-v1.0.0.tar.gz',
  auto_activate: true,
  config: {
    api_endpoint: 'https://internal-api.company.com',
    api_key: 'internal-api-key'
  }
});
```

## 📊 Analytics & Monitoring

### Plugin Performance Monitoring

Track plugin performance and usage:

```javascript
// Built-in analytics
const analytics = await hrPortal.plugins.getAnalytics('plugin-id', {
  date_range: '30d',
  metrics: ['usage', 'performance', 'errors']
});

// Custom metrics
await hrPortal.plugins.trackMetric('plugin-id', {
  metric: 'interviews_scheduled',
  value: 5,
  timestamp: new Date(),
  metadata: {
    department: 'engineering',
    job_type: 'senior'
  }
});
```

### Error Handling & Logging

Implement comprehensive error handling:

```javascript
const logger = require('@hr-pvthostel/plugin-logger');

class MyPlugin {
  async processHook(payload) {
    try {
      // Plugin logic here
      await this.handlePayload(payload);
      
      logger.info('Hook processed successfully', {
        plugin: 'my-plugin',
        hook: payload.hook,
        tenant: payload.tenant_id
      });
    } catch (error) {
      logger.error('Hook processing failed', {
        plugin: 'my-plugin',
        hook: payload.hook,
        error: error.message,
        stack: error.stack,
        tenant: payload.tenant_id
      });
      
      // Report error to platform
      await this.reportError(error, payload);
      throw error;
    }
  }
}
```

## 🔧 Testing & Quality Assurance

### Unit Testing

```javascript
// test/plugin.test.js
const { expect } = require('chai');
const MyPlugin = require('../src/plugin');

describe('MyPlugin', () => {
  let plugin;
  
  beforeEach(() => {
    plugin = new MyPlugin({
      api_key: 'test-key',
      endpoint: 'https://test-api.com'
    });
  });

  it('should handle application_submitted hook', async () => {
    const payload = {
      application: { id: 'app-1', match_score: 85 },
      job: { title: 'Software Engineer' },
      candidate: { first_name: 'John', last_name: 'Doe' }
    };

    const result = await plugin.handleApplicationSubmitted(payload);
    expect(result.success).to.be.true;
  });

  it('should validate configuration', () => {
    expect(() => new MyPlugin({})).to.throw('API key is required');
  });
});
```

### Integration Testing

```javascript
// test/integration.test.js
const { HRPortalTestClient } = require('@hr-pvthostel/test-utils');

describe('Plugin Integration', () => {
  let testClient;
  
  before(async () => {
    testClient = new HRPortalTestClient();
    await testClient.setupTestTenant();
    await testClient.installPlugin('my-plugin');
  });

  it('should trigger hook when application is submitted', async () => {
    const job = await testClient.createJob({
      title: 'Test Position',
      status: 'published'
    });

    const application = await testClient.submitApplication({
      job_id: job.id,
      candidate_data: {
        first_name: 'Test',
        last_name: 'Candidate',
        email: 'test@example.com'
      }
    });

    // Verify hook was triggered
    const hooks = await testClient.getTriggeredHooks();
    expect(hooks).to.include('application_submitted');
  });
});
```

## 📚 Best Practices

### 1. Security Best Practices

- **Validate all inputs** and sanitize data
- **Use HTTPS** for all webhook endpoints
- **Implement signature verification** for webhooks
- **Store sensitive data encrypted**
- **Follow OWASP guidelines** for web applications

### 2. Performance Optimization

- **Implement caching** for frequently accessed data
- **Use connection pooling** for database connections
- **Optimize API calls** with batching and pagination
- **Implement rate limiting** to prevent abuse
- **Use asynchronous processing** for heavy operations

### 3. User Experience

- **Provide clear error messages** and recovery options
- **Implement proper loading states** and progress indicators
- **Follow platform UI/UX guidelines**
- **Ensure mobile responsiveness**
- **Test with real user scenarios**

### 4. Maintenance & Support

- **Implement comprehensive logging**
- **Provide detailed documentation**
- **Set up monitoring and alerting**
- **Plan for backwards compatibility**
- **Maintain version changelogs**

## 🤝 Community & Support

### Getting Help

- **Documentation**: https://docs.hr.pvthostel.com/plugins
- **Developer Forum**: https://community.hr.pvthostel.com/developers
- **Discord**: https://discord.gg/hr-pvthostel-dev
- **Email Support**: plugins-support@pvthostel.com

### Contributing

- **Plugin Templates**: Contribute reusable plugin templates
- **SDK Improvements**: Help enhance the development SDK
- **Documentation**: Improve guides and examples
- **Bug Reports**: Report issues and suggest improvements

### Plugin Marketplace

- **Discover Plugins**: Browse available plugins and integrations
- **Publish Plugins**: Submit your plugins for review and distribution
- **Reviews & Ratings**: Share feedback on plugins you've used
- **Revenue Sharing**: Earn revenue from premium plugins

---

**Start building amazing HR platform extensions today! The future of hiring technology is in your hands.**

*For the latest updates and advanced topics, visit our developer portal at https://developers.hr.pvthostel.com*