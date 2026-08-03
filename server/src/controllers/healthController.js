import mongoose from 'mongoose';

export const getHealthStatus = (req, res) => {
  const dbStateMap = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };

  const dbState = dbStateMap[mongoose.connection.readyState] || 'unknown';

  return res.status(200).json({
    status: 'ok',
    message: 'Dairy Milk Collection API is healthy and operational',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    database: {
      status: dbState,
    },
    version: '1.0.0',
  });
};
