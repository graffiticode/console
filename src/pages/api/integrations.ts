import { NextApiRequest, NextApiResponse } from 'next';
import { createHash } from 'crypto';
import { getFirestore } from '../../utils/db';

interface FrontIntegration {
  authSecret: string;
  emails: string[];
  apiKeyId?: string;
}

function hashEmailAuth(authSecret: string, email: string): string {
  return createHash('sha256').update(authSecret + email).digest('hex');
}

interface IntegrationsSettings {
  front?: FrontIntegration;
  updatedAt?: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { userId } = req.query;

  if (!userId || typeof userId !== 'string') {
    return res.status(400).json({ error: 'User ID is required' });
  }

  const db = getFirestore();

  try {
    if (req.method === 'GET') {
      const settingsDoc = await db
        .collection('users')
        .doc(userId)
        .collection('settings')
        .doc('integrations')
        .get();

      const defaultSettings: IntegrationsSettings = {
        front: undefined,
      };

      if (settingsDoc.exists) {
        const data = settingsDoc.data() as IntegrationsSettings;
        // Mask the auth secret, showing only last 4 chars
        if (data?.front) {
          const secret = data.front.authSecret || '';
          const masked = secret.length > 4
            ? '••••••••' + secret.slice(-4)
            : secret.length > 0 ? '••••' : '';
          return res.status(200).json({
            ...data,
            front: {
              ...data.front,
              authSecret: masked,
              hasAuthSecret: !!data.front.authSecret,
              apiKeyId: data.front.apiKeyId,
            }
          });
        }
        return res.status(200).json(data);
      }

      return res.status(200).json(defaultSettings);
    } else if (req.method === 'POST' || req.method === 'PUT') {
      const updates = req.body as IntegrationsSettings;

      // Validate Front integration if provided
      if (updates.front) {
        if (updates.front.emails && !Array.isArray(updates.front.emails)) {
          return res.status(400).json({ error: 'emails must be an array' });
        }
      }

      const settingsRef = db
        .collection('users')
        .doc(userId)
        .collection('settings')
        .doc('integrations');

      const currentDoc = await settingsRef.get();
      const currentSettings = currentDoc.exists ? currentDoc.data() as IntegrationsSettings : {};

      // If authSecret is masked (starts with ••), preserve the existing secret
      let frontUpdate = updates.front;
      if (frontUpdate && frontUpdate.authSecret?.startsWith('••')) {
        frontUpdate = {
          ...frontUpdate,
          authSecret: currentSettings.front?.authSecret || '',
        };
      }

      // Build the new settings
      const newFront = frontUpdate ? {
        authSecret: frontUpdate.authSecret ?? currentSettings.front?.authSecret ?? '',
        emails: frontUpdate.emails ?? currentSettings.front?.emails ?? [],
        apiKeyId: frontUpdate.apiKeyId ?? currentSettings.front?.apiKeyId,
      } : currentSettings.front;

      const mergedSettings: IntegrationsSettings = {
        front: newFront,
        updatedAt: new Date().toISOString(),
      };

      await settingsRef.set(mergedSettings);

      // Sync integrations/front collection
      if (newFront?.authSecret && newFront?.apiKeyId) {
        const oldEmails = currentSettings.front?.emails || [];
        const newEmails = newFront.emails || [];
        const oldAuthSecret = currentSettings.front?.authSecret || '';
        const frontCollection = db.collection('integrations').doc('front').collection('emails');

        // Remove old hashes that are no longer valid
        for (const oldEmail of oldEmails) {
          const oldHash = hashEmailAuth(oldAuthSecret, oldEmail);
          // Only delete if email is removed or auth secret changed
          if (!newEmails.includes(oldEmail) || oldAuthSecret !== newFront.authSecret) {
            await frontCollection.doc(oldHash).delete();
          }
        }

        // Add/update new hashes
        for (const email of newEmails) {
          const hash = hashEmailAuth(newFront.authSecret, email);
          await frontCollection.doc(hash).set({
            userId: userId,
            apiKeyId: newFront.apiKeyId,
          });
        }
      }

      // Return masked version
      const responseSettings = { ...mergedSettings };
      if (responseSettings.front?.authSecret) {
        const secret = responseSettings.front.authSecret;
        responseSettings.front = {
          ...responseSettings.front,
          authSecret: secret.length > 4
            ? '••••••••' + secret.slice(-4)
            : '••••',
        };
      }

      return res.status(200).json({
        success: true,
        settings: responseSettings,
      });
    } else if (req.method === 'DELETE') {
      const settingsRef = db
        .collection('users')
        .doc(userId)
        .collection('settings')
        .doc('integrations');

      // Get current settings to clean up integrations/front
      const currentDoc = await settingsRef.get();
      if (currentDoc.exists) {
        const currentSettings = currentDoc.data() as IntegrationsSettings;
        if (currentSettings.front?.authSecret && currentSettings.front?.emails) {
          const frontCollection = db.collection('integrations').doc('front').collection('emails');
          // Delete all entries for this integration
          for (const email of currentSettings.front.emails) {
            const hash = hashEmailAuth(currentSettings.front.authSecret, email);
            await frontCollection.doc(hash).delete();
          }
        }
      }

      await settingsRef.delete();

      return res.status(200).json({ success: true });
    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Error handling integrations settings:', error);
    return res.status(500).json({
      error: 'Failed to process integrations settings',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
