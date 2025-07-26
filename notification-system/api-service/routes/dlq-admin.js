import express from 'express';
import { manualRetryMessage, getDLQStats, getDLQMessages } from '../common/dlq-service.js';

const router = express.Router();

// Get DLQ statistics
router.get('/stats', async (req, res) => {
  try {
    const stats = await getDLQStats();
    res.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching DLQ stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch DLQ statistics',
      message: error.message
    });
  }
});

// Get DLQ messages with pagination and filtering
router.get('/messages', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const status = req.query.status || null;

    // Validate parameters
    if (page < 1 || limit < 1 || limit > 100) {
      return res.status(400).json({
        success: false,
        error: 'Invalid pagination parameters',
        message: 'Page must be >= 1, limit must be between 1 and 100'
      });
    }

    if (status && !['FAILED', 'RETRYING', 'RESOLVED'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status filter',
        message: 'Status must be one of: FAILED, RETRYING, RESOLVED'
      });
    }

    const messages = await getDLQMessages(page, limit, status);
    
    res.json({
      success: true,
      data: messages,
      pagination: {
        page,
        limit,
        count: messages.length
      },
      filters: {
        status
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching DLQ messages:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch DLQ messages',
      message: error.message
    });
  }
});

// Manual retry of a specific message
router.post('/retry/:messageKey', async (req, res) => {
  try {
    const { messageKey } = req.params;
    
    if (!messageKey) {
      return res.status(400).json({
        success: false,
        error: 'Message key is required'
      });
    }

    const result = await manualRetryMessage(messageKey);
    
    res.json({
      success: true,
      message: `Message ${messageKey} has been queued for retry`,
      data: result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error retrying message:', error);
    
    if (error.message.includes('not found')) {
      res.status(404).json({
        success: false,
        error: 'Message not found',
        message: error.message
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to retry message',
        message: error.message
      });
    }
  }
});

// Bulk retry messages by status
router.post('/retry-bulk', async (req, res) => {
  try {
    const { status = 'FAILED', maxCount = 10 } = req.body;
    
    if (!['FAILED'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status for bulk retry',
        message: 'Only FAILED messages can be bulk retried'
      });
    }

    if (maxCount < 1 || maxCount > 100) {
      return res.status(400).json({
        success: false,
        error: 'Invalid maxCount',
        message: 'maxCount must be between 1 and 100'
      });
    }

    // Get messages to retry
    const messages = await getDLQMessages(1, maxCount, status);
    const results = [];
    let successCount = 0;
    let failureCount = 0;

    for (const message of messages) {
      try {
        await manualRetryMessage(message.message_key);
        results.push({
          messageKey: message.message_key,
          success: true
        });
        successCount++;
      } catch (error) {
        results.push({
          messageKey: message.message_key,
          success: false,
          error: error.message
        });
        failureCount++;
      }
    }

    res.json({
      success: true,
      message: `Bulk retry completed: ${successCount} succeeded, ${failureCount} failed`,
      data: {
        successCount,
        failureCount,
        results
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error during bulk retry:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to perform bulk retry',
      message: error.message
    });
  }
});

// Get DLQ health status
router.get('/health', async (req, res) => {
  try {
    const stats = await getDLQStats();
    const totalMessages = stats.reduce((sum, stat) => sum + parseInt(stat.count), 0);
    const failedMessages = stats.find(s => s.status === 'FAILED')?.count || 0;
    
    const health = {
      status: failedMessages > 100 ? 'warning' : failedMessages > 500 ? 'critical' : 'healthy',
      totalMessages,
      failedMessages,
      retryingMessages: stats.find(s => s.status === 'RETRYING')?.count || 0,
      resolvedMessages: stats.find(s => s.status === 'RESOLVED')?.count || 0,
      timestamp: new Date().toISOString()
    };

    const httpStatus = health.status === 'critical' ? 503 : 
                      health.status === 'warning' ? 206 : 200;

    res.status(httpStatus).json({
      success: true,
      data: health
    });
  } catch (error) {
    console.error('Error checking DLQ health:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check DLQ health',
      message: error.message
    });
  }
});

// DLQ dashboard endpoint (summary view)
router.get('/dashboard', async (req, res) => {
  try {
    const stats = await getDLQStats();
    const recentMessages = await getDLQMessages(1, 10, 'FAILED');
    
    const dashboard = {
      statistics: stats,
      recentFailures: recentMessages,
      summary: {
        totalFailed: stats.find(s => s.status === 'FAILED')?.count || 0,
        totalRetrying: stats.find(s => s.status === 'RETRYING')?.count || 0,
        totalResolved: stats.find(s => s.status === 'RESOLVED')?.count || 0,
        oldestFailure: stats.length > 0 ? 
          Math.min(...stats.map(s => new Date(s.oldest_failure).getTime())) : null,
        newestFailure: stats.length > 0 ? 
          Math.max(...stats.map(s => new Date(s.newest_failure).getTime())) : null
      },
      timestamp: new Date().toISOString()
    };

    res.json({
      success: true,
      data: dashboard
    });
  } catch (error) {
    console.error('Error generating DLQ dashboard:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate DLQ dashboard',
      message: error.message
    });
  }
});

export default router; 