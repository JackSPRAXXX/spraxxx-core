// Key generation logic
import nacl from 'tweetnacl';
import { encode } from 'tweetnacl-util';

export function generateKeypair() {
    const keypair = nacl.box.keyPair();
    return {
        publicKey: encode(keypair.publicKey),
        privateKey: encode(keypair.secretKey),
    };
}
