import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const router = Router();
const prisma = new PrismaClient();

// GET /api/kyc/requirements - Returns the documents required for KYC
router.get('/requirements', (_req, res) => {
  res.json({
    requirements: [
      { id: 'id_document', type: 'DOCUMENT', country: 'ZA', documentType: 'NATIONAL_ID' },
      { id: 'selfie', type: 'SELFIE' },
    ],
  });
});

// POST /api/kyc/submit - Mocks submitting KYC documents
const kycSubmitSchema = z.object({
  userId: z.string(),
});

router.post('/submit', async (req, res, next) => {
  try {
    const { userId } = kycSubmitSchema.parse(req.body);

    // In a real implementation, we would receive files and send them to a KYC partner.
    // Here, we just create a mock attempt record.
    const kycAttempt = await prisma.kycAttempt.create({
      data: {
        userId,
        partner: 'MOCK',
        partnerRef: `mock_ref_${userId}_${new Date().getTime()}`,
        status: 'SUBMITTED',
      },
    });

    res.status(201).json(kycAttempt);
  } catch (err) {
    next(err);
  }
});

// GET /api/kyc/status/:userId - Gets the latest KYC status for a user
router.get('/status/:userId', async (req, res, next) => {
  try {
    const { userId } = req.params;
    const latestAttempt = await prisma.kycAttempt.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    if (!latestAttempt) {
      return res.status(404).json({ status: 'NOT_STARTED' });
    }

    // In a real app, we might need to check with the partner for status updates.
    // For this mock, we'll just return the stored status.
    res.json({
      status: latestAttempt.status,
      partnerRef: latestAttempt.partnerRef,
      checkedAt: latestAttempt.updatedAt,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
