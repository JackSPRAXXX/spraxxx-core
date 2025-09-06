// Key generation logic
import nacl from 'tweetnacl';

// tweetnacl-util doesn't have proper TypeScript exports, so we'll use Buffer instead
function encodeBase64(data: Uint8Array): string {
    return Buffer.from(data).toString('base64');
}

export function generateKeypair() {
    const keypair = nacl.box.keyPair();
    return {
        publicKey: encodeBase64(keypair.publicKey),
        privateKey: encodeBase64(keypair.secretKey),
    };
}
