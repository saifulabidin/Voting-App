exports.handler = async function(event, context) {
  try {
    const backendHealth = await fetch('https://voting-app-production-3a8c.up.railway.app/health', {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });

    const backendStatus = await backendHealth.json();

    return {
      statusCode: 200,
      body: JSON.stringify({
        status: 'healthy',
        frontend: {
          status: 'online',
          environment: process.env.NODE_ENV,
          timestamp: new Date().toISOString()
        },
        backend: backendStatus
      })
    };
  } catch (error) {
    return {
      statusCode: 200,
      body: JSON.stringify({
        status: 'degraded',
        frontend: {
          status: 'online',
          environment: process.env.NODE_ENV,
          timestamp: new Date().toISOString()
        },
        backend: {
          status: 'offline',
          error: error.message
        }
      })
    };
  }
};