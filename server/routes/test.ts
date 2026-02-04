import express from 'express';

const router = express.Router();

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
        console.log('Apex response received, length:', text.length);

        // 2. Simple validation
        const hasData = text.length > 0 && (text.includes('driver') || text.includes('grid') || text.includes('class='));

        res.json({
            status: 'success',
            message: 'Successfully connected to Apex Timing',
            circuitId,
            data_preview: hasData ? 'Data received containing expected tags' : 'Response received but might be empty/invalid',
            response_length: text.length,
            sample: text.substring(0, 100)
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
