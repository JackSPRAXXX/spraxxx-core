// Express route for issuing WireGuard tunnels
import express from 'express';
import { generateKeypair } from '../wg/keys';
import { validateEntitlement } from '../models/storage'; // Placeholder for entitlement validation
import { storePeerPublicKey } from '../models/storage'; // Placeholder for storing the public key

const router = express.Router();

router.post('/issueTunnel', async (req, res) => {
    const userId = req.body.userId; // Get user ID from request
    const entitlementValid = await validateEntitlement(userId);

    if (!entitlementValid) {
        return res.status(403).json({ message: 'Invalid entitlement' });
    }

    const { publicKey: serverPublicKey, privateKey: clientPrivateKey } = generateKeypair();
    const peerPublicKey = req.body.peerPublicKey; // Get peer public key from request

    await storePeerPublicKey(userId, peerPublicKey);

    const config = {
        clientPrivateKey,
        serverPublicKey,
        endpoint: process.env.WG_SERVER_ENDPOINT,
        allowedIPs: process.env.WG_ALLOWED_IPS,
    };

    return res.json({ config });
});

export default router;
