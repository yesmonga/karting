import express from 'express';
import { fetchApexData, parseApexResponse } from './apex.js';

const router = express.Router();

// ... existing routes ...

// Add this test route
router.get('/test-connection', async (req, res) => {
    const circuitId = req.query.circuitId as string || 'lemans-karting'; // Default to a known circuit

    try {
        console.log(`Testing connection to Apex for circuit: ${circuitId}`);
        const timestamp = Date.now();

        // 1. Test HTTP connectivity to Apex Timing
        const response = await fetch(`https://www.apex-timing.com/live-timing/commonv2/functions/request.php`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
            },
            body: `chrono=${circuitId}&p=${timestamp}&s=0&t=init`
        });

        if (!response.ok) {
            throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
        }

        const text = await response.text();
        console.log('Apex response received');

        // 2. Parse response to see if we get valid JSON/Data
        // Apex returns XML-like or JSON wrapped in something sometimes, or pure JSON
        // Our existing logic in apex.ts handles this

        const data = await parseApexResponse(text);

        res.json({
            status: 'success',
            message: 'Successfully connected to Apex Timing',
            circuitId,
            data_preview: data ? 'Data received' : 'No data',
            raw_length: text.length
        });

    } catch (error) {
        console.error('Connection test failed:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to connect to Apex Timing',
            error: error instanceof Error ? error.message : String(error)
        });
    }
});

export default router;
